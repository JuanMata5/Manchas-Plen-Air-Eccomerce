import { createAdminClient } from '@/lib/supabase/admin'
import { formatARS } from '@/lib/format'
import { ShoppingBag, DollarSign, Package, Ticket } from 'lucide-react'

type RecentOrder = {
  id: string
  buyer_name: string | null
  buyer_email: string | null
  total_ars: number | null
  status: string
  payment_method: string | null
  created_at: string
  order_items?: Array<{
    id: string
    quantity: number
    products: { name: string } | null
  }>
}

async function getStats() {
  const adminDb = createAdminClient()

  const [ordersRes, ticketsRes, orderItemsRes] = await Promise.all([
    adminDb.from('orders').select('id, total_ars, status'),
    adminDb.from('tickets').select('id', { count: 'exact', head: true }),
    adminDb.from('order_items').select('order_id, quantity'),
  ])

  const orders = ordersRes.data ?? []
  const validOrderIds = new Set(
    orders.filter((order) => !['cancelled', 'refunded'].includes(order.status)).map((order) => order.id),
  )

  const totalRevenue = orders
    .filter((order) => validOrderIds.has(order.id))
    .reduce((sum, order) => sum + Number(order.total_ars ?? 0), 0)

  const soldProducts = (orderItemsRes.data ?? []).reduce((sum, item) => {
    if (!validOrderIds.has(item.order_id)) return sum
    return sum + Number(item.quantity ?? 0)
  }, 0)

  return {
    totalOrders: orders.length,
    totalRevenue,
    totalTickets: ticketsRes.count ?? 0,
    soldProducts,
  }
}

async function getRecentOrders(): Promise<RecentOrder[]> {
  const adminDb = createAdminClient()
  const { data } = await adminDb
    .from('orders')
    .select('id, buyer_name, buyer_email, total_ars, status, payment_method, created_at, order_items(id, quantity, products(name))')
    .order('created_at', { ascending: false })
    .limit(10)

  return (data ?? []) as RecentOrder[]
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
    { label: 'Facturacion total', value: formatARS(stats.totalRevenue), icon: DollarSign },
    { label: 'Tickets emitidos', value: stats.totalTickets.toString(), icon: Ticket },
    { label: 'Productos vendidos', value: stats.soldProducts.toString(), icon: Package },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif font-bold text-2xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen general de Plen Air</p>
      </div>

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

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Ultimas ordenes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Comprador</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Productos</th>
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
                    <td className="px-5 py-3 text-muted-foreground">
                      {(order.order_items ?? []).length > 0 ? (
                        (order.order_items ?? []).map((item, idx) => (
                          <p key={item.id ?? idx} className="text-xs">
                            {item.quantity}x {item.products?.name ?? '—'}
                          </p>
                        ))
                      ) : (
                        <span className="text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium tabular-nums">{formatARS(order.total_ars ?? 0)}</td>
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
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
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
