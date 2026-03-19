export interface OrderConfirmationTemplate {
  orderReference: string
  buyerName: string
  buyerEmail: string
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  total: number
  paymentMethod: 'mercadopago' | 'transfer'
  bankData?: Array<{
    bankName: string
    cbu: string
    alias: string
    holder: string
    cuit: string
    account_number?: string
    currency: string
  }>
  orderDate: string
  estimatedDelivery?: string
}

export interface PaymentConfirmedTemplate {
  orderReference: string
  buyerName: string
  total: number
  paymentDate: string
  ticketCount: number
  eventName?: string
  eventDate?: string
}

export interface AdminNotificationTemplate {
  orderReference: string
  buyerName: string
  buyerEmail: string
  buyerPhone?: string
  items: Array<{
    name: string
    quantity: number
  }>
  total: number
  paymentMethod: string
  timestamp: string
}

// Helper para sanitizar HTML
const sanitize = (text: string) =>
  text
    ?.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;') ?? ''

export function orderConfirmationTemplate(data: OrderConfirmationTemplate): string {
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: left;">${sanitize(item.name)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toLocaleString('es-AR')}</td>
    </tr>
  `,
    )
    .join('')

  const bankInfo =
    data.paymentMethod === 'transfer' && Array.isArray(data.bankData)
      ? data.bankData.map((bank) => `
    <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #ff6b35; margin-bottom: 16px;">
      <h3 style="margin-top: 0; color: #333;">📋 Datos para transferencia en ${bank.currency === 'USD' ? 'Dólares (USD)' : 'Pesos (ARS)'}</h3>
      <p><strong>Banco:</strong> ${sanitize(bank.bankName)}</p>
      ${bank.account_number ? `<p><strong>Caja de ahorro U$S:</strong> <code>${sanitize(bank.account_number)}</code></p>` : ''}
      <p><strong>CBU:</strong> <code>${sanitize(bank.cbu)}</code></p>
      <p><strong>Alias:</strong> <code>${sanitize(bank.alias)}</code></p>
      <p><strong>Titular:</strong> ${sanitize(bank.holder)}</p>
      <p><strong>CUIT:</strong> ${sanitize(bank.cuit)}</p>
      <p style="background: #fff3cd; padding: 12px; border-radius: 4px; margin-top: 15px; font-size: 14px;">
        <strong>⏰ Importante:</strong> Tenés 48 horas para realizar la transferencia. Incluí la referencia <code>${sanitize(data.orderReference)}</code> como concepto.
      </p>
    </div>
  `).join('') : ''

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de Orden - Plen Air</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 28px;">✓ Orden Confirmada</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Referencia: ${sanitize(data.orderReference)}</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      <p style="margin-top: 0;">Hola ${sanitize(data.buyerName)},</p>

      <p>¡Gracias por tu compra! Hemos recibido tu orden y la estamos procesando.</p>

      <h2 style="color: #667eea; margin-top: 25px; margin-bottom: 15px; font-size: 16px;">Detalle de tu orden</h2>

      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f5f5f5;">
            <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd;">Producto</th>
            <th style="padding: 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #ddd;">Cantidad</th>
            <th style="padding: 12px; text-align: right; font-weight: 600; border-bottom: 2px solid #ddd;">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align: right; margin-top: 15px;">
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #667eea;">
          Total: $${data.total.toLocaleString('es-AR')}
        </p>
      </div>

      ${bankInfo}

      <div style="background: #e8f5e9; padding: 15px; border-radius: 4px; margin-top: 20px; border-left: 4px solid #4caf50;">
        <p style="margin: 0; font-size: 14px; color: #2e7d32;">
          ${
            data.paymentMethod === 'mercadopago'
              ? '💳 Presiona "Pagar" en el próximo paso para completar el pago con Mercado Pago.'
              : '📧 Ya recibirás un email cuando confirmemos tu transferencia.'
          }
        </p>
      </div>

      <p style="margin-top: 25px; font-size: 13px; color: #666;">
        Si tenés preguntas, respondé este email o contactanos en soporte@plenair.com.ar
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee;">
      <p style="margin: 0;">© 2026 Plen Air. Todos los derechos reservados.</p>
      <p style="margin: 5px 0 0 0;">
        <a href="https://plenair.com.ar" style="color: #667eea; text-decoration: none;">www.plenair.com.ar</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}

export function paymentConfirmedTemplate(data: PaymentConfirmedTemplate): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pago confirmado - Plen Air</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); padding: 40px 20px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 28px;">🎉 ¡Pago Exitoso!</h1>
      <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px;">Orden ${sanitize(data.orderReference)}</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">
      <p style="margin-top: 0;">Hola ${sanitize(data.buyerName)},</p>

      <p><strong>Tu pago ha sido confirmado exitosamente.</strong></p>

      <div style="background: #f0f7ff; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1565c0;">📦 Detalles del pago</h3>
        <p><strong>Monto:</strong> $${data.total.toLocaleString('es-AR')}</p>
        <p><strong>Fecha:</strong> ${new Date(data.paymentDate).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        ${data.eventName ? `<p><strong>Evento:</strong> ${sanitize(data.eventName)}</p>` : ''}
        ${data.eventDate ? `<p><strong>Fecha del evento:</strong> ${new Date(data.eventDate).toLocaleDateString('es-AR')}</p>` : ''}
        <p style="margin: 0;"><strong>Entradas:</strong> ${data.ticketCount} ${data.ticketCount === 1 ? 'entrada' : 'entradas'}</p>
      </div>

      <div style="background: #fff3cd; padding: 15px; border-radius: 4px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px;">
          <strong>Tus entradas digitales están adjuntas a este email.</strong> Podés mostrarlas en tu teléfono o imprimirlas en la puerta del evento.
        </p>
      </div>

      <h3 style="color: #333; margin-top: 25px;">📋 Próximos pasos</h3>
      <ol style="padding-left: 20px;">
        <li>Descargá o capturé tus entradas (adjuntas abajo)</li>
        <li>Presentalas en la entrada del evento</li>
        <li>¡Disfrutá Plen Air!</li>
      </ol>

      <p style="margin-top: 25px; font-size: 13px; color: #666;">
        Si tenés preguntas o necesitás ayuda, respondé este email o contactanos en <a href="mailto:soporte@plenair.com.ar" style="color: #4caf50; text-decoration: none;">soporte@plenair.com.ar</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee;">
      <p style="margin: 0;">© 2026 Plen Air. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>
  `
}

export function adminNotificationTemplate(data: AdminNotificationTemplate): string {
  const itemsList = data.items.map((item) => `<li>${sanitize(item.name)} (x${item.quantity})</li>`).join('')

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva orden - Plen Air Admin</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; background: #f9f9f9; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: #ff6b35; padding: 20px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 20px;">🔔 Nueva Orden</h1>
    </div>

    <div style="padding: 20px;">
      <p><strong>Referencia:</strong> ${sanitize(data.orderReference)}</p>
      <p><strong>Cliente:</strong> ${sanitize(data.buyerName)} (${sanitize(data.buyerEmail)})</p>
      ${data.buyerPhone ? `<p><strong>Teléfono:</strong> ${sanitize(data.buyerPhone)}</p>` : ''}
      <p><strong>Método de pago:</strong> ${data.paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Transferencia bancaria'}</p>
      <p><strong>Total:</strong> $${data.total.toLocaleString('es-AR')}</p>
      <p><strong>Hora:</strong> ${new Date(data.timestamp).toLocaleString('es-AR')}</p>

      <h3>Productos:</h3>
      <ul style="padding-left: 20px;">
        ${itemsList}
      </ul>

      <p>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/ordenes" style="display: inline-block; background: #ff6b35; color: white; padding: 12px 20px; border-radius: 4px; text-decoration: none; font-weight: 600;">Ver Orden en Admin</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}

export function transferenceConfirmationTemplate(data: OrderConfirmationTemplate): string {
  if (!data.bankData) return ''

  return orderConfirmationTemplate(data) // Reutiliza el template de confirmación
}
