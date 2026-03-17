
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendEmail, EmailOptions } from "./resend";

/**
 * Añade un email a la cola de la base de datos para ser procesado.
 * Se usa desde server actions / route handlers.
 *
 * Importante: para poder encolar sin depender de sesión/cookies (y evitar RLS),
 * usamos el Service Role en servidor.
 */
export async function enqueueEmail(
  recipientEmail: string,
  subject: string,
  templateName: string,
  templateData: Record<string, any>,
  maxAttempts = 3,
) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await supabaseAdmin.from("email_queue").insert({
      recipient_email: recipientEmail,
      subject,
      template_name: templateName,
      template_data: templateData,
      attempts: 0,
      max_attempts: maxAttempts,
    });

  if (error) {
    console.error("[QUEUE ERROR] No se pudo insertar el email en la cola:", error);
    throw error;
  }

  console.log(`[QUEUE] Email para ${recipientEmail} añadido a la cola.`);
  return true;
}


/**
 * Procesa la cola de emails (para ser llamado por un Cron Job).
 * Usa un cliente de administrador de Supabase para operar sin sesión de usuario.
 */
export async function processEmailQueue() {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { data: pendingEmails, error: fetchError } = await supabaseAdmin
      .from("email_queue")
      .select("*")
      .is("sent_at", null)
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("[CRON ERROR] Fallo al obtener emails de la cola:", fetchError.message);
      throw fetchError;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log("[CRON] No hay emails pendientes para procesar.");
      return { sentCount: 0, failedCount: 0, processedCount: 0 };
    }

    console.log(`[CRON] Procesando ${pendingEmails.length} emails.`);

    let sentCount = 0;
    let failedCount = 0;

    for (const emailItem of pendingEmails) {
      if (typeof emailItem.max_attempts === "number" && emailItem.attempts >= emailItem.max_attempts) {
        console.warn(`[CRON] Saltando email ID ${emailItem.id} (max_attempts alcanzado).`);
        continue;
      }
      try {
        const html = await getTemplateHtml(emailItem.template_name, emailItem.template_data);

        const emailOptions: EmailOptions = {
          to: emailItem.recipient_email,
          subject: emailItem.subject,
          html,
          from: "Manchas Plein Air <info@manchaspleinair.com.ar>",
          replyTo: "info@manchaspleinair.com.ar"
        };

        await sendEmail(emailOptions);

        await supabaseAdmin.from("email_queue").update({
            sent_at: new Date().toISOString(),
            attempts: emailItem.attempts + 1,
          }).eq("id", emailItem.id);

        console.log(`[CRON] Email enviado a ${emailItem.recipient_email}`);
        sentCount += 1;
      } catch (err) {
        console.error(`[CRON ERROR] Fallo al procesar email ID: ${emailItem.id}:`, err);
        await supabaseAdmin.from("email_queue").update({
            attempts: emailItem.attempts + 1,
          }).eq("id", emailItem.id);
        failedCount += 1;
      }
    }

    return { sentCount, failedCount, processedCount: pendingEmails.length };
  } catch (err) {
    console.error("[CRON ERROR] Error fatal durante el procesamiento:", err);
    throw err; 
  }
}

/**
 * Obtiene el HTML de la plantilla basado en su nombre.
 */
async function getTemplateHtml(templateName: string, data: Record<string, any>): Promise<string> {
  const { orderConfirmationTemplate, paymentConfirmedTemplate } = await import("./templates");
  const { welcomeEmailTemplate, passwordResetEmailTemplate, passwordChangedEmailTemplate, orderConfirmationEmailTemplate, adminNotificationEmailTemplate } = await import("./transactional_templates");

  switch (templateName) {
    case "order_confirmation": return orderConfirmationTemplate(data);
    case "payment_confirmed": return paymentConfirmedTemplate(data);
    case "admin_notification": return adminNotificationEmailTemplate(data);
    case "welcome": return welcomeEmailTemplate(data);
    case "password_reset": return passwordResetEmailTemplate(data);
    case "password_changed": return passwordChangedEmailTemplate(data);
    case "order_confirmation_plain": return orderConfirmationEmailTemplate(data);
    default: throw new Error(`Plantilla desconocida: ${templateName}`);
  }
}
