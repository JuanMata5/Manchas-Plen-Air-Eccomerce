import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateMultipleTicketsPDF, type TicketData } from '@/lib/pdf/ticket-generator'

const VALID_TICKET_ORDER_STATUS = ['paid']

function genTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'PA-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('order_id')
    if (!orderId) {
      return NextResponse.json({ error: 'order_id requerido' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminDb = createAdminClient()
    const { data: order, error: orderError } = await adminDb
      .from('orders')
      .select('status, buyer_name, buyer_dni')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (!VALID_TICKET_ORDER_STATUS.includes(order.status)) {
      return NextResponse.json({ error: 'Solo se pueden descargar tickets de órdenes pagas' }, { status: 400 })
    }

    let { data: tickets } = await adminDb
      .from('tickets')
      .select('id, qr_code, holder_name, holder_dni, product_id')
      .eq('order_id', orderId)

    if (!tickets || tickets.length === 0) {
      const { data: orderItems, error: itemsError } = await adminDb
        .from('order_items')
        .select('id, quantity, product_id')
        .eq('order_id', orderId)

      if (itemsError || !orderItems || orderItems.length === 0) {
        return NextResponse.json({ error: 'No se encontraron items para esta orden' }, { status: 404 })
      }

      const ticketsToCreate = orderItems.flatMap((item: any) =>
        Array.from({ length: item.quantity }, () => ({
          order_id: orderId,
          product_id: item.product_id,
          order_item_id: item.id,
          qr_code: genTicketCode(),
          holder_name: order.buyer_name,
          holder_email: order.buyer_email,
          holder_dni: order.buyer_dni,
        })),
      )

      const { error: insertError } = await adminDb.from('tickets').insert(ticketsToCreate)
      if (insertError) {
        console.error('[ADMIN] Error inserting tickets for PDF download:', insertError)
        return NextResponse.json({ error: 'Error generando tickets para descarga' }, { status: 500 })
      }

      tickets = ticketsToCreate
    }

    const productIds = [...new Set((tickets ?? []).map((ticket: any) => ticket.product_id))].filter(Boolean)
    const { data: products } = await adminDb
      .from('products')
      .select('id, name, event_date, event_location')
      .in('id', productIds)

    const productMap = new Map((products ?? []).map((product: any) => [product.id, product]))

    const ticketData: TicketData[] = tickets.map((ticket: any) => {
      const product = productMap.get(ticket.product_id)
      return {
        orderReference: orderId.slice(0, 8).toUpperCase(),
        ticketCode: ticket.qr_code,
        holderName: ticket.holder_name,
        dni: ticket.holder_dni || order.buyer_dni || '-',
        productName: product?.name || 'Entrada',
        eventName: product?.name || 'Evento',
        eventDate: product?.event_date || undefined,
        eventLocation: product?.event_location || undefined,
      }
    })

    const pdfBuffer = await generateMultipleTicketsPDF(ticketData)

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="tickets-${orderId.slice(0, 8).toUpperCase()}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[ADMIN] Download PDF error:', err)
    return NextResponse.json({ error: 'Error interno al generar el PDF' }, { status: 500 })
  }
}
