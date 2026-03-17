import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    content: string
    filename: string
    type: string
  }>
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
  attachments,
}: EmailOptions) {
  try {
    const finalFrom =
      from ||
      process.env.EMAIL_FROM ||
      'Convención Plein Air <info@manchaspleinair.com.ar>' // fallback seguro

    console.log("USANDO FROM:", finalFrom)

    const { data, error } = await resend.emails.send({
      from: finalFrom,
      to,
      subject,
      html,
      reply_to: replyTo || undefined,
      attachments: attachments?.map((att) => ({
        content: Buffer.from(att.content, 'base64'),
        filename: att.filename,
      })),
    })

    if (error) {
      console.error('[EMAIL ERROR]', error)
      throw new Error(error.message)
    }

    console.log('[EMAIL] Sent to:', to, 'ID:', data?.id)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('[EMAIL ERROR]', error)
    throw error
  }
}

export async function sendBulkEmail(emails: EmailOptions[]) {
  const results = await Promise.all(emails.map((email) => sendEmail(email)))
  return results
}
