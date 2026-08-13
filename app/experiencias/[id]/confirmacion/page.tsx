'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { canPayRemainingBalance, getTravelPaymentState } from '@/lib/travel-payment'

export default function ConfirmacionPage() {
  const params = useParams(); const ref = useSearchParams().get('ref'); const supabase = createClient()
  const [booking, setBooking] = useState<any>(null); const [experience, setExperience] = useState<any>(null); const [error, setError] = useState(''); const [paying, setPaying] = useState(false); const [qr, setQr] = useState('')
  useEffect(() => { (async () => { if (!ref) return setError('Referencia de reserva no encontrada'); const { data: b, error: be } = await supabase.from('travel_bookings').select('*').eq('booking_reference', ref).single(); if (be || !b) return setError('No se encontró la reserva'); const { data: e } = await supabase.from('travel_experiences').select('*').eq('id', b.travel_id || params.experienciaId).single(); setBooking(b); setExperience(e) })() }, [ref, params.experienciaId])
  const total = Number(booking?.price_total || booking?.price_ars_blue || 0); const due = Number(booking?.balance_due || 0); const paid = Math.max(0, total - due); const complete = booking && getTravelPaymentState(booking) === 'PAID'; const canPay = booking && canPayRemainingBalance({ ...booking, travel_experiences: experience })
  useEffect(() => { if (!complete || !booking?.qr_token) return; import('qrcode').then((m: any) => (m.default ?? m).toDataURL(`${window.location.origin}/reservation/verify/${booking.qr_token}`)).then(setQr).catch(console.error) }, [complete, booking])
  async function payBalance() { setPaying(true); const res = await fetch(`/api/travel-bookings/${booking.id}/pay-balance`, { method: 'POST' }); const data = await res.json(); if (!res.ok) { alert(data.error || 'No se pudo iniciar el pago'); setPaying(false); return } window.location.href = data.init_point }
  async function voucher() { const res = await fetch(`/api/travel-bookings/${booking.id}/voucher`); if (!res.ok) return alert('No se pudo generar el comprobante'); const url = URL.createObjectURL(await res.blob()); const a = document.createElement('a'); a.href = url; a.download = `reserva-${booking.booking_reference}.pdf`; a.click(); URL.revokeObjectURL(url) }
  if (error) return <main className="p-10 text-center">{error}</main>
  if (!booking) return <main className="p-10 text-center">Cargando reserva...</main>
  return <main className="min-h-screen bg-muted/30 px-4 py-12"><section className="mx-auto max-w-3xl rounded-xl border bg-background p-7 shadow-sm">
    <h1 className="text-3xl font-bold">{complete ? 'Pago completo — Reserva confirmada' : 'Reserva recibida'}</h1><p className="mt-2 text-muted-foreground">Código: <span className="font-mono font-bold">{booking.booking_reference}</span></p>
    <div className={`mt-6 rounded-lg p-4 font-semibold ${complete ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>{complete ? 'PAGO COMPLETO — RESERVA CONFIRMADA' : `PAGO PENDIENTE — Saldo: $${due.toLocaleString('es-AR')}`}</div>
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm"><p><b>Pasajero:</b> {booking.customer_name}</p><p><b>Viaje:</b> {experience?.title || booking.plan_name}</p><p><b>Destino:</b> {experience?.destination || booking.location}</p><p><b>Fecha:</b> {experience?.departure_date || booking.dates}</p><p><b>Pasajeros:</b> {booking.passenger_count || 1}</p><p><b>Precio total:</b> ${total.toLocaleString('es-AR')}</p><p><b>Abonado:</b> ${paid.toLocaleString('es-AR')}</p><p><b>Saldo pendiente:</b> ${due.toLocaleString('es-AR')}</p></div>
    {complete && qr && <div className="mt-8 text-center"><h2 className="font-semibold">QR de validación</h2><img className="mx-auto mt-3 h-44 w-44" src={qr} alt="QR de validación" /><p className="mt-2 text-xs text-muted-foreground">Presentalo al hacer el check-in.</p></div>}
    {!complete && <div className="mt-7 rounded-lg bg-blue-50 p-4 text-sm text-blue-950">Tu reserva fue recibida correctamente. El importe abonado corresponde a la seña. Para conocer las opciones y condiciones para completar el pago, comunicate con nosotros por email.</div>}
    <div className="mt-8 flex flex-wrap gap-3"><button onClick={voucher} className="rounded-md bg-slate-900 px-4 py-2 text-white">Descargar comprobante</button>{!complete && canPay && <button onClick={payBalance} disabled={paying} className="rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-60">{paying ? 'Iniciando pago...' : 'Pagar saldo restante'}</button>}{!complete && !canPay && <p className="rounded-md bg-amber-50 p-2 text-sm text-amber-900">El pago online del saldo ya no está disponible. Comunicate por email.</p>}<Link className="rounded-md border px-4 py-2" href="/cuenta/mis-tickets">Mis reservas</Link></div>
  </section></main>
}
