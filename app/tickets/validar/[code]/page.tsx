import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { TicketValidationView } from '@/components/ticket-validation-view'

export default async function TicketValidationPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  const adminDb = createAdminClient()

  const { data: ticket } = await adminDb
    .from('tickets')
    .select('*, products(name, event_date, event_location), orders(id, buyer_name, buyer_email)')
    .eq('qr_code', code)
    .single()

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket no encontrado</h1>
          <p className="text-gray-500">El código QR no es válido o el ticket no existe.</p>
        </div>
      </div>
    )
  }

  // Check if the current user is an admin
  let isAdmin = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await adminDb
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      isAdmin = !!profile?.is_admin
    }
  } catch {
    // Not logged in, that's fine
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
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
