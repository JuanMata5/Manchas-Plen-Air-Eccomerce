import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import {
  orderConfirmationTemplate,
  adminNotificationTemplate,
} from '@/lib/email/templates'
import { paymentLimiter, withRateLimit } from '@/lib/rate-limit'

interface ProductItemInput {
  type?: 'product'
  product_id: string
  quantity: number
  unit_price_ars: number
}

interface ExperienceItemInput {
  type: 'experience'
  id: string
  name: string
  price_ars_blue: number
  price_usd: number
  quantity: number
  metadata: {
    experienceId: string
    planIndex: number
    planName: string
    location: string
    dates: string
  }
}

type OrderItemInput = ProductItemInput | ExperienceItemInput

function isExperienceItem(item: OrderItemInput): item is ExperienceItemInput {
  return item.type === 'experience'
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

    // Separar items en productos y experiencias
    const productItems = items.filter((i: OrderItemInput) => !isExperienceItem(i)) as ProductItemInput[]
    const experienceItems = items.filter((i: OrderItemInput) => isExperienceItem(i)) as ExperienceItemInput[]

    // 🧠 VALIDAR PRODUCTOS
    const validatedProductItems = []

    for (const item of productItems) {
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

      validatedProductItems.push({
        product,
        quantity: item.quantity,
        unit_price: safePrice,
      })
    }

    // 🧠 VALIDAR EXPERIENCIAS
    const validatedExperienceItems = []
    for (const item of experienceItems) {
      const { data: experience } = await adminDb
        .from('travel_experiences')
        .select('id, title, capacity, is_active')
        .eq('id', item.metadata.experienceId)
        .single()

      if (!experience || !experience.is_active) {
        return NextResponse.json(
          { error: `Experiencia no disponible: ${item.name}` },
          { status: 400 }
        )
      }

      validatedExperienceItems.push({
        experience,
        item,
        unit_price: item.price_ars_blue,
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

    const manualDiscount = discount_ars ?? 0
    const finalDiscount = manualDiscount
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
        is_first_purchase: false,
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

    // 📦 ORDER ITEMS (PRODUCTOS)
    const orderItemsData = validatedProductItems.map((item) => ({
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

    if (orderItemsData.length > 0) {
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
    }

    // 🎫 TRAVEL BOOKINGS (EXPERIENCIAS)
    const travelBookingsData = validatedExperienceItems.map((item) => {
      const bookingRef = `RES-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      return {
        order_id: order.id,
        experience_id: item.experience.id,
        booking_reference: bookingRef,
        customer_name: buyer_name,
        customer_email: buyer_email,
        customer_phone: buyer_phone || null,
        plan_name: item.item.metadata.planName,
        location: item.item.metadata.location,
        dates: item.item.metadata.dates,
        price_usd: item.item.price_usd,
        price_ars_blue: item.item.price_ars_blue,
        status: payment_method === 'transfer' ? 'payment_pending' : 'pending',
      }
    })

    if (travelBookingsData.length > 0) {
      const { error: bookingsError } = await adminDb
        .from('travel_bookings')
        .insert(travelBookingsData)

      if (bookingsError) {
        console.error('[BOOKINGS ERROR]', bookingsError)
        return NextResponse.json(
          { error: 'Error al guardar reservas de experiencias' },
          { status: 500 }
        )
      }
    }

    // 📉 STOCK (SOLO PRODUCTOS)
    for (const item of validatedProductItems) {
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

      const mpItems = [
        ...orderItemsData.map((item) => {
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
        }),
        ...travelBookingsData.map((booking) => {
          const adjustedPrice = Math.max(
            1,
            Math.round(booking.price_ars_blue * ratio)
          )

          return {
            id: booking.experience_id,
            title: `${booking.plan_name} - ${booking.location}`,
            quantity: 1,
            unit_price: adjustedPrice,
            currency_id: 'ARS',
          }
        }),
      ]

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
    // Enviar email al usuario
    const emailItems = [
      ...orderItemsData.map((i) => ({
        name: i.product_snapshot.name,
        quantity: i.quantity,
        price: i.unit_price,
      })),
      ...travelBookingsData.map((b) => ({
        name: `${b.plan_name} - ${b.location}`,
        quantity: 1,
        price: b.price_ars_blue,
      })),
    ]

    sendEmail({
      to: buyer_email,
      subject: `Orden ${order.id}`,
      html: orderConfirmationTemplate({
        orderReference: order.id,
        buyerName: buyer_name,
        buyerEmail: buyer_email,
        items: emailItems,
        total: finalTotal,
        paymentMethod: payment_method,
        orderDate: new Date().toLocaleDateString('es-AR'),
        bankData: payment_method === 'transfer' ? [
          {
            bankName: 'Banco Provincia',
            cbu: '0140009003400951112934',
            alias: 'VOLCAN.JAGUAR.CLIMA',
            holder: 'Liliana Viviana Paola Nievas',
            cuit: '27-21473468-6',
            currency: 'ARS',
          },
          {
            bankName: 'Banco Provincia',
            cbu: '0290002511000000179412',
            alias: 'TROTE.DAMA.FUENTE',
            holder: 'Liliana Viviana Paola Nievas',
            cuit: '27-21473468-6',
            account_number: '000000020400017941',
            currency: 'USD',
          },
        ] : undefined,
      }),
    }).catch(console.error)

    // Si es transferencia bancaria, enviar email al admin
    if (payment_method === 'transfer') {
      sendEmail({
        to: ['soporte@plenair.com.ar', 'jujuusmata@gmail.com'],
        subject: `Nueva orden por transferencia #${order.id}`,
        html: adminNotificationTemplate({
          orderReference: order.id,
          buyerName: buyer_name,
          buyerEmail: buyer_email,
          items: emailItems,
          total: finalTotal,
          paymentMethod: payment_method,
          orderDate: new Date().toLocaleDateString('es-AR'),
        }),
      }).catch(console.error)
    }

    return NextResponse.json(responseData)
  } catch (err) {
    console.error('[CHECKOUT FATAL]', err)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

