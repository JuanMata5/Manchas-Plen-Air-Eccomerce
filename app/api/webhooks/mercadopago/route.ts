import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { generateBookingPDF } from '@/lib/pdf/booking-generator'
import { roundMoney } from '@/lib/travel-payment'

async function fetchPayment(id: string) {
  const token = process.env.MP_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!response.ok) throw new Error(`Mercado Pago respondió ${response.status}`)
  return response.json()
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
    if (!order || String(order.mp_payment_id || '') === String(payment.id)) return NextResponse.json({ received: true })
    const paidAmount = roundMoney(Number(payment.transaction_amount || 0))
    const approved = payment.status === 'approved'
    const nextPaid = approved ? roundMoney(Number(order.amount_paid_ars || 0) + paidAmount) : Number(order.amount_paid_ars || 0)
    const nextDue = roundMoney(Number(order.total_ars || 0) - nextPaid)
    const orderStatus = approved ? (nextDue === 0 ? 'paid' : 'payment_pending') : (['rejected', 'cancelled'].includes(payment.status) ? 'cancelled' : 'payment_pending')
    await db.from('orders').update({ status: orderStatus, mp_payment_id: String(payment.id), amount_paid_ars: nextPaid, balance_due_ars: nextDue, updated_at: new Date().toISOString() }).eq('id', orderId)
    if (!approved) return NextResponse.json({ received: true })

    const { data: originalBookings } = await db.from('travel_bookings').select('*').eq('order_id', orderId)
    const { data: balanceBookings } = await db.from('travel_bookings').select('*').eq('balance_payment_order_id', orderId)
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
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[WEBHOOK] Mercado Pago:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
