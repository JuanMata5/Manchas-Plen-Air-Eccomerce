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

  // 1. Proteger la ruta: solo usuarios logueados pueden acceder.
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    redirect(`/auth/login?redirect=/tickets/validar/${code}`)
  }

  const adminDb = createAdminClient()

  // 2. Obtener el ticket y la orden asociada.
  const { data: ticket, error: ticketError } = await adminDb
    .from('tickets')
    .select('*, products(name, event_date, event_location), orders(id, user_id)')
    .eq('qr_code', code)
    .single()

  if (ticketError || !ticket || !ticket.orders) {
    return <ValidationResult status="error" title="Ticket no encontrado" message="El código QR no es válido o el ticket no existe." />
  }

  const orderOwnerId = ticket.orders.user_id;

  // 3. Verificar Permisos: El usuario actual debe ser admin o el dueño del ticket.
  const { data: profile } = await adminDb.from('profiles').select('role').eq('id', currentUser.id).single()
  const isAdmin = profile?.role === 'admin';
  const isOwner = currentUser.id === orderOwnerId;

  if (!isAdmin && !isOwner) {
    return <ValidationResult status="warning" title="Acceso Denegado" message="No tienes permiso para ver este ticket." />
  }
  
  // 4. Obtener los datos del DUEÑO REAL desde la fuente de verdad (auth.users).
  const { data: { user: ownerUser }, error: ownerError } = await adminDb.auth.admin.getUserById(orderOwnerId);

  if (ownerError || !ownerUser) {
      return <ValidationResult status="error" title="Error de Propietario" message="No se pudo encontrar al dueño original de la orden." />
  }

  const realBuyerName = ownerUser.user_metadata?.full_name || 'Nombre no disponible';
  const realBuyerEmail = ownerUser.email || 'Email no disponible';

  // 5. Renderizar la vista con los datos correctos y verificados.
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <TicketValidationView
        ticket={{
          id: ticket.id,
          qr_code: ticket.qr_code,
          holder_name: realBuyerName, // Dato corregido
          is_used: ticket.is_used,
          used_at: ticket.used_at,
          product_name: ticket.products?.name || 'Entrada',
          event_date: ticket.products?.event_date || null,
          event_location: ticket.products?.event_location || null,
          order_id: ticket.orders.id,
          buyer_name: realBuyerName, // Dato corregido
          buyer_email: realBuyerEmail, // Dato corregido
        }}
        isAdmin={isAdmin}
      />
    </div>
  )
}

// --- Componente de UI para resultados ---
function ValidationResult({ status, title, message }: { status: 'error' | 'warning', title: string, message: string }) {
  const colors = {
    error: { bg: 'bg-red-500/10', text: 'text-red-600', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> },
    warning: { bg: 'bg-yellow-500/10', text: 'text-yellow-600', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
  }
  const { bg, text, icon } = colors[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="bg-card rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className={`w-16 h-16 ${bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <svg className={`w-8 h-8 ${text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}
