import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { TicketValidateButton } from '@/components/admin/ticket-validate-button'
import { Badge } from '@/components/ui/badge'

export default async function AdminTicketsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const adminDb = createAdminClient()

  const { data: profile } = await adminDb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/admin')

  const { data: tickets } = await adminDb
    .from('tickets')
    .select('*, orders(id, buyer_name, buyer_email, user_id), products(name, event_date, event_location)')
    .order('created_at', { ascending: false })

  const allTickets = tickets ?? []
  const validCount = allTickets.filter((t) => !t.is_used).length
  const usedCount = allTickets.filter((t) => t.is_used).length

  // Group tickets by user
  const userMap = new Map<string, { name: string; email: string; tickets: typeof allTickets }>()
  for (const ticket of allTickets) {
    const userId = ticket.orders?.user_id || 'unknown'
    const existing = userMap.get(userId)
    if (existing) {
      existing.tickets.push(ticket)
    } else {
      userMap.set(userId, {
        name: ticket.orders?.buyer_name || ticket.holder_name || 'Sin nombre',
        email: ticket.orders?.buyer_email || ticket.holder_email || '',
        tickets: [ticket],
      })
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif font-bold text-2xl text-foreground">Tickets</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestión de todas las entradas emitidas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Total tickets</p>
          <p className="text-2xl font-bold">{allTickets.length}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Válidos</p>
          <p className="text-2xl font-bold text-green-600">{validCount}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Usados</p>
          <p className="text-2xl font-bold text-gray-500">{usedCount}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-sm text-muted-foreground">Usuarios</p>
          <p className="text-2xl font-bold text-blue-600">{userMap.size}</p>
        </div>
      </div>

      {/* Users with their tickets */}
      <div>
        <h2 className="font-semibold text-lg mb-4">Usuarios y sus tickets</h2>
        <div className="space-y-4">
          {Array.from(userMap.entries()).map(([userId, userData]) => (
            <div key={userId} className="bg-card border rounded-xl overflow-hidden">
              <div className="bg-muted/40 px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{userData.name}</p>
                  <p className="text-xs text-muted-foreground">{userData.email}</p>
                </div>
                <Badge variant="outline">
                  {userData.tickets.length} ticket{userData.tickets.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-2 font-medium text-muted-foreground text-xs">Código</th>
                      <th className="text-left px-5 py-2 font-medium text-muted-foreground text-xs">Producto</th>
                      <th className="text-left px-5 py-2 font-medium text-muted-foreground text-xs">Titular</th>
                      <th className="text-left px-5 py-2 font-medium text-muted-foreground text-xs">Estado</th>
                      <th className="text-left px-5 py-2 font-medium text-muted-foreground text-xs">Fecha uso</th>
                      <th className="px-5 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {userData.tickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-5 py-2.5 font-mono text-xs font-bold text-primary">
                          {ticket.qr_code}
                        </td>
                        <td className="px-5 py-2.5 text-muted-foreground">
                          {ticket.products?.name ?? '—'}
                        </td>
                        <td className="px-5 py-2.5">
                          <p className="text-foreground">{ticket.holder_name}</p>
                        </td>
                        <td className="px-5 py-2.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              ticket.is_used
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {ticket.is_used ? 'Usado' : 'Válido'}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-muted-foreground">
                          {ticket.used_at
                            ? new Date(ticket.used_at).toLocaleString('es-AR')
                            : '—'}
                        </td>
                        <td className="px-5 py-2.5">
                          {!ticket.is_used && (
                            <TicketValidateButton ticketId={ticket.id} qrCode={ticket.qr_code} />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {allTickets.length === 0 && (
            <div className="bg-card border rounded-xl px-5 py-10 text-center text-muted-foreground">
              No hay tickets emitidos todavía.
            </div>
          )}
        </div>
      </div>

      {/* Full table */}
      <div>
        <h2 className="font-semibold text-lg mb-4">Todos los tickets</h2>
        <div className="bg-card border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Código QR</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Comprador</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Titular</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Producto</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha uso</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {allTickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs font-bold text-primary">
                      {ticket.qr_code}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{ticket.orders?.buyer_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{ticket.orders?.buyer_email ?? ''}</p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-foreground">{ticket.holder_name}</p>
                      <p className="text-xs text-muted-foreground">{ticket.holder_email}</p>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {ticket.products?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          ticket.is_used
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {ticket.is_used ? 'Usado' : 'Válido'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {ticket.used_at
                        ? new Date(ticket.used_at).toLocaleString('es-AR')
                        : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {!ticket.is_used && (
                        <TicketValidateButton ticketId={ticket.id} qrCode={ticket.qr_code} />
                      )}
                    </td>
                  </tr>
                ))}
                {allTickets.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                      No hay tickets emitidos todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
