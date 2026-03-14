import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateTicketPDF } from '@/lib/pdf/ticket-generator'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { ticket_id } = await request.json()

    if (!ticket_id) {
      return NextResponse.json({ error: 'ticket_id requerido' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Get ticket + verify it belongs to the user
    const { data: ticket } = await adminDb
      .from('tickets')
      .select('*, products(name, event_date, event_location), orders(id, user_id, buyer_name)')
      .eq('id', ticket_id)
      .single()

    if (!ticket || ticket.orders?.user_id !== user.id) {
      return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    // Generate PDF
    const pdfBuffer = await generateTicketPDF({
      orderReference: ticket.orders.id.slice(0, 8).toUpperCase(),
      ticketCode: ticket.qr_code,
      holderName: ticket.holder_name,
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
    console.error('[TICKET DOWNLOAD]', err)
    return NextResponse.json({ error: 'Error al generar PDF' }, { status: 500 })
  }
}
