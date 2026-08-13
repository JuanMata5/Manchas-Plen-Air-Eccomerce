import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTravelPaymentState } from '@/lib/travel-payment'

export default async function VerifyReservationPage({ params }: { params: { token: string } }) {
  const db = createAdminClient()
  const { data: booking } = await db.from('travel_bookings').select('*, travel_experiences(title, destination, departure_date)').eq('qr_token', params.token).single()
  if (!booking) notFound()
  const total = Number(booking.price_total || booking.price_ars_blue || 0); const due = Number(booking.balance_due || 0)
  const state = getTravelPaymentState(booking); const paid = Math.max(0, total - due)
  const complete = state === 'PAID'
  return <main className="min-h-screen bg-muted/30 py-12 px-4"><section className="mx-auto max-w-xl rounded-xl border bg-background p-7 shadow-sm">
    <p className={`mb-5 rounded-lg p-3 text-center font-bold ${complete ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>{complete ? 'PAGO COMPLETO — RESERVA CONFIRMADA' : `PAGO PENDIENTE — Saldo: $${due.toLocaleString('es-AR')}`}</p>
    <h1 className="text-2xl font-bold">Validación de reserva</h1><dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 text-sm">
      <dt>Código</dt><dd className="font-mono font-semibold">{booking.booking_reference}</dd><dt>Pasajero</dt><dd>{booking.customer_name}</dd><dt>Viaje</dt><dd>{booking.travel_experiences?.title || booking.plan_name}</dd><dt>Destino</dt><dd>{booking.travel_experiences?.destination || booking.location}</dd><dt>Fecha</dt><dd>{booking.travel_experiences?.departure_date || booking.dates}</dd><dt>Pasajeros</dt><dd>{booking.passenger_count || 1}</dd><dt>Estado reserva</dt><dd>{booking.reservation_status || 'pending'}</dd><dt>Estado pago</dt><dd>{complete ? 'Pago completo' : 'Pago pendiente'}</dd><dt>Total</dt><dd>${total.toLocaleString('es-AR')}</dd><dt>Abonado</dt><dd>${paid.toLocaleString('es-AR')}</dd><dt>Saldo</dt><dd>${due.toLocaleString('es-AR')}</dd><dt>Fecha reserva</dt><dd>{new Date(booking.created_at).toLocaleDateString('es-AR')}</dd>
    </dl></section></main>
}
