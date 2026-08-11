import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateFullPaymentConfirmationPDF } from '@/lib/pdf/booking-generator'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const adminDb = createAdminClient()
  const { data: booking, error: bookingError } = await adminDb
    .from('travel_bookings')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  if (booking.payment_status !== 'paid') {
    return NextResponse.json(
      { error: 'El voucher estará disponible cuando se acredite el pago total.' },
      { status: 403 },
    )
  }

  const { data: experience } = await adminDb
    .from('travel_experiences')
    .select('title')
    .eq('id', booking.travel_id)
    .single()

  const pdfBuffer = await generateFullPaymentConfirmationPDF({
    bookingReference: booking.booking_reference,
    customerName: booking.customer_name,
    customerEmail: booking.customer_email,
    customerPhone: booking.customer_phone,
    experienceTitle: experience?.title || 'Experiencia',
    planName: booking.plan_name,
    location: booking.location || '-',
    dates: booking.dates || '-',
    priceUsd: Number(booking.price_usd || booking.plan_price_usd || 0),
    priceArsBlue: Number(booking.price_total || booking.price_ars_blue || 0),
    paymentStatus: 'paid',
    orderReference: booking.order_id || booking.booking_reference,
  })

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="voucher-${booking.booking_reference}.pdf"`,
    },
  })
}
