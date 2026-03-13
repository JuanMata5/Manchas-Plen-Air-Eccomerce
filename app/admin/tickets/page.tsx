import { createClient } from '@/lib/supabase/server'
import { TicketValidateButton } from '@/components/admin/ticket-validate-button'

async function getTickets() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tickets')
    .select('*, orders(buyer_name, buyer_email), products(name)')
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}

export default async function AdminTicketsPage() {
  const tickets = await getTickets()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif font-bold text-2xl text-foreground">Tickets</h1>
        <p className="text-muted-foreground text-sm mt-1">{tickets.length} tickets emitidos</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Codigo QR</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Titular</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Producto</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Usado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs font-bold text-primary">
                    {ticket.qr_code}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground">{ticket.holder_name}</p>
                    <p className="text-xs text-muted-foreground">{ticket.holder_email}</p>
                    {ticket.holder_dni && (
                      <p className="text-xs text-muted-foreground">DNI: {ticket.holder_dni}</p>
                    )}
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
                      {ticket.is_used ? 'Usado' : 'Valido'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {ticket.used_at
                      ? new Date(ticket.used_at).toLocaleDateString('es-AR')
                      : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {!ticket.is_used && (
                      <TicketValidateButton ticketId={ticket.id} qrCode={ticket.qr_code} />
                    )}
                  </td>
                </tr>
              ))}
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    No hay tickets emitidos todavia.
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
