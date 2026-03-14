import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/sendgrid'

const REFUND_REQUEST_MARKER = '[[REFUND_REQUEST]]'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { order_id, reason } = await request.json()
    if (!order_id) {
      return NextResponse.json({ error: 'order_id requerido' }, { status: 400 })
    }

    const adminDb = createAdminClient()
    const { data: order, error: orderError } = await adminDb
      .from('orders')
      .select('id, user_id, status, notes, buyer_name, buyer_email, created_at')
      .eq('id', order_id)
      .single()

    if (orderError || !order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (order.status !== 'paid') {
      return NextResponse.json({ error: 'Solo podes solicitar reembolso para ordenes pagadas' }, { status: 400 })
    }

    if (order.notes?.includes(REFUND_REQUEST_MARKER)) {
      return NextResponse.json({ error: 'Ya existe una solicitud de reembolso para esta orden' }, { status: 400 })
    }

    const trimmedReason = typeof reason === 'string' ? reason.trim() : ''
    const requestNote = `${REFUND_REQUEST_MARKER} ${new Date().toISOString()} | Cliente solicito reembolso${trimmedReason ? ` | Motivo: ${trimmedReason}` : ''}`
    const nextNotes = order.notes ? `${order.notes}\n${requestNote}` : requestNote

    const { error: updateError } = await adminDb
      .from('orders')
      .update({ notes: nextNotes })
      .eq('id', order_id)

    if (updateError) {
      console.error('[REFUND REQUEST] Update error:', updateError)
      return NextResponse.json({ error: 'No se pudo registrar la solicitud' }, { status: 500 })
    }

    if (process.env.ADMIN_EMAIL) {
      try {
        await sendEmail({
          to: process.env.ADMIN_EMAIL,
          subject: `Solicitud de reembolso #${order.id.slice(0, 8).toUpperCase()}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Solicitud de reembolso</h2>
              <p><strong>Orden:</strong> ${order.id.slice(0, 8).toUpperCase()}</p>
              <p><strong>Cliente:</strong> ${order.buyer_name}</p>
              <p><strong>Email:</strong> ${order.buyer_email}</p>
              <p><strong>Fecha de compra:</strong> ${new Date(order.created_at).toLocaleDateString('es-AR')}</p>
              <p><strong>Motivo:</strong> ${trimmedReason || 'No informado'}</p>
            </div>
          `,
        })
      } catch (emailError) {
        console.warn('[REFUND REQUEST] Email notification failed:', emailError)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[REFUND REQUEST] Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}