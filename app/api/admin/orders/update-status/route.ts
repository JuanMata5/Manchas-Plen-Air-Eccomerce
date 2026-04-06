import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { paymentConfirmedTemplate } from '@/lib/email/templates'
import { generateMultipleTicketsPDF, type TicketData } from '@/lib/pdf/ticket-generator'

const VALID_STATUSES = ['pending', 'payment_pending', 'paid', 'cancelled', 'refunded']

function genTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'PA-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Auth check
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
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const adminDb = createAdminClient()
  const { order_id, status } = await request.json()

  if (!order_id || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
  }

  const { error } = await adminDb
    .from('orders')
    .update({ status })
    .eq('id', order_id)

  if (error) {
    console.error('[ADMIN] Update status error:', error)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }

  // If marking as paid and no tickets yet, generate them
  if (status === 'paid') {
    const { data: existingTickets } = await adminDb
      .from('tickets')
      .select('id')
      .eq('order_id', order_id)

    if (!existingTickets || existingTickets.length === 0) {
      const { data: orderItems, error: itemsErr } = await adminDb
        .from('order_items')
        .select('*')
        .eq('order_id', order_id)

      console.log('[ADMIN] Order items found:', orderItems?.length ?? 0, 'error:', itemsErr)

      const { data: order, error: orderErr } = await adminDb
        .from('orders')
        .select('buyer_name, buyer_email, buyer_dni, total_ars')
        .eq('id', order_id)
        .single()

      if (orderItems && order) {
        // Get product names for the PDF
        const productIds = [...new Set(orderItems.map((i: any) => i.product_id))]
        const { data: products } = await adminDb
          .from('products')
          .select('id, name')
          .in('id', productIds)
        const productMap = new Map((products ?? []).map((p: any) => [p.id, p.name]))

        const tickets = orderItems.flatMap((item: { id: string; quantity: number; product_id: string }) =>
          Array.from({ length: item.quantity }, () => ({
            order_id,
            product_id: item.product_id,
            order_item_id: item.id,
            qr_code: genTicketCode(),
            holder_name: order.buyer_name,
            holder_email: order.buyer_email,
            holder_dni: order.buyer_dni,
          })),
        )
        if (tickets.length > 0) {
          const { error: ticketError } = await adminDb.from('tickets').insert(tickets)
          if (ticketError) {
            console.error('[ADMIN] Error inserting tickets:', ticketError)
            return NextResponse.json({ ok: true, warning: 'Orden actualizada pero error al generar tickets' })
          }
          console.log('[ADMIN] Tickets created:', tickets.length)

          // Return success with ticket count before PDF generation (fire-and-forget)
          const ticketDataForPDF: TicketData[] = tickets.map((t) => ({
            orderReference: order_id.slice(0, 8).toUpperCase(),
            ticketCode: t.qr_code,
            holderName: t.holder_name,
            dni: t.holder_dni || order.buyer_dni || '-',
            productName: productMap.get(t.product_id) || 'Entrada',
          }))

          generateMultipleTicketsPDF(ticketDataForPDF)
            .then((pdfBuffer) => {
              return sendEmail({
                to: order.buyer_email,
                subject: `Tus tickets — Orden #${order_id.slice(0, 8).toUpperCase()}`,
                html: paymentConfirmedTemplate({
                  orderReference: order_id,
                  buyerName: order.buyer_name,
                  total: order.total_ars ?? 0,
                  paymentDate: new Date().toISOString(),
                  ticketCount: tickets.length,
                  eventName: 'Manchas Plen Air',
                }),
                attachments: [
                  {
                    content: pdfBuffer.toString('base64'),
                    filename: `tickets-${order_id.slice(0, 8).toUpperCase()}.pdf`,
                    type: 'application/pdf',
                  },
                ],
              })
            })
            .catch((e) => console.warn('[ADMIN] Ticket PDF email failed:', e))

          return NextResponse.json({ ok: true, tickets_created: tickets.length })
        }
      } else {
        console.log('[ADMIN] No order data found. orderItems:', !!orderItems, 'order:', !!order)
      }
    } else {
      console.log('[ADMIN] Tickets already exist for order:', order_id, 'count:', existingTickets?.length)
    }
  }

  return NextResponse.json({ ok: true })
}
