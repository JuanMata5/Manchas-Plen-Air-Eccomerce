
import { createClient } from '@supabase/supabase-js';
import { sendEmail, EmailOptions } from "./resend";

// NOTE: This file is used by CRON jobs and needs to use the admin client.

/**
 * Process email queue (meant to be called by cron job)
 */
export async function processEmailQueue() {
  // For server-side operations without a user session (like cron jobs),
  // we MUST use the admin client with the service role key.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get pending emails
    const { data: pendingEmails, error: fetchError } = await supabaseAdmin
      .from("email_queue")
      .select("*")
      .is("sent_at", null)
      // .lt("attempts", supabase.rpc("max_attempts")) // This was complex, simplifying for now
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("[QUEUE PROCESS ERROR] Fetching emails:", fetchError.message);
      throw fetchError; // Throw to be caught by the main try/catch
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log("[QUEUE] No pending emails to process.");
      return;
    }

    console.log(`[QUEUE] Processing ${pendingEmails.length} emails`);

    for (const emailItem of pendingEmails) {
      try {
        const html = await getTemplateHtml(
          emailItem.template_name,
          emailItem.template_data,
        );

        const emailOptions: EmailOptions = {
          to: emailItem.recipient_email,
          subject: emailItem.subject,
          html,
          from: "Manchas Plein Air <info@manchaspleinair.com.ar>",
          replyTo: "info@manchaspleinair.com.ar"
        };

        // Send email via Resend
        await sendEmail(emailOptions);

        // Mark as sent in the database
        await supabaseAdmin
          .from("email_queue")
          .update({
            sent_at: new Date().toISOString(),
            attempts: emailItem.attempts + 1,
          })
          .eq("id", emailItem.id);

        console.log("[QUEUE] Email sent successfully to", emailItem.recipient_email);
      } catch (err) {
        console.error(`[QUEUE] Failed to process email ID: ${emailItem.id}:`, err);

        // Increment attempts even if sending failed
        await supabaseAdmin
          .from("email_queue")
          .update({
            attempts: emailItem.attempts + 1,
          })
          .eq("id", emailItem.id);
      }
    }
  } catch (err) {
    console.error("[QUEUE PROCESS] Fatal error during queue processing:", err);
    // The main function in `app/api/cron/route.ts` will catch this and return a 500 error.
    throw err; 
  }
}

/**
 * Get template HTML based on template name
 */
async function getTemplateHtml(
  templateName: string,
  data: Record<string, any>,
): Promise<string> {
  const {
    orderConfirmationTemplate,
    paymentConfirmedTemplate,
  } = await import("./templates");

  const {
    welcomeEmailTemplate,
    passwordResetEmailTemplate,
    passwordChangedEmailTemplate,
    orderConfirmationEmailTemplate,
    adminNotificationEmailTemplate,
  } = await import("./transactional_templates");

  switch (templateName) {
    case "order_confirmation":
      return orderConfirmationTemplate(data);
    case "payment_confirmed":
      return paymentConfirmedTemplate(data);
    case "admin_notification":
        return adminNotificationEmailTemplate(data);
    case "welcome":
        return welcomeEmailTemplate(data);
    case "password_reset":
        return passwordResetEmailTemplate(data);
    case "password_changed":
        return passwordChangedEmailTemplate(data);
    case "order_confirmation_plain":
        return orderConfirmationEmailTemplate(data);
    default:
      throw new Error(`Unknown template: ${templateName}`);
  }
}

// The enqueueEmail function is no longer needed here as it's handled by transactional_templates.ts
