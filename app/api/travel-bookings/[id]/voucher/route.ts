import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateBookingPDF } from '@/lib/pdf/booking-generator'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const db = createAdminClient()
  const { data: booking } = await db.from('travel_bookings').select('*').eq('id', params.id).eq('user_id', user.id).single()
  if (!booking) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  const { data: experience } = await db.from('travel_experiences').select('title, departure_date').eq('id', booking.travel_id).single()
  const total = Number(booking.price_total || booking.price_ars_blue || 0)
  const due = Number(booking.balance_due || 0)
  const pdf = await generateBookingPDF({
    bookingReference: booking.booking_reference, customerName: booking.customer_name, customerEmail: booking.customer_email,
    customerPhone: booking.customer_phone, experienceTitle: experience?.title || 'Experiencia', planName: booking.plan_name,
    location: booking.location || '-', dates: experience?.departure_date || booking.dates || '-', priceTotal: total,
    amountPaid: Math.max(0, total - due), balanceDue: due, passengerCount: booking.passenger_count,
    paymentStatus: due <= 0 && booking.payment_status === 'paid' ? 'paid' : 'deposit_paid',
    orderReference: booking.order_id || booking.booking_reference, qrToken: booking.qr_token,
  })
  return new NextResponse(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="reserva-${booking.booking_reference}.pdf"` } })
}
