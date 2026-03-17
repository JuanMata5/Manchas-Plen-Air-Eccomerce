
import { enqueueEmail } from "./queue";
import { sendEmail } from "./resend";
import { passwordResetEmailTemplate } from "./transactional_templates";

const FROM_EMAIL = process.env.EMAIL_FROM || "info@manchaspleinair.com.ar";

/**
 * Encola un email de bienvenida para un nuevo usuario.
 */
export async function sendWelcomeEmail(name: string, email: string) {
  try {
    console.log(`[ACTION] Enqueuing welcome email for ${email}`);
    await enqueueEmail(
      email,
      "Tu cuenta fue creada correctamente",
      "welcome",
      { name }
    );
    console.log(`[ACTION] Welcome email enqueued for ${email}`);
  } catch (error) {
    console.error(`[ACTION ERROR] Failed to enqueue welcome email for ${email}:`, error);
    throw error;
  }
}

/**
 * Envía (directo) el email para restablecer la contraseña.
 * Esto evita depender del cron/cola para un flujo crítico de UX.
 */
export async function sendPasswordResetEmail(name: string, email: string, resetLink: string) {
  try {
    console.log(`[ACTION] Sending password reset email for ${email}`);
    const html = passwordResetEmailTemplate({ name, resetLink });
    await sendEmail({
      to: email,
      subject: "Solicitud de cambio de contraseña",
      html,
    });
    console.log(`[ACTION] Password reset email sent for ${email}`);
  } catch (error) {
    console.error(`[ACTION ERROR] Failed to send password reset for ${email}:`, error);
    throw error;
  }
}

/**
 * Encola un email de confirmación de cambio de contraseña.
 */
export async function sendPasswordChangedEmail(name: string, email: string) {
  try {
    console.log(`[ACTION] Enqueuing password changed confirmation for ${email}`);
    await enqueueEmail(
      email,
      "Tu contraseña fue actualizada",
      "password_changed",
      { name }
    );
    console.log(`[ACTION] Password changed confirmation enqueued for ${email}`);
  } catch (error) {
    console.error(`[ACTION ERROR] Failed to enqueue password changed confirmation for ${email}:`, error);
    throw error;
  }
}

/**
 * Encola un email de confirmación de orden (texto plano).
 */
export async function sendOrderConfirmationEmail(
  buyerName: string,
  buyerEmail: string,
  orderReference: string,
  total: number,
  paymentMethod: string
) {
  try {
    console.log(`[ACTION] Enqueuing order confirmation for ${buyerEmail}`);
    await enqueueEmail(
      buyerEmail,
      `Confirmación de tu orden #${orderReference}`,
      "order_confirmation_plain",
      { buyerName, orderReference, total, paymentMethod }
    );
    console.log(`[ACTION] Order confirmation enqueued for ${buyerEmail}`);
  } catch (error) {
    console.error(`[ACTION ERROR] Failed to enqueue order confirmation for ${buyerEmail}:`, error);
    throw error;
  }
}

/**
 * Encola un email de notificación para el administrador.
 */
export async function sendAdminNotificationEmail(
  orderReference: string,
  buyerName: string,
  buyerEmail: string,
  total: number
) {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@manchaspleinair.com.ar";
  try {
    console.log(`[ACTION] Enqueuing admin notification for order ${orderReference}`);
    await enqueueEmail(
      adminEmail,
      `Nueva venta: #${orderReference}`,
      "admin_notification",
      { orderReference, buyerName, buyerEmail, total }
    );
    console.log(`[ACTION] Admin notification enqueued for order ${orderReference}`);
  } catch (error) {
    console.error(`[ACTION ERROR] Failed to enqueue admin notification for ${orderReference}:`, error);
    throw error;
  }
}
