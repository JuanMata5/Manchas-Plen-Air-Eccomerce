import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/sendgrid'

/**
 * POST /api/emails/send
 * Send email (internal endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, from, replyTo, attachments } = await request.json()

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await sendEmail({
      to,
      subject,
      html,
      from,
      replyTo,
      attachments,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[SEND EMAIL ERROR]', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
