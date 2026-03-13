import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TicketValidationView } from '@/components/ticket-validation-view'

export default async function TicketValidationPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  // Check if user is logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Redirect to login, then come back to this page
    redirect(`/auth/login?redirect=/tickets/validar/${code}`)
  }

  const adminDb = createAdminClient()

  // Check if user is admin
  const { data: profile } = await adminDb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin = !!profile?.is_admin

  // Fetch ticket
  const { data: ticket } = await adminDb
    .from('tickets')
    .select('*, products(name, event_date, event_location), orders(id, user_id, buyer_name, buyer_email)')
    .eq('qr_code', code)
    .single()

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <div className="bg-card rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Ticket no encontrado</h1>
          <p className="text-muted-foreground">El código QR no es válido o el ticket no existe.</p>
        </div>
      </div>
    )
  }

  // If not admin, verify the ticket belongs to this user
  if (!isAdmin && ticket.orders?.user_id !== user.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-4">
        <div className="bg-card rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Sin acceso</h1>
          <p className="text-muted-foreground">Este ticket no pertenece a tu cuenta.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <TicketValidationView
        ticket={{
          id: ticket.id,
          qr_code: ticket.qr_code,
          holder_name: ticket.holder_name,
          is_used: ticket.is_used,
          used_at: ticket.used_at,
          product_name: ticket.products?.name || 'Entrada',
          event_date: ticket.products?.event_date || null,
          event_location: ticket.products?.event_location || null,
          order_id: ticket.orders?.id || '',
          buyer_name: ticket.orders?.buyer_name || '',
          buyer_email: ticket.orders?.buyer_email || '',
        }}
        isAdmin={isAdmin}
      />
    </div>
  )
}
