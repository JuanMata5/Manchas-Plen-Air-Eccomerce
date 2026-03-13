import { createClient } from '@/lib/supabase/server'
import { formatARS } from '@/lib/format'
import { ShoppingBag, DollarSign, Users, Ticket } from 'lucide-react'

async function getStats() {
  const supabase = await createClient()

  const [ordersRes, revenueRes, ticketsRes, productsRes] = await Promise.all([
    // Total orders
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    // Revenue from paid orders
    supabase.from('orders').select('total_ars').eq('status', 'paid'),
    // Total tickets issued
    supabase.from('tickets').select('id', { count: 'exact', head: true }),
    // Active products
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const totalRevenue = (revenueRes.data ?? []).reduce((sum, o) => sum + (o.total_ars ?? 0), 0)

  return {
    totalOrders: ordersRes.count ?? 0,
    totalRevenue,
    totalTickets: ticketsRes.count ?? 0,
    activeProducts: productsRes.count ?? 0,
  }
}

async function getRecentOrders() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select('id, buyer_name, buyer_email, total_ars, status, payment_method, created_at')
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  payment_pending: { label: 'Esp. pago', className: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Pagado', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
  refunded: { label: 'Reembolsado', className: 'bg-gray-100 text-gray-800' },
}

export default async function AdminDashboard() {
  const [stats, recentOrders] = await Promise.all([getStats(), getRecentOrders()])

  const statCards = [
    { label: 'Ordenes totales', value: stats.totalOrders.toString(), icon: ShoppingBag },
    { label: 'Ingresos (pagado)', value: formatARS(stats.totalRevenue), icon: DollarSign },
    { label: 'Tickets emitidos', value: stats.totalTickets.toString(), icon: Ticket },
    { label: 'Productos activos', value: stats.activeProducts.toString(), icon: Users },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif font-bold text-2xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen general de Plen Air</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <stat.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="font-bold text-foreground text-lg tabular-nums">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Ultimas ordenes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Comprador</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Metodo</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const st = statusLabels[order.status] ?? { label: order.status, className: 'bg-gray-100 text-gray-800' }
                return (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{order.buyer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.buyer_email}</p>
                    </td>
                    <td className="px-5 py-3 font-medium tabular-nums">{formatARS(order.total_ars)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.className}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 capitalize text-muted-foreground">
                      {order.payment_method ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs tabular-nums">
                      {new Date(order.created_at).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                )
              })}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    No hay ordenes todavia.
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
