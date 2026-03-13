import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { order_id } = await request.json()

    if (!order_id) {
      return NextResponse.json({ error: 'order_id requerido' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Get order and verify it belongs to the user
    const { data: order } = await adminDb
      .from('orders')
      .select('*, order_items(*, products(name))')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (order.status !== 'pending' && order.status !== 'payment_pending') {
      return NextResponse.json({ error: 'Esta orden no se puede pagar' }, { status: 400 })
    }

    if (order.payment_method !== 'mercadopago') {
      return NextResponse.json({ error: 'Esta orden no es de Mercado Pago' }, { status: 400 })
    }

    const mpAccessToken = process.env.MP_ACCESS_TOKEN
    if (!mpAccessToken) {
      return NextResponse.json({ error: 'Mercado Pago no configurado' }, { status: 500 })
    }

    // Build MP preference
    const mpItems = (order.order_items ?? []).map((item: any) => ({
      id: item.product_id,
      title: item.products?.name || 'Producto Plen Air',
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      currency_id: 'ARS',
    }))

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const isHttps = baseUrl.startsWith('https')

    const preference: Record<string, any> = {
      items: mpItems,
      payer: {
        name: order.buyer_name,
        email: order.buyer_email,
      },
      external_reference: order.id,
      statement_descriptor: 'PLEN AIR',
    }

    if (isHttps) {
      preference.back_urls = {
        success: `${baseUrl}/checkout/success?order_id=${order.id}`,
        failure: `${baseUrl}/cuenta/mis-ordenes`,
        pending: `${baseUrl}/cuenta/mis-ordenes`,
      }
      preference.auto_return = 'approved'
    }

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
      console.error('[RETRY PAY] MP error:', mpRes.status, mpErr)
      return NextResponse.json({ error: 'Error al crear preferencia de pago' }, { status: 500 })
    }

    const mpData = await mpRes.json()
    const initPoint = mpData.init_point || mpData.sandbox_init_point

    // Update order with new payment ref
    await adminDb
      .from('orders')
      .update({ payment_ref: mpData.id })
      .eq('id', order_id)

    return NextResponse.json({ init_point: initPoint })
  } catch (err) {
    console.error('[RETRY PAY]', err)
    return NextResponse.json({ error: 'Error al generar pago' }, { status: 500 })
  }
}
