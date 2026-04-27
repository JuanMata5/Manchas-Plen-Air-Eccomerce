import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateTicketPDF } from '@/lib/pdf/ticket-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params

    if (!code) {
      return NextResponse.json({ error: 'Codigo requerido' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    const { data: ticket } = await adminDb
      .from('tickets')
      .select('*, products(name, event_date, event_location), orders(id, user_id)')
      .eq('qr_code', code)
      .single()

    if (!ticket || !ticket.orders) {
      return new NextResponse(
        '<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>Ticket no encontrado</h1><p>El codigo QR no es valido.</p></div></body></html>',
        { status: 404, headers: { 'Content-Type': 'text/html' } },
      )
    }

    // Obtener datos reales del dueño
    const { data: { user: ownerUser } } = await adminDb.auth.admin.getUserById(ticket.orders.user_id)
    const holderName = ownerUser?.user_metadata?.full_name || 'Nombre no disponible';
    const holderEmail = ownerUser?.email || 'Email no disponible';
    const holderDni = ownerUser?.user_metadata?.dni || '';
    const holderPhone = ownerUser?.user_metadata?.phone || '';

    const pdfBuffer = await generateTicketPDF({
      orderReference: ticket.orders.id.slice(0, 8).toUpperCase(),
      ticketCode: ticket.qr_code,
      holderName,
      holderEmail,
      dni: holderDni,
      phone: holderPhone,
      productName: ticket.products?.name || 'Entrada',
      eventName: ticket.products?.name || 'Evento',
      eventDate: ticket.products?.event_date || undefined,
      eventLocation: ticket.products?.event_location || undefined,
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="ticket-${ticket.qr_code}.pdf"`,
      },
    })
  } catch (err) {
    console.error('[QR DOWNLOAD]', err)
    return NextResponse.json({ error: 'Error al generar ticket' }, { status: 500 })
  }
}
