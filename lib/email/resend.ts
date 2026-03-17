import { Resend } from 'resend'

let resend: Resend | null = null;

function getRequiredEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`[EMAIL CONFIG] Missing env var: ${name}`)
  return v
}

const getResend = () => {
    if (!resend) {
        const key = getRequiredEnv('RESEND_API_KEY')
        resend = new Resend(key);
    }
    return resend;
}

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
    const resendClient = getResend();
    const finalFrom =
      from ||
      process.env.EMAIL_FROM ||
      'Convención Plein Air <info@manchaspleinair.com.ar>' // fallback seguro

    console.log("USANDO FROM:", finalFrom)

    const { data, error } = await resendClient.emails.send({
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

export async function sendEmailWithRetry(
  options: EmailOptions,
  retries = Number(process.env.EMAIL_RETRIES ?? 2),
  baseDelayMs = Number(process.env.EMAIL_RETRY_DELAY_MS ?? 400),
) {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1)
        await new Promise((r) => setTimeout(r, delay))
        console.warn(`[EMAIL] retry attempt ${attempt}/${retries}`, { to: options.to, subject: options.subject })
      }
      return await sendEmail(options)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

export async function sendBulkEmail(emails: EmailOptions[]) {
  const results = await Promise.all(emails.map((email) => sendEmail(email)))
  return results
}
