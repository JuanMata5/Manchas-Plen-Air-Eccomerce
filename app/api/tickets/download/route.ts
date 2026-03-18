import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateTicketPDF } from '@/lib/pdf/ticket-generator'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { ticket_id } = await request.json()

    if (!ticket_id) {
      return NextResponse.json({ error: 'ticket_id requerido' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // 1. Obtener el ticket y la orden asociada.
    const { data: ticket, error: ticketError } = await adminDb
      .from('tickets')
      .select('*, products(name, event_date, event_location), orders(id, user_id)')
      .eq('id', ticket_id)
      .single()

    if (ticketError || !ticket) {
      console.error('Error fetching ticket:', ticketError)
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    const orderOwnerId = ticket.orders?.user_id;

    if (!orderOwnerId) {
        return NextResponse.json({ error: 'El ticket no está asociado a una orden válida' }, { status: 404 })
    }
    
    // 2. Verificar permisos: El usuario actual debe ser el dueño de la orden O ser un admin.
    const { data: { user: ownerUser } } = await adminDb.auth.admin.getUserById(orderOwnerId)
    
    const { data: profile } = await adminDb
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()
      
    const isOwner = currentUser.id === orderOwnerId;
    const isAdmin = profile?.role === 'admin';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Acceso denegado. No eres el propietario de este ticket.' }, { status: 403 })
    }

    // 3. Obtener los datos del DUEÑO REAL de la orden desde la tabla de autenticación.
    if (!ownerUser) {
        return NextResponse.json({ error: 'No se pudo encontrar al propietario original de la orden.' }, { status: 404 })
    }

    const holderName = ownerUser.user_metadata?.full_name || 'Nombre no disponible';
    const holderEmail = ownerUser.email || 'Email no disponible';

    // 4. Generar el PDF con los datos correctos del dueño.
    const pdfBuffer = await generateTicketPDF({
      orderReference: ticket.orders!.id.slice(0, 8).toUpperCase(),
      ticketCode: ticket.qr_code,
      holderName: holderName,
      holderEmail: holderEmail, // <-- DATO CORREGIDO
      productName: ticket.products?.name || 'Entrada',
      eventName: ticket.products?.name || 'Evento',
      eventDate: ticket.products?.event_date || undefined,
      eventLocation: ticket.products?.event_location || undefined,
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ticket-${ticket.qr_code}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[TICKET DOWNLOAD ERROR]', err)
    return NextResponse.json({ error: 'Error interno al generar el PDF del ticket' }, { status: 500 })
  }
}
