import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/sendgrid'
import { paymentConfirmedTemplate } from '@/lib/email/templates'
import { generateMultipleTicketsPDF } from '@/lib/pdf/ticket-generator'

function genTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'PA-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const adminDb = createAdminClient()

    // Log raw webhook
    await adminDb.from('webhook_logs').insert({
      source: 'mercadopago',
      provider: 'mercadopago',
      event_type: body.type ?? 'unknown',
      payload: body,
    })

    if (body.type !== 'payment') {
      return NextResponse.json({ received: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ received: true })
    }

    // Fetch payment details from MP API
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    })

    if (!mpRes.ok) {
      console.error('[WEBHOOK] MP payment fetch error:', await mpRes.text())
      return NextResponse.json({ error: 'Cannot fetch payment' }, { status: 500 })
    }

    const payment = await mpRes.json()
    const orderId = payment.external_reference

    if (!orderId) {
      return NextResponse.json({ received: true })
    }

    let newStatus: string | null = null

    if (payment.status === 'approved') {
      newStatus = 'paid'
    } else if (payment.status === 'rejected' || payment.status === 'cancelled') {
      newStatus = 'cancelled'
    }

    if (newStatus) {
      await adminDb
        .from('orders')
        .update({
          status: newStatus,
          mp_payment_id: String(paymentId),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      // Generate tickets on successful payment
      if (newStatus === 'paid') {
        const { data: existingTickets } = await adminDb
          .from('tickets')
          .select('id')
          .eq('order_id', orderId)

        // Only generate if no tickets exist yet (idempotency)
        if (!existingTickets || existingTickets.length === 0) {
          const { data: orderItems } = await adminDb
            .from('order_items')
            .select('*')
            .eq('order_id', orderId)

          const { data: order } = await adminDb
            .from('orders')
            .select('buyer_name, buyer_dni, buyer_email, total_ars')
            .eq('id', orderId)
            .single()

          if (orderItems && order) {
            const tickets = orderItems.flatMap((item: any) =>
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

            if (tickets.length > 0) {
              const { error: ticketError } = await adminDb.from('tickets').insert(tickets)
              if (ticketError) {
                console.error('[WEBHOOK] Error inserting tickets:', ticketError)
              }
            }

            // Send email with ticket PDF
            try {
              const { data: productsData } = await adminDb
                .from('products')
                .select('id, name, event_date, event_location')
                .in('id', orderItems.map((oi: any) => oi.product_id))

              const ticketData = tickets.map((t) => {
                const product = productsData?.find((p: any) => p.id === t.product_id)
                return {
                  orderReference: orderId,
                  ticketCode: t.qr_code,
                  holderName: t.holder_name,
                  productName: product?.name || 'Entrada',
                  eventDate: product?.event_date,
                  eventLocation: product?.event_location,
                }
              })

              const pdfBuffer = await generateMultipleTicketsPDF(ticketData)

              await sendEmail({
                to: order.buyer_email,
                subject: `¡Tus entradas para Plen Air! - Orden ${orderId.slice(0, 8).toUpperCase()}`,
                html: paymentConfirmedTemplate({
                  orderReference: orderId,
                  buyerName: order.buyer_name,
                  total: order.total_ars,
                  paymentDate: new Date().toISOString(),
                  ticketCount: tickets.length,
                  eventName: 'Plen Air',
                }),
                attachments: [
                  {
                    content: pdfBuffer.toString('base64'),
                    filename: `entradas-${orderId.slice(0, 8)}.pdf`,
                    type: 'application/pdf',
                  },
                ],
              })

              console.log('[WEBHOOK] Email sent with tickets to:', order.buyer_email)
            } catch (emailErr) {
              console.error('[WEBHOOK] Error sending email with tickets:', emailErr)
            }
          }
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[WEBHOOK] Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
