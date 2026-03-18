import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import {
  orderConfirmationTemplate,
  adminNotificationTemplate,
} from '@/lib/email/templates'
import { paymentLimiter, withRateLimit } from '@/lib/rate-limit'

interface OrderItemInput {
  product_id: string
  quantity: number
  unit_price_ars: number
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = withRateLimit(request, paymentLimiter)
    if (rateLimited) return rateLimited

    const body = await request.json()
    console.log('[ORDER API] Payload recibido:', body)
    const {
      buyer_name,
      buyer_email,
      buyer_phone,
      buyer_dni,
      payment_method,
      items,
      coupon_code,
      subtotal_ars,
      discount_ars,
    } = body

    if (!buyer_name || !buyer_email || !payment_method || !items?.length) {
      console.error('[ORDER API] Faltan datos requeridos:', { buyer_name, buyer_email, payment_method, items })
      return NextResponse.json(
        { error: 'Datos requeridos faltantes' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminDb = createAdminClient()

    // 🔐 USER
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('[ORDER API] Usuario no autenticado')
      return NextResponse.json(
        { error: 'Debes iniciar sesión para comprar.' },
        { status: 401 }
      )
    }

    // 🧠 VALIDAR PRODUCTOS
    const validatedItems = []

    for (const item of items as OrderItemInput[]) {
      const { data: product } = await adminDb
        .from('products')
        .select('id, name, stock, is_active, price_ars')
        .eq('id', item.product_id)
        .single()

      if (!product || !product.is_active) {
        return NextResponse.json(
          { error: `Producto no disponible` },
          { status: 400 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para "${product.name}"` },
          { status: 400 }
        )
      }

      const safePrice =
        Number(item.unit_price_ars) ||
        Number(product.price_ars) ||
        0

      if (!safePrice || isNaN(safePrice)) {
        return NextResponse.json(
          { error: `Precio inválido en "${product.name}"` },
          { status: 400 }
        )
      }

      validatedItems.push({
        product,
        quantity: item.quantity,
        unit_price: safePrice,
      })
    }

    // 🎟 CUPON
    let couponId: string | null = null
    if (coupon_code) {
      const { data: coupon } = await adminDb
        .from('coupons')
        .select('id')
        .eq('code', coupon_code.toUpperCase().trim())
        .single()

      couponId = coupon?.id ?? null
    }

    // 🧠 PRIMERA COMPRA
    const { data: previousOrders } = await adminDb
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['paid', 'refunded'])
      .limit(1)

    const isFirstPurchase = !previousOrders?.length

    const firstDiscount = isFirstPurchase
      ? Math.round(subtotal_ars * 0.05)
      : 0

    const manualDiscount = discount_ars ?? 0
    const finalDiscount = manualDiscount + firstDiscount
    const finalTotal = Math.max(0, subtotal_ars - finalDiscount)

    // 🧾 CREAR ORDEN
    const { data: order, error: orderError } = await adminDb
      .from('orders')
      .insert({
        user_id: user.id,
        status:
          payment_method === 'transfer'
            ? 'payment_pending'
            : 'pending',
        payment_method,
        subtotal_ars,
        discount_ars: finalDiscount,
        total_ars: finalTotal,
        buyer_name,
        buyer_email,
        buyer_phone: buyer_phone || null,
        buyer_dni: buyer_dni || null,
        is_first_purchase: isFirstPurchase,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('[ORDER ERROR]', orderError)
      return NextResponse.json(
        { error: 'Error al crear la orden' },
        { status: 500 }
      )
    }

    // 📦 ORDER ITEMS
    const orderItemsData = validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_snapshot: {
        id: item.product.id,
        name: item.product.name,
        price_ars: item.product.price_ars,
      },
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.unit_price * item.quantity,
    }))

    const { error: itemsError } = await adminDb
      .from('order_items')
      .insert(orderItemsData)

    if (itemsError) {
      console.error('[ITEMS ERROR]', itemsError)
      return NextResponse.json(
        { error: 'Error al guardar items' },
        { status: 500 }
      )
    }

    // 📉 STOCK
    for (const item of validatedItems) {
      await adminDb.rpc('decrement_stock', {
        p_product_id: item.product.id,
        p_quantity: item.quantity,
      })
    }

    // 💳 MERCADOPAGO
    let responseData: any = { order_id: order.id }

    if (payment_method === 'mercadopago') {
      const token = process.env.MP_ACCESS_TOKEN

      if (!token) {
        return NextResponse.json(
          { error: 'MP no configurado' },
          { status: 500 }
        )
      }

      const ratio =
        subtotal_ars > 0
          ? (subtotal_ars - finalDiscount) / subtotal_ars
          : 1

      const mpItems = orderItemsData.map((item) => {
        const adjustedPrice = Math.max(
          1,
          Math.round(item.unit_price * ratio)
        )

        return {
          id: item.product_id,
          title: item.product_snapshot.name || 'Producto',
          quantity: item.quantity,
          unit_price: adjustedPrice,
          currency_id: 'ARS',
        }
      })

      console.log('[MP ITEMS]', mpItems)

      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        'http://localhost:3000'

      const mpRes = await fetch(
        'https://api.mercadopago.com/checkout/preferences',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: mpItems,
            payer: {
              name: buyer_name,
              email: buyer_email,
            },
            external_reference: order.id,
            notification_url: `${baseUrl}/api/webhooks/mercadopago`,
          }),
        }
      )

      if (!mpRes.ok) {
        const err = await mpRes.text()
        console.error('[MP ERROR]', err)
        return NextResponse.json(
          { error: 'Error MercadoPago' },
          { status: 500 }
        )
      }

      const mpData = await mpRes.json()

      await adminDb
        .from('orders')
        .update({ payment_ref: mpData.id })
        .eq('id', order.id)

      responseData.init_point =
        mpData.init_point || mpData.sandbox_init_point
    }

    // 📧 EMAIL (no bloqueante)
    sendEmail({
      to: buyer_email,
      subject: `Orden ${order.id}`,
      html: orderConfirmationTemplate({
        orderReference: order.id,
        buyerName: buyer_name,
        buyerEmail: buyer_email,
        items: orderItemsData.map((i) => ({
          name: i.product_snapshot.name,
          quantity: i.quantity,
          price: i.unit_price,
        })),
        total: finalTotal,
        paymentMethod: payment_method,
        orderDate: new Date().toLocaleDateString('es-AR'),
      }),
    }).catch(console.error)

    return NextResponse.json(responseData)
  } catch (err) {
    console.error('[CHECKOUT FATAL]', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}