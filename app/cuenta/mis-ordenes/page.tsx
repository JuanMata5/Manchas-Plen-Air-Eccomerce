import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { formatARS } from '@/lib/format'
import { Empty } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { DeleteOrderButton } from '@/components/delete-order-button'
import { RetryPaymentButton } from '@/components/retry-payment-button'

const statusLabels: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
  payment_pending: { label: 'Esperando pago', className: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Pagado', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
  refunded: { label: 'Reembolsado', className: 'bg-gray-100 text-gray-800' },
}

export default async function MisOrdenesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?from=/cuenta/mis-ordenes')

  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(id, quantity, unit_price, products(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-serif font-bold text-3xl text-foreground mb-8">Mis ordenes</h1>

        {!orders || orders.length === 0 ? (
          <Empty
            title="Sin ordenes"
            description="Todavia no realizaste ninguna compra."
            action={
              <Button asChild>
                <Link href="/tienda">Ir a la tienda</Link>
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => {
              const st = statusLabels[order.status] ?? { label: order.status, className: 'bg-gray-100 text-gray-800' }
              return (
                <div key={order.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${st.className}`}>
                        {st.label}
                      </span>
                      <span className="font-bold text-foreground tabular-nums">
                        {formatARS(order.total_ars)}
                      </span>
                      <DeleteOrderButton orderId={order.id} />
                    </div>
                  </div>
                  <div className="border-t border-border pt-4 flex flex-col gap-2">
                    {(order.order_items ?? []).map((item: { id: string; quantity: number; unit_price: number; products: { name: string } | null }, idx: number) => (
                      <div key={item.id ?? idx} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.products?.name ?? 'Producto'}
                        </span>
                        <span className="font-medium tabular-nums">
                          {formatARS(item.unit_price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {order.status === 'payment_pending' && order.payment_method === 'transfer' && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/checkout/transferencia/${order.id}`}>
                          Ver datos de transferencia
                        </Link>
                      </Button>
                    </div>
                  )}
                  {(order.status === 'pending' || order.status === 'payment_pending') && order.payment_method === 'mercadopago' && (
                    <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                      <RetryPaymentButton orderId={order.id} />
                      <span className="text-xs text-muted-foreground">
                        Completar pago con Mercado Pago
                      </span>
                    </div>
                  )}
                  {order.status === 'paid' && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <Button asChild size="sm" className="gap-1.5">
                        <Link href="/cuenta/mis-tickets">
                          Ver mis tickets
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
