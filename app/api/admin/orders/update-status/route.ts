import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
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
        .select('buyer_name, buyer_email, buyer_dni')
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
            productName: productMap.get(t.product_id) || 'Entrada',
          }))

          generateMultipleTicketsPDF(ticketDataForPDF)
            .then((pdfBuffer) => {
              return sendEmail({
                to: order.buyer_email,
                subject: `Tus tickets — Orden #${order_id.slice(0, 8).toUpperCase()}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #1a1a1a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
                      <h1 style="color: #fff; font-size: 24px; margin: 0;">Manchas Plen Air</h1>
                    </div>
                    <div style="padding: 24px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
                      <p>Hola <strong>${order.buyer_name}</strong>,</p>
                      <p>Tu pago fue confirmado. Adjuntamos tus tickets con los codigos QR.</p>
                      <div style="background: #dcfce7; color: #166534; padding: 12px 16px; border-radius: 8px; text-align: center; font-weight: bold; margin: 16px 0;">
                        ${tickets.length} ticket${tickets.length > 1 ? 's' : ''} disponible${tickets.length > 1 ? 's' : ''}
                      </div>
                      <p style="font-size: 14px; color: #666;">Tambien podes ver tus tickets en tu cuenta: <strong>Mis tickets</strong></p>
                      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                      <p style="color: #999; font-size: 12px; text-align: center;">Manchas Plen Air</p>
                    </div>
                  </div>
                `,
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
