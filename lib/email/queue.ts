import { createClient } from "@/lib/supabase/server";
import { sendEmail, EmailOptions } from "./resend";

export interface EmailQueueItem {
  id: string;
  recipientEmail: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
  sentAt: string | null;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
}

/**
 * Add email to queue
 */
export async function enqueueEmail(
  recipientEmail: string,
  subject: string,
  templateName: string,
  templateData: Record<string, any>,
  maxAttempts = 3,
) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("email_queue").insert({
      recipient_email: recipientEmail,
      subject,
      template_name: templateName,
      template_data: templateData,
      attempts: 0,
      max_attempts: maxAttempts,
    });

    if (error) {
      console.error("[QUEUE ERROR]", error);
      throw error;
    }

    console.log("[QUEUE] Email enqueued for", recipientEmail);
    return true;
  } catch (err) {
    console.error("[QUEUE] Failed to enqueue email:", err);
    return false;
  }
}

/**
 * Process email queue (meant to be called by cron job)
 */
export async function processEmailQueue() {
  try {
    const supabase = await createClient();

    // Get pending emails
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .is("sent_at", null)
      .lt("attempts", supabase.rpc("max_attempts"))
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("[QUEUE PROCESS ERROR]", fetchError);
      return;
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log("[QUEUE] No pending emails");
      return;
    }

    console.log(`[QUEUE] Processing ${pendingEmails.length} emails`);

    for (const emailItem of pendingEmails) {
      try {
        // Get template based on templateName
        const html = await getTemplateHtml(
          emailItem.template_name,
          emailItem.template_data,
        );

        const emailOptions: EmailOptions = {
          to: emailItem.recipient_email,
          subject: emailItem.subject,
          html,
          from: "Convención Plein Air <info@manchaspleinair.com.ar>",
        };

        // Send email
        await sendEmail(emailOptions);

        // Mark as sent
        await supabase
          .from("email_queue")
          .update({
            sent_at: new Date().toISOString(),
            attempts: emailItem.attempts + 1,
          })
          .eq("id", emailItem.id);

        console.log("[QUEUE] Email sent to", emailItem.recipient_email);
      } catch (err) {
        console.error("[QUEUE] Failed to send email:", emailItem.id, err);

        // Increment attempts
        await supabase
          .from("email_queue")
          .update({
            attempts: emailItem.attempts + 1,
          })
          .eq("id", emailItem.id);
      }
    }
  } catch (err) {
    console.error("[QUEUE PROCESS] Fatal error:", err);
  }
}

/**
 * Get template HTML based on template name
 */
async function getTemplateHtml(
  templateName: string,
  data: Record<string, any>,
): Promise<string> {
  // Import templates dynamically to avoid circular dependencies
  const {
    orderConfirmationTemplate,
    paymentConfirmedTemplate,
    adminNotificationTemplate,
  } = await import("./templates");

  switch (templateName) {
    case "order_confirmation":
      return orderConfirmationTemplate(data);
    case "payment_confirmed":
      return paymentConfirmedTemplate(data);
    case "admin_notification":
      return adminNotificationTemplate(data);
    default:
      throw new Error(`Unknown template: ${templateName}`);
  }
}
