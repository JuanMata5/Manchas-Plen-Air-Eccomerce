import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { SUPPORT_WHATSAPP_DISPLAY, createWhatsAppLink } from '@/lib/contact'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { order_id, subject, message, update_status } = await request.json()

    if (!order_id || !subject || !message) {
      return NextResponse.json({ error: 'order_id, subject y message requeridos' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    const { data: order } = await adminDb
      .from('orders')
      .select('id, buyer_email, buyer_name, total_ars, payment_method')
      .eq('id', order_id)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // Update order status first (this always works)
    if (update_status) {
      await adminDb
        .from('orders')
        .update({ status: update_status })
        .eq('id', order_id)
    }

    const whatsappUrl = createWhatsAppLink(`Hola, tengo una consulta sobre mi orden #${order.id.slice(0, 8).toUpperCase()}.`)

    // Try to send email
    let emailSent = false
    let emailError = ''
    try {
      await sendEmail({
        to: order.buyer_email,
        subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a1a1a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #fff; font-size: 24px; margin: 0;">Plen Air</h1>
            </div>
            <div style="padding: 24px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="color: #333; font-size: 16px;">Hola <strong>${order.buyer_name}</strong>,</p>
              <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0; color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</div>
              <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Orden</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 14px;">#${order.id.slice(0, 8).toUpperCase()}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Metodo de pago</td>
                  <td style="padding: 8px 0; text-align: right; font-size: 14px;">${order.payment_method === 'transfer' ? 'Transferencia' : 'Mercado Pago'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-size: 14px;">Total</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 16px; color: #16a34a;">$${order.total_ars.toLocaleString('es-AR')}</td>
                </tr>
              </table>
              ${update_status === 'paid' ? '<div style="background: #dcfce7; color: #166534; padding: 12px 16px; border-radius: 8px; text-align: center; font-weight: bold;">Pago confirmado</div>' : ''}
              <div style="background: #f5f5f5; padding: 14px; border-radius: 8px; margin-top: 16px; font-size: 14px; color: #333;">
                Para consultas, escribinos por WhatsApp al <a href="${whatsappUrl}" style="color: #25D366; font-weight: 700; text-decoration: none;">${SUPPORT_WHATSAPP_DISPLAY}</a>.
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
              <p style="color: #999; font-size: 12px; text-align: center;">Plen Air — Convencion de pintura al aire libre</p>
            </div>
          </div>
        `,
      })
      emailSent = true
    } catch (err: any) {
      emailError = err?.message || 'Error desconocido al enviar email'
      console.warn('[ADMIN] Email send failed (status still updated):', emailError)
    }

    return NextResponse.json({
      success: true,
      email_sent: emailSent,
      email_error: emailError || undefined,
      status_updated: !!update_status,
    })
  } catch (err) {
    console.error('[ADMIN] Send email error:', err)
    return NextResponse.json({ error: 'Error al enviar email' }, { status: 500 })
  }
}
