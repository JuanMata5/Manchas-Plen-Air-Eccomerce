
export interface WelcomeTemplate {
  name: string;
}

export function welcomeEmailTemplate(data: WelcomeTemplate): string {
  const { name } = data;
  return `
    Asunto: Tu cuenta fue creada correctamente

    Hola ${name},

    ¡Bienvenido/a a Plen Air! Tu cuenta ha sido creada exitosamente.

    Ya podés explorar la plataforma y descubrir todo lo que tenemos para ofrecer.

    Si tenés alguna pregunta, no dudes en responder a este email.

    Saludos,
    El equipo de Plen Air
  `;
}

export interface PasswordResetTemplate {
  name: string;
  resetLink: string;
}

export function passwordResetEmailTemplate(data: PasswordResetTemplate): string {
  const { name, resetLink } = data;
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Restablecer contraseña</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu, Cantarell, sans-serif; line-height: 1.6; background: #f9f9f9; margin: 0; padding: 0; color: #222;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #eee;">
    <div style="background: #f59e0b; padding: 28px 20px; color: #111827;">
      <h1 style="margin: 0; font-size: 22px;">Restablecer contraseña</h1>
      <p style="margin: 8px 0 0 0; font-size: 13px; opacity: 0.9;">Solicitud de cambio de contraseña</p>
    </div>
    <div style="padding: 22px 20px;">
      <p style="margin-top: 0;">Hola ${name},</p>
      <p>Recibimos una solicitud para cambiar tu contraseña. Si no fuiste vos, podés ignorar este correo.</p>
      <div style="margin: 18px 0; text-align: center;">
        <a href="${resetLink}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">
          Crear una nueva contraseña
        </a>
      </div>
      <p style="font-size: 13px; color: #6b7280; margin-bottom: 0;">
        Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br/>
        <span style="word-break: break-all;">${resetLink}</span>
      </p>
    </div>
    <div style="background: #fafafa; padding: 14px 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #eee;">
      <p style="margin: 0;">Si necesitás ayuda, respondé este correo.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export interface PasswordChangedTemplate {
  name: string;
}

export function passwordChangedEmailTemplate(data: PasswordChangedTemplate): string {
  const { name } = data;
  return `
    Asunto: Tu contraseña fue actualizada

    Hola ${name},

    Te confirmamos que tu contraseña ha sido actualizada correctamente.

    Si no reconocés esta acción, por favor contactanos de inmediato respondiendo a este email.

    Saludos,
    El equipo de Plen Air
  `;
}

export interface OrderConfirmationTemplate {
    orderReference: string;
    buyerName: string;
    total: number;
    paymentMethod: string;
}

export function orderConfirmationEmailTemplate(data: OrderConfirmationTemplate): string {
    const { orderReference, buyerName, total, paymentMethod } = data;
    const paymentMethodText = paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia Bancaria';
    return `
        Asunto: Confirmación de tu orden #${orderReference}

        Hola ${buyerName},

        Gracias por tu compra. Tu orden #${orderReference} ha sido confirmada.

        Resumen de tu orden:
        - Total: $${total.toLocaleString('es-AR')}
        - Método de pago: ${paymentMethodText}

        Recibirás una notificación tan pronto como tu pago sea procesado.

        Si tenés alguna duda, podés responder a este correo.

        Saludos,
        El equipo de Plen Air
    `;
}

export interface AdminNotificationTemplate {
    orderReference: string;
    buyerName: string;
    buyerEmail: string;
    total: number;
}

export function adminNotificationEmailTemplate(data: AdminNotificationTemplate): string {
    const { orderReference, buyerName, buyerEmail, total } = data;
    return `
        Asunto: Nueva venta: #${orderReference}

        Se ha realizado una nueva venta en la plataforma.

        - Orden: #${orderReference}
        - Cliente: ${buyerName} (${buyerEmail})
        - Monto: $${total.toLocaleString('es-AR')}
    `;
}
