import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/sendgrid'

export async function POST(request: NextRequest) {
  try {
    const { name, email, message } = await request.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
      console.warn('[CONTACT] No ADMIN_EMAIL configured')
      return NextResponse.json({ success: true })
    }

    // Send notification to admin
    sendEmail({
      to: adminEmail,
      subject: `Nuevo mensaje de contacto — ${name}`,
      replyTo: email,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a1a1a; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #fff; font-size: 20px; margin: 0;">Nuevo mensaje de contacto</h1>
          </div>
          <div style="padding: 24px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; color: #666; font-size: 14px; width: 80px;">Nombre</td>
                <td style="padding: 10px 0; font-weight: bold; font-size: 14px;">${name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; color: #666; font-size: 14px;">Email</td>
                <td style="padding: 10px 0; font-size: 14px;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td>
              </tr>
            </table>
            <div style="margin-top: 16px; padding: 16px; background: #f4f4f5; border-radius: 8px; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #333;">
${message}
            </div>
            <p style="margin-top: 16px; font-size: 12px; color: #999;">
              Podes responder directamente a este email para contestarle a ${name}.
            </p>
          </div>
        </div>
      `,
    }).catch((e) => console.warn('[CONTACT] Email failed:', e))

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[CONTACT] Error:', err)
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
  }
}
