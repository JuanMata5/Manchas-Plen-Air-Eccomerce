import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { orderConfirmationTemplate, adminNotificationTemplate } from '@/lib/email/templates'
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
      total_ars,
    } = body

    if (!buyer_name || !buyer_email || !payment_method || !items?.length) {
      return NextResponse.json({ error: 'Datos requeridos faltantes' }, { status: 400 })
    }

    const supabase = await createClient()
    const adminDb = createAdminClient()

    // Validate stock for all items
    for (const item of items as OrderItemInput[]) {
      const { data: product } = await adminDb
        .from('products')
        .select('id, stock, is_active, name')
        .eq('id', item.product_id)
        .single()

      if (!product || !product.is_active) {
        return NextResponse.json(
          { error: `Producto no disponible` },
          { status: 400 },
        )
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para "${product.name}"` },
          { status: 400 },
        )
      }
    }

    // Resolve coupon id
    let couponId: string | null = null
    if (coupon_code) {
      const { data: coupon } = await adminDb
        .from('coupons')
        .select('id')
        .eq('code', coupon_code.toUpperCase().trim())
        .single()
      couponId = coupon?.id ?? null
    }

    // Get authenticated user (REQUIRED)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesión para comprar.' }, { status: 401 })
    }

    // Check first purchase discount (solo si es la primera compra y solo se aplicará si el pago es exitoso)
    let isFirstPurchase = false
    const { data: previousOrders } = await adminDb
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['paid', 'refunded'])
      .limit(1)

    if (!previousOrders || previousOrders.length === 0) {
      isFirstPurchase = true
    }

    // Calcular descuento de primera compra (10%) si corresponde
    let firstPurchaseDiscount = 0
    if (isFirstPurchase) {
      firstPurchaseDiscount = Math.round(subtotal_ars * 0.10)
    }

    // El descuento final es la suma de cupones manuales + descuento de primera compra
    const manualDiscount = discount_ars ?? 0
    const finalDiscount = manualDiscount + firstPurchaseDiscount
    const finalTotal = subtotal_ars - finalDiscount

    // Crear orden con TODOS los descuentos aplicados
    const { data: order, error: orderError } = await adminDb
      .from('orders')
      .insert({
        user_id: user.id,
        status: payment_method === 'transfer' ? 'payment_pending' : 'pending',
        payment_method,
        subtotal_ars,
        discount_ars: finalDiscount, 
        total_ars: finalTotal,
        buyer_name,
        buyer_email,
        buyer_phone: buyer_phone || null,
        buyer_dni: buyer_dni || null,
        is_first_purchase: isFirstPurchase, // Guardamos si fue detectada como primera compra
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('[v0] Order creation error:', orderError)
      return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 })
    }

    // Insert order items with product snapshot
    const orderItemsData = await Promise.all(
      (items as OrderItemInput[]).map(async (item) => {
        const { data: product } = await adminDb
          .from('products')
          .select('*')
          .eq('id', item.product_id)
          .single()
        return {
          order_id: order.id,
          product_id: item.product_id,
          product_snapshot: product || { id: item.product_id, name: 'Producto' },
          quantity: item.quantity,
          unit_price: item.unit_price_ars,
          total_price: item.unit_price_ars * item.quantity,
        }
      }),
    )

    const { error: itemsError } = await adminDb.from('order_items').insert(orderItemsData)
    if (itemsError) {
      console.error('[v0] Order items error:', itemsError)
      return NextResponse.json({ error: 'Error al guardar items de la orden' }, { status: 500 })
    }

    // Decrement stock (non-blocking)
    for (const item of items as OrderItemInput[]) {
      try {
        await adminDb.rpc('decrement_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        })
      } catch (e) {
        console.warn('[v0] decrement_stock failed:', e)
      }
    }

    // Increment coupon usage (non-blocking)
    if (couponId) {
      try {
        await adminDb.rpc('increment_coupon_usage', { p_coupon_id: couponId })
      } catch (e) {
        console.warn('[v0] increment_coupon_usage failed:', e)
      }
    }

    // ============================================================
    // HANDLE PAYMENT FIRST (before emails to avoid timeout)
    // ============================================================

    let responseData: Record<string, string> = { order_id: order.id }

    // Transfer: generate reference
    if (payment_method === 'transfer') {
      const ref = `PA-${order.id.slice(0, 8).toUpperCase()}`
      await adminDb
        .from('orders')
        .update({ transfer_ref: ref, bank_transfer_ref: ref })
        .eq('id', order.id)
      responseData.bank_transfer_ref = ref
    }

    // Mercado Pago: create preference
    if (payment_method === 'mercadopago') {
      const mpAccessToken = process.env.MP_ACCESS_TOKEN
      if (!mpAccessToken) {
        return NextResponse.json(
          { error: 'Mercado Pago no configurado' },
          { status: 500 },
        )
      }

      const mpItems = orderItemsData.map((item) => {
        const product = (item.product_snapshot as any)
        const unitPrice = Number(item.unit_price)
        
        // Aplicar descuento proporcional si existe
        // discount_ars es el total de descuento de la orden
        // subtotal_ars es el total sin descuento de la orden
        const ratio = subtotal_ars > 0 ? (subtotal_ars - finalDiscount) / subtotal_ars : 1
        const adjustedPrice = Math.round(unitPrice * ratio)

        return {
          id: item.product_id,
          title: product?.name || 'Producto',
          quantity: item.quantity,
          unit_price: adjustedPrice,
          currency_id: 'ARS',
        }
      })

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const isHttps = baseUrl.startsWith('https')

      const preference: Record<string, any> = {
        items: mpItems,
        payer: {
          name: buyer_name,
          email: buyer_email,
        },
        external_reference: order.id,
        statement_descriptor: 'PLEN AIR',
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
      }

      // MP requires HTTPS for back_urls + auto_return
      if (isHttps) {
        preference.back_urls = {
          success: `${baseUrl}/checkout/success?order_id=${order.id}`,
          failure: `${baseUrl}/checkout/error?order_id=${order.id}`,
          pending: `${baseUrl}/checkout/pendiente?order_id=${order.id}`,
        }
        preference.auto_return = 'approved'
      }

      console.log('[MP] Creating preference with items:', JSON.stringify(mpItems))

      const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mpAccessToken}`,
        },
        body: JSON.stringify(preference),
      })

      if (!mpRes.ok) {
        const mpErr = await mpRes.text()
        console.error('[MP] Preference error:', mpRes.status, mpErr)
        return NextResponse.json({ error: 'Error al crear preferencia de pago' }, { status: 500 })
      }

      const mpData = await mpRes.json()
      console.log('[MP] Preference created:', mpData.id)

      const initPoint = mpData.init_point || mpData.sandbox_init_point

      await adminDb
        .from('orders')
        .update({ payment_ref: mpData.id })
        .eq('id', order.id)

      responseData.init_point = initPoint
    }

    // ============================================================
    // SEND EMAILS IN BACKGROUND (don't block response)
    // ============================================================

    const itemsWithDetails = orderItemsData.map((item) => ({
      name: (item.product_snapshot as any)?.name || 'Producto',
      quantity: item.quantity,
      price: item.unit_price,
    }))

    // Fire and forget - don't await
    sendEmail({
      to: buyer_email,
      subject: `Confirmación de orden ${order.id.slice(0, 8).toUpperCase()}`,
      html: orderConfirmationTemplate({
        orderReference: order.id,
        buyerName: buyer_name,
        buyerEmail: buyer_email,
        items: itemsWithDetails,
        total: finalTotal,
        paymentMethod: payment_method as 'mercadopago' | 'transfer',
        bankData: payment_method === 'transfer'
          ? {
              bankName: process.env.BANK_NAME || 'Banco',
              cbu: process.env.BANK_CBU || '',
              alias: process.env.BANK_ALIAS || '',
              holder: process.env.BANK_HOLDER || '',
              cuit: process.env.BANK_CUIT || '',
            }
          : undefined,
        orderDate: new Date().toLocaleDateString('es-AR'),
      }),
    }).catch((e) => console.warn('[EMAIL] Confirmation failed:', e))

    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      sendEmail({
        to: adminEmail,
        subject: `Nueva orden ${order.id.slice(0, 8).toUpperCase()} - ${buyer_name}`,
        html: adminNotificationTemplate({
          orderReference: order.id,
          buyerName: buyer_name,
          buyerEmail: buyer_email,
          buyerPhone: buyer_phone || undefined,
          items: itemsWithDetails.map((i) => ({ name: i.name, quantity: i.quantity })),
          total: finalTotal,
          paymentMethod: payment_method,
          timestamp: new Date().toISOString(),
        }),
      }).catch((e) => console.warn('[EMAIL] Admin notification failed:', e))
    }

    return NextResponse.json(responseData)
    // Si el pago fue exitoso y es la primera compra, aplicar descuento de primera compra (10%)
    // Esto debe hacerse en el webhook de pago exitoso, NO aquí, para cumplir la lógica exacta.
  } catch (err) {
    console.error('[v0] Checkout error:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
