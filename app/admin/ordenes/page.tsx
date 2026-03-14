import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatARS } from '@/lib/format'
import { OrderStatusActions } from '@/components/admin/order-status-actions'
import { AdminOrderEmail } from '@/components/admin/admin-order-email'

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  payment_pending: { label: 'Esp. pago', className: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Pagado', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
  refunded: { label: 'Reembolsado', className: 'bg-gray-100 text-gray-800' },
}

function hasRefundRequest(notes: string | null | undefined) {
  return notes?.includes('[[REFUND_REQUEST]]') ?? false
}

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) redirect('/admin')

  const adminDb = createAdminClient()
  const { data: orders } = await adminDb
    .from('orders')
    .select('*, order_items(id, quantity, unit_price, products(name))')
    .order('created_at', { ascending: false })

  const allOrders = orders ?? []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif font-bold text-2xl text-foreground">Ordenes</h1>
        <p className="text-muted-foreground text-sm mt-1">{allOrders.length} ordenes en total</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Comprador</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Productos</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Metodo</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Ref.</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="px-5 py-3 font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map((order) => {
                const st = statusLabels[order.status] ?? { label: order.status, className: 'bg-gray-100 text-gray-800' }
                const refundRequested = hasRefundRequest(order.notes)
                return (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{order.buyer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.buyer_email}</p>
                      {order.buyer_phone && (
                        <p className="text-xs text-muted-foreground">{order.buyer_phone}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {(order.order_items ?? []).map((item: { id: string; quantity: number; products: { name: string } | null }, idx: number) => (
                        <p key={item.id ?? idx} className="text-xs">
                          {item.quantity}x {item.products?.name ?? '—'}
                        </p>
                      ))}
                    </td>
                    <td className="px-5 py-3 font-medium tabular-nums">{formatARS(order.total_ars)}</td>
                    <td className="px-5 py-3 capitalize text-muted-foreground text-xs">
                      {order.payment_method === 'transfer' ? 'Transf.' : order.payment_method ?? '—'}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {order.transfer_ref ?? order.bank_transfer_ref ?? '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.className}`}>
                        {st.label}
                      </span>
                      {refundRequested && (
                        <span className="block mt-1 text-xs text-orange-700 font-medium">
                          Reembolso solicitado
                        </span>
                      )}
                      {order.receipt_url && (
                        <span className="block mt-1 text-xs text-green-600 font-medium">
                          Comprobante
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground text-xs tabular-nums whitespace-nowrap">
                      {new Date(order.created_at).toLocaleDateString('es-AR')}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <OrderStatusActions orderId={order.id} currentStatus={order.status} />
                        <AdminOrderEmail
                          orderId={order.id}
                          buyerName={order.buyer_name}
                          buyerEmail={order.buyer_email}
                          receiptUrl={order.receipt_url}
                          currentStatus={order.status}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {allOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
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
