import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Empty } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { TicketCard } from '@/components/ticket-card'

export default async function MisTicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?from=/cuenta/mis-tickets')

  const adminDb = createAdminClient()

  // Get user email for fallback matching
  const userEmail = user.email ?? ''

  // Strategy 1: tickets from orders with user_id
  const { data: ticketsByUserId } = await adminDb
    .from('tickets')
    .select('*, products(name, image_url), orders!inner(id, buyer_name, created_at, status, user_id)')
    .eq('orders.user_id', user.id)
    .order('created_at', { ascending: false })

  // Strategy 2: tickets where holder_email matches (covers orders without user_id)
  const { data: ticketsByEmail } = await adminDb
    .from('tickets')
    .select('*, products(name, image_url), orders(id, buyer_name, created_at, status, user_id)')
    .eq('holder_email', userEmail)
    .order('created_at', { ascending: false })

  // Merge and deduplicate
  const allTickets = [...(ticketsByUserId ?? []), ...(ticketsByEmail ?? [])]
  const seen = new Set<string>()
  const userTickets = allTickets.filter((t: any) => {
    if (seen.has(t.id)) return false
    seen.add(t.id)
    return t.orders !== null
  })

  // Obtener reservas de viajes asociadas al usuario (por user_id o email)
  const { data: bookingsByUser } = await adminDb
    .from('travel_bookings')
    .select('*, travel_experiences(title)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: bookingsByEmail } = await adminDb
    .from('travel_bookings')
    .select('*, travel_experiences(title)')
    .eq('customer_email', userEmail)
    .order('created_at', { ascending: false })

  const allBookings = [...(bookingsByUser ?? []), ...(bookingsByEmail ?? [])]
  // dedupe bookings by id
  const bookingMap = new Map<string, any>()
  for (const b of allBookings) {
    if (!bookingMap.has(b.id)) bookingMap.set(b.id, b)
  }
  const userBookings = Array.from(bookingMap.values())

  // Inyectar el DNI del usuario si el ticket no lo tiene
  const userDni = user.user_metadata?.dni || null;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif font-bold text-3xl text-foreground">Mis reservas</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/cuenta/mis-ordenes">Ver ordenes</Link>
          </Button>
        </div>

        {userBookings.length === 0 && userTickets.length === 0 ? (
          <Empty
            title="Sin reservas"
            description="Tus reservas apareceran aca una vez que tu pago sea confirmado."
            action={
              <Button asChild>
                <Link href="/tienda">Ir a la tienda</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {userBookings.length > 0 && (
              <div>
                <h2 className="font-semibold text-lg mb-4">Reservas de viajes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {userBookings.map((booking: any) => (
                    <div key={booking.id} className="bg-card border border-border rounded-xl p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-mono text-xs text-muted-foreground">{booking.booking_reference}</p>
                          <p className="font-medium text-foreground">{booking.travel_experiences?.title ?? booking.plan_name}</p>
                          <p className="text-xs text-muted-foreground">{booking.customer_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{booking.passenger_count ?? 1} pasajero{(booking.passenger_count ?? 1) > 1 ? 's' : ''}</p>
                          <p className="text-xs text-muted-foreground">{new Date(booking.created_at).toLocaleDateString('es-AR')}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button asChild size="sm">
                          <Link href={`/viajes/reservar/${booking.travel_id}?ref=${booking.booking_reference}`}>Ver reserva</Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/viajes/reservar/${booking.travel_id}/confirmacion?ref=${booking.booking_reference}`}>Comprobante</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {userTickets.length > 0 && (
              <div>
                <h2 className="font-semibold text-lg mb-4">Entradas y comprobantes</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {userTickets.map((ticket: any) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={{
                        ...ticket,
                        holder_dni: ticket.holder_dni || userDni,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
