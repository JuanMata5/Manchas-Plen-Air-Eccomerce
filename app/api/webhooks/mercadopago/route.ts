import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { generateBookingPDF } from '@/lib/pdf/booking-generator'
import { generateMultipleTicketsPDF, type TicketData } from '@/lib/pdf/ticket-generator'
import { roundMoney } from '@/lib/travel-payment'
import { paymentConfirmedTemplate } from '@/lib/email/templates'

async function fetchPayment(id: string) {
  const token = process.env.MP_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!response.ok) throw new Error(`Mercado Pago respondió ${response.status}`)
  return response.json()
}

function genTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return 'PA-' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function createAndEmailOrderTickets(db: ReturnType<typeof createAdminClient>, order: any) {
  if (order.ticket_email_sent_at) return

  const { data: existingTicketRows, error: ticketsLookupError } = await db
    .from('tickets')
    .select('id, order_id, product_id, order_item_id, qr_code, holder_name, holder_email, holder_dni, holder_phone')
    .eq('order_id', order.id)
  if (ticketsLookupError) throw ticketsLookupError
  let ticketRows: any[] = existingTicketRows ?? []

  if (!ticketRows?.length) {
    const { data: orderItems, error: itemsError } = await db
      .from('order_items')
      .select('id, product_id, quantity')
      .eq('order_id', order.id)
    if (itemsError) throw itemsError
    if (!orderItems?.length) return

    const newTickets = orderItems.flatMap((item: any) =>
      Array.from({ length: item.quantity }, () => ({
        order_id: order.id,
        product_id: item.product_id,
        order_item_id: item.id,
        qr_code: genTicketCode(),
        holder_name: order.buyer_name,
        holder_email: order.buyer_email,
        holder_dni: order.buyer_dni,
        holder_phone: order.buyer_phone,
      })),
    )
    const { error: insertError } = await db.from('tickets').insert(newTickets)
    if (insertError) throw insertError
    ticketRows = newTickets
  }

  const productIds = [...new Set(ticketRows.map((ticket: any) => ticket.product_id))]
  const { data: products, error: productsError } = await db
    .from('products')
    .select('id, name, event_date, event_location')
    .in('id', productIds)
  if (productsError) throw productsError
  const productMap = new Map((products ?? []).map((product: any) => [product.id, product]))

  const ticketData: TicketData[] = ticketRows.map((ticket: any) => {
    const product: any = productMap.get(ticket.product_id)
    return {
      orderReference: order.id.slice(0, 8).toUpperCase(),
      ticketCode: ticket.qr_code,
      holderName: ticket.holder_name,
      dni: ticket.holder_dni || '-',
      phone: ticket.holder_phone || '-',
      productName: product?.name || 'Entrada',
      eventName: product?.name || 'Manchas Plein Air',
      eventDate: product?.event_date || undefined,
      eventLocation: product?.event_location || undefined,
    }
  })
  const pdf = await generateMultipleTicketsPDF(ticketData)
  await sendEmail({
    to: order.buyer_email,
    subject: `Tus tickets — Orden #${order.id.slice(0, 8).toUpperCase()}`,
    html: paymentConfirmedTemplate({
      orderReference: order.id,
      buyerName: order.buyer_name,
      total: Number(order.total_ars || 0),
      paymentDate: new Date().toISOString(),
      ticketCount: ticketRows.length,
      eventName: 'Manchas Plein Air',
    }),
    attachments: [{
      content: pdf.toString('base64'),
      filename: `tickets-${order.id.slice(0, 8).toUpperCase()}.pdf`,
      type: 'application/pdf',
    }],
  })
  const { error: emailMarkerError } = await db
    .from('orders')
    .update({ ticket_email_sent_at: new Date().toISOString() })
    .eq('id', order.id)
  if (emailMarkerError) throw emailMarkerError
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json(); const db = createAdminClient()
    await db.from('webhook_logs').insert({ source: 'mercadopago', provider: 'mercadopago', event_type: body.type || 'unknown', payload: body })
    if (body.type && body.type !== 'payment') return NextResponse.json({ received: true })
    const payment = body.payment || await fetchPayment(String(body?.data?.id || body?.id || ''))
    const orderId = payment.external_reference
    if (!orderId || !payment.id) return NextResponse.json({ received: true })
    const { data: order } = await db.from('orders').select('*').eq('id', orderId).single()
    if (!order) return NextResponse.json({ received: true })
    if (String(order.mp_payment_id || '') === String(payment.id)) {
      if (order.status === 'paid' && !order.ticket_email_sent_at) {
        await createAndEmailOrderTickets(db, order)
      }
      return NextResponse.json({ received: true })
    }
    const paidAmount = roundMoney(Number(payment.transaction_amount || 0))
    const approved = payment.status === 'approved'
    const { data: originalBookings } = await db.from('travel_bookings').select('*').eq('order_id', orderId)
    const { data: balanceBookings } = await db.from('travel_bookings').select('*').eq('balance_payment_order_id', orderId)
    const isInitialReservation =
      ['deposit', 'reservation'].includes(order.payment_option) && (originalBookings?.length ?? 0) > 0
    const remainingTripBalance = isInitialReservation
      ? roundMoney(originalBookings!.reduce((sum, booking) => sum + Number(booking.balance_due || 0), 0))
      : 0
    const nextPaid = approved ? roundMoney(Number(order.amount_paid_ars || 0) + paidAmount) : Number(order.amount_paid_ars || 0)
    const nextDue = isInitialReservation
      ? remainingTripBalance
      : roundMoney(Number(order.total_ars || 0) - nextPaid)
    const orderStatus = approved
      ? (isInitialReservation && remainingTripBalance > 0 ? 'payment_pending' : nextDue === 0 ? 'paid' : 'payment_pending')
      : (['rejected', 'cancelled'].includes(payment.status) ? 'cancelled' : 'payment_pending')
    const { error: orderUpdateError } = await db
      .from('orders')
      .update({ status: orderStatus, mp_payment_id: String(payment.id), amount_paid_ars: nextPaid, balance_due_ars: nextDue, updated_at: new Date().toISOString() })
      .eq('id', orderId)
    if (orderUpdateError) throw orderUpdateError
    if (!approved) return NextResponse.json({ received: true })

    // Product ticket orders need QR records and a confirmation email after payment.
    // Transfer orders are fulfilled by the admin status update flow.
    if (orderStatus === 'paid') {
      const { data: orderItems, error: orderItemsError } = await db
        .from('order_items')
        .select('id')
        .eq('order_id', orderId)
      if (orderItemsError) throw orderItemsError
      if (orderItems?.length) await createAndEmailOrderTickets(db, order)
    }

    const bookings = [...(originalBookings || []), ...(balanceBookings || [])]
    let remainingInitialAllocation = paidAmount
    for (const booking of bookings) {
      // A balance-payment order always belongs to exactly one booking. Initial orders can contain several.
      const isInitialDeposit = booking.order_id === orderId && ['deposit', 'reservation'].includes(order.payment_option)
      const allocation = isInitialDeposit ? 0 : booking.balance_payment_order_id === orderId
        ? paidAmount
        : Math.min(remainingInitialAllocation, Number(booking.balance_due || 0))
      if (booking.balance_payment_order_id !== orderId) remainingInitialAllocation = roundMoney(remainingInitialAllocation - allocation)
      const due = roundMoney(Number(booking.balance_due || 0) - allocation)
      const paymentStatus = due === 0 ? 'paid' : 'deposit_paid'
      await db.from('travel_bookings').update({ balance_due: due, payment_status: paymentStatus, reservation_status: 'confirmed' }).eq('id', booking.id)
      const { data: experience } = await db.from('travel_experiences').select('title, departure_date').eq('id', booking.travel_id).single()
      const total = Number(booking.price_total || booking.price_ars_blue || 0)
      const pdf = await generateBookingPDF({ bookingReference: booking.booking_reference, customerName: booking.customer_name, customerEmail: booking.customer_email, customerPhone: booking.customer_phone, experienceTitle: experience?.title || 'Experiencia', planName: booking.plan_name, location: booking.location || '-', dates: experience?.departure_date || booking.dates || '-', priceTotal: total, amountPaid: Math.max(0, total - due), balanceDue: due, passengerCount: booking.passenger_count, paymentStatus, orderReference: orderId, qrToken: booking.qr_token })
      await sendEmail({ to: booking.customer_email, subject: due === 0 ? `Pago completo — Reserva ${booking.booking_reference}` : `Reserva recibida — ${booking.booking_reference}`, html: due === 0 ? '<p><strong>PAGO COMPLETO — RESERVA CONFIRMADA</strong>. Adjuntamos tu voucher con QR de validación.</p>' : '<p>Tu reserva/seña fue acreditada. El saldo queda pendiente; comunicate por email para conocer las opciones de pago.</p>', attachments: [{ content: pdf.toString('base64'), filename: `reserva-${booking.booking_reference}.pdf`, type: 'application/pdf' }] })
    }
    const originalOrderIds = [...new Set((balanceBookings || []).map((booking) => booking.order_id).filter(Boolean))]
    for (const originalOrderId of originalOrderIds) {
      const { data: relatedBookings } = await db
        .from('travel_bookings')
        .select('balance_due')
        .eq('order_id', originalOrderId)
      const stillDue = (relatedBookings || []).reduce((sum, booking) => sum + Number(booking.balance_due || 0), 0)
      if (roundMoney(stillDue) === 0) {
        await db.from('orders').update({ status: 'paid', balance_due_ars: 0, updated_at: new Date().toISOString() }).eq('id', originalOrderId)
      }
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[WEBHOOK] Mercado Pago:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
