import Link from 'next/link'
import { CalendarDays, CheckCircle2, Clock, DollarSign, MapPin, Plane, Plus, Users } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatARS } from '@/lib/format'

type TravelRow = {
  id: string
  title: string
  is_active: boolean
  status: string
  departure_date: string | null
  available_spots: number | null
  capacity: number
}

type BookingRow = {
  id: string
  booking_reference: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  plan_name: string
  passenger_count: number | null
  price_total: number | null
  price_reservation: number | null
  balance_due: number | null
  price_ars_blue: number | null
  status: string
  payment_status: string
  reservation_status: string | null
  payment_method: string | null
  created_at: string
  travel_experiences?: { title: string } | null
}

async function getTravelDashboard() {
  const adminDb = createAdminClient()
  const [travelsRes, bookingsRes] = await Promise.all([
    adminDb
      .from('travel_experiences')
      .select('id, title, is_active, status, departure_date, available_spots, capacity')
      .order('departure_date', { ascending: true, nullsFirst: false }),
    adminDb
      .from('travel_bookings')
      .select('id, booking_reference, customer_name, customer_email, customer_phone, plan_name, passenger_count, price_total, price_reservation, balance_due, price_ars_blue, status, payment_status, reservation_status, payment_method, created_at, travel_experiences(title)')
      .order('created_at', { ascending: false })
      .limit(25),
  ])

  return {
    travels: (travelsRes.data ?? []) as TravelRow[],
    bookings: (bookingsRes.data ?? []) as BookingRow[],
  }
}

const reservationLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-100 text-amber-800 border-0' },
  confirmed: { label: 'Confirmada', className: 'bg-emerald-100 text-emerald-800 border-0' },
  cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-800 border-0' },
  completed: { label: 'Completada', className: 'bg-blue-100 text-blue-800 border-0' },
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
        </div>
        <div className="rounded-lg bg-muted p-2 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export default async function AdminTravelsDashboard() {
  const { travels, bookings } = await getTravelDashboard()
  const now = new Date()
  const activeTravels = travels.filter((travel) => travel.is_active).length
  const upcomingTravels = travels.filter((travel) => travel.departure_date && new Date(`${travel.departure_date}T00:00:00`) >= now).length
  const fullTravels = travels.filter((travel) => travel.status === 'sold_out' || (travel.available_spots ?? travel.capacity) <= 0).length
  const pendingBookings = bookings.filter((booking) => (booking.reservation_status || booking.status) === 'pending').length
  const confirmedBookings = bookings.filter((booking) => (booking.reservation_status || booking.status) === 'confirmed').length
  const reservationIncome = bookings.reduce((sum, booking) => {
    const paid = booking.price_reservation ?? booking.price_ars_blue ?? 0
    const isPaid = ['paid', 'deposit_paid', 'reserva_pagada'].includes(booking.payment_status)
    return isPaid ? sum + Number(paid) : sum
  }, 0)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-foreground">Viajes</h1>
          <p className="text-muted-foreground text-sm mt-1">Dashboard de paquetes turísticos y reservas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/viajes/experiencias">
              <MapPin className="mr-2 h-4 w-4" />
              Ver viajes
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/viajes/experiencias/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo viaje
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total de viajes" value={travels.length} icon={Plane} />
        <StatCard title="Viajes activos" value={activeTravels} icon={CheckCircle2} />
        <StatCard title="Próximas salidas" value={upcomingTravels} icon={CalendarDays} />
        <StatCard title="Viajes completos" value={fullTravels} icon={Users} />
        <StatCard title="Reservas pendientes" value={pendingBookings} icon={Clock} />
        <StatCard title="Reservas confirmadas" value={confirmedBookings} icon={CheckCircle2} />
        <StatCard title="Ingresos por reservas" value={formatARS(reservationIncome)} icon={DollarSign} />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-foreground">Últimas reservas</h2>
            <p className="text-sm text-muted-foreground">Reservas creadas desde el checkout de viajes.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Reserva</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cliente</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Viaje</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Pasajeros</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Pago</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Saldo</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const status = reservationLabels[booking.reservation_status || booking.status] ?? reservationLabels.pending
                const paidAmount = booking.price_reservation ?? booking.price_ars_blue ?? 0
                return (
                  <tr key={booking.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-mono font-medium">{booking.booking_reference}</p>
                      <p className="text-xs text-muted-foreground">{new Date(booking.created_at).toLocaleDateString('es-AR')}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{booking.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{booking.customer_email}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {booking.travel_experiences?.title || booking.plan_name}
                    </td>
                    <td className="px-5 py-3 tabular-nums">{booking.passenger_count ?? 1}</td>
                    <td className="px-5 py-3">
                      <p className="font-medium tabular-nums">{formatARS(Number(paidAmount))}</p>
                      <p className="text-xs text-muted-foreground">{booking.payment_method || 'Sin método'}</p>
                    </td>
                    <td className="px-5 py-3 tabular-nums">{formatARS(Number(booking.balance_due ?? 0))}</td>
                    <td className="px-5 py-3">
                      <Badge className={status.className}>{status.label}</Badge>
                    </td>
                  </tr>
                )
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    No hay reservas de viajes registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
