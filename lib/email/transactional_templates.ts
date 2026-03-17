
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
    Asunto: Solicitud de cambio de contraseña

    Hola ${name},

    Recibimos una solicitud para cambiar tu contraseña. Si no fuiste vos, por favor ignorá este email.

    Para continuar, hacé click en el siguiente enlace:
    ${resetLink}

    Este enlace expira en 1 hora.

    Saludos,
    El equipo de Plen Air
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
