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

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-serif font-bold text-3xl text-foreground">Mis tickets</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/cuenta/mis-ordenes">Ver ordenes</Link>
          </Button>
        </div>

        {userTickets.length === 0 ? (
          <Empty
            title="Sin tickets"
            description="Tus tickets apareceran aca una vez que tu pago sea confirmado."
            action={
              <Button asChild>
                <Link href="/tienda">Ir a la tienda</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {userTickets.map((ticket: any) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
