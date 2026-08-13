import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canPayRemainingBalance, roundMoney } from '@/lib/travel-payment'

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const db = createAdminClient()
  const { data: booking } = await db.from('travel_bookings').select('*, travel_experiences(reservation_deadline, departure_date, title)').eq('id', params.id).eq('user_id', user.id).single()
  if (!booking) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  if (!canPayRemainingBalance(booking)) return NextResponse.json({ error: 'El pago online del saldo no está disponible para esta reserva.' }, { status: 400 })
  if (booking.payment_method !== 'mercadopago') return NextResponse.json({ error: 'El saldo de esta reserva debe coordinarse por email.' }, { status: 400 })
  const total = roundMoney(Number(booking.price_total)); const balance = roundMoney(Number(booking.balance_due))
  if (!balance || booking.reservation_status === 'cancelled') return NextResponse.json({ error: 'Esta reserva no tiene un saldo pagable.' }, { status: 400 })
  if (booking.balance_payment_order_id) {
    const { data: pending } = await db.from('orders').select('status').eq('id', booking.balance_payment_order_id).single()
    if (pending && ['pending', 'payment_pending'].includes(pending.status)) return NextResponse.json({ error: 'Ya existe un pago de saldo pendiente.' }, { status: 409 })
  }
  const { data: order, error } = await db.from('orders').insert({ user_id: user.id, status: 'pending', payment_method: 'mercadopago', payment_option: 'balance', subtotal_ars: balance, discount_ars: 0, total_ars: balance, amount_paid_ars: 0, balance_due_ars: balance, buyer_name: booking.customer_name, buyer_email: booking.customer_email, buyer_phone: booking.customer_phone }).select().single()
  if (error || !order) return NextResponse.json({ error: 'No se pudo preparar el pago del saldo.' }, { status: 500 })
  const token = process.env.MP_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'Mercado Pago no está configurado.' }, { status: 500 })
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const response = await fetch('https://api.mercadopago.com/checkout/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ items: [{ id: booking.id, title: `Saldo pendiente — ${booking.travel_experiences?.title || 'viaje'}`, quantity: 1, unit_price: balance, currency_id: 'ARS' }], payer: { name: booking.customer_name, email: booking.customer_email }, external_reference: order.id, statement_descriptor: 'PLEN AIR', ...(base.startsWith('https') ? { back_urls: { success: `${base}/experiencias/${booking.travel_id}/confirmacion?ref=${booking.booking_reference}`, failure: `${base}/experiencias/${booking.travel_id}/confirmacion?ref=${booking.booking_reference}`, pending: `${base}/experiencias/${booking.travel_id}/confirmacion?ref=${booking.booking_reference}` }, auto_return: 'approved' } : {}) }) })
  if (!response.ok) return NextResponse.json({ error: 'No se pudo iniciar Mercado Pago.' }, { status: 502 })
  const mp = await response.json()
  await db.from('orders').update({ payment_ref: mp.id }).eq('id', order.id)
  await db.from('travel_bookings').update({ balance_payment_order_id: order.id }).eq('id', booking.id)
  return NextResponse.json({ init_point: mp.init_point || mp.sandbox_init_point })
}
