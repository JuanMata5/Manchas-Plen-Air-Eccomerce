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
    // Obtener orden actualizada para manejar montos y cupones
    const { data: existingOrder } = await adminDb
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    // Actualizar montos: marcar como pagado completamente
    try {
      const total = Number(existingOrder?.total_ars ?? 0)
      await adminDb
        .from('orders')
        .update({ amount_paid_ars: total, balance_due_ars: 0, updated_at: new Date().toISOString() })
        .eq('id', order_id)
    } catch (amtErr) {
      console.error('[ADMIN] Error updating order amounts:', amtErr)
    }

    // Incrementar uso de cupón de forma idempotente si aplica
    try {
      if (existingOrder?.coupon_id && !existingOrder?.mp_payment_id) {
        try {
          await adminDb.rpc('increment_coupon_usage', { p_coupon_id: existingOrder.coupon_id })
        } catch (rpcErr) {
          console.warn('[ADMIN] RPC increment_coupon_usage failed, falling back to manual update:', rpcErr)
          try {
            const { data: coupon } = await adminDb.from('coupons').select('id, current_uses, uses_count, used_count').eq('id', existingOrder.coupon_id).single()
            const current = Number(coupon?.uses_count ?? coupon?.current_uses ?? coupon?.used_count ?? 0)
            await adminDb.from('coupons').update({ uses_count: current + 1 }).eq('id', existingOrder.coupon_id)
          } catch (fallbackErr) {
            console.error('[ADMIN] Fallback updating coupon failed:', fallbackErr)
          }
        }
      }
    } catch (rpcErr) {
      console.error('[ADMIN] Error incrementing coupon usage:', rpcErr)
    }
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
        .select('buyer_name, buyer_email, buyer_dni, buyer_phone, total_ars')
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
            holder_phone: order.buyer_phone,
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
            phone: t.holder_phone || order.buyer_phone || '-',
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

          // Confirmar reservas de viaje asociadas a la orden (si las hay)
          try {
            const { data: travelBookings } = await adminDb
              .from('travel_bookings')
              .select('*')
              .eq('order_id', order_id)

            if (travelBookings && travelBookings.length > 0) {
              const isDeposit = existingOrder?.payment_option === 'deposit' || existingOrder?.payment_option === 'reservation'
              const newPaymentStatus = isDeposit ? 'deposit_paid' : 'paid'

              await adminDb
                .from('travel_bookings')
                .update({ payment_status: newPaymentStatus, reservation_status: 'confirmed', balance_due: 0 })
                .eq('order_id', order_id)
            }
          } catch (tbErr) {
            console.error('[ADMIN] Error confirming travel bookings:', tbErr)
          }

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
