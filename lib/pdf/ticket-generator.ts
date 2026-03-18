import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

export interface TicketData {
  orderReference: string
  ticketCode: string
  holderName: string
  dni?: string
  productName: string
  eventDate?: string
  eventLocation?: string
  eventName?: string
}

const COLORS = {
  orange: [234, 106, 35] as const,
  orangeDark: [196, 79, 18] as const,
  background: [250, 247, 243] as const,
  card: [255, 255, 255] as const,
  text: [38, 38, 38] as const,
  muted: [112, 112, 112] as const,
  border: [226, 220, 212] as const,
}

function formatEventDate(value?: string): string {
  if (!value) return 'A confirmar'
  try {
    return new Date(value).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return value
  }
}

function writeLabelValue(doc: jsPDF, label: string, value: string, x: number, y: number, width: number): number {
  doc.setFont(undefined, 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.muted)
  doc.text(label.toUpperCase(), x, y)

  doc.setFont(undefined, 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...COLORS.text)
  const lines = doc.splitTextToSize(value || '-', width)
  doc.text(lines, x, y + 5)
  return y + 5 + lines.length * 5 + 4
}

function drawTicketPage(
  doc: jsPDF,
  ticket: TicketData,
  qrDataUrl: string,
  pageNumber: number,
  totalPages: number,
) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  doc.setFillColor(...COLORS.background)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  doc.setFillColor(...COLORS.orange)
  doc.rect(0, 0, pageWidth, 32, 'F')

  doc.setDrawColor(...COLORS.orangeDark)
  doc.setLineWidth(0.6)
  doc.line(0, 32, pageWidth, 32)

  doc.setTextColor(255, 255, 255)
  doc.setFont(undefined, 'bold')
  doc.setFontSize(22)
  doc.text('MANCHAS PLEIN AIR', 14, 14)

  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  doc.text('Entrada oficial - valida para ingreso', 14, 21)
  doc.text('www.manchaspleinair.com', 14, 27)

  const cardX = 12
  const cardY = 39
  const cardW = pageWidth - 24
  const cardH = pageHeight - 56

  doc.setFillColor(...COLORS.card)
  doc.setDrawColor(...COLORS.border)
  doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, 'FD')

  doc.setFillColor(255, 243, 233)
  doc.roundedRect(cardX + 4, cardY + 4, cardW - 8, 16, 3, 3, 'F')

  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.orangeDark)
  doc.text(ticket.eventName || 'Evento destacado', cardX + 8, cardY + 12)

  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.muted)
  doc.text(`Codigo de entrada: ${ticket.ticketCode}`, cardX + 8, cardY + 18)

  const detailsX = cardX + 8
  const detailsY = cardY + 30
  const detailsW = 108

  let cursorY = detailsY
  cursorY = writeLabelValue(doc, 'Titular', ticket.holderName, detailsX, cursorY, detailsW)
  if (ticket.dni && ticket.dni.trim() !== '') {
    cursorY = writeLabelValue(doc, 'DNI', ticket.dni, detailsX, cursorY, detailsW)
  }
  cursorY = writeLabelValue(doc, 'Tipo de entrada', ticket.productName || 'General', detailsX, cursorY, detailsW)
  cursorY = writeLabelValue(doc, 'Fecha', formatEventDate(ticket.eventDate), detailsX, cursorY, detailsW)
  const defaultLocation = 'Círculo de Oficiales de Mar — Sarmiento 1867, CABA';
  cursorY = writeLabelValue(
    doc,
    'Ubicacion',
    ticket.eventLocation || defaultLocation,
    detailsX,
    cursorY,
    detailsW,
  )

  doc.setFillColor(248, 248, 248)
  doc.setDrawColor(...COLORS.border)
  doc.roundedRect(detailsX, cursorY + 2, detailsW, 30, 2, 2, 'FD')
  doc.setFont(undefined, 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  doc.text('Condiciones', detailsX + 3, cursorY + 8)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.muted)
  const terms = [
    'Entrada transferible y valida para un ingreso.',
    'Presentar QR en puerta junto con documento.',
    'Reembolsos sujetos a la politica publicada.',
  ]
  doc.text(terms, detailsX + 3, cursorY + 13)

  const qrBoxX = cardX + cardW - 64
  const qrBoxY = cardY + 30
  const qrBoxW = 52
  const qrBoxH = 78

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...COLORS.border)
  doc.roundedRect(qrBoxX, qrBoxY, qrBoxW, qrBoxH, 2, 2, 'FD')

  doc.setFont(undefined, 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.text)
  doc.text('Validacion QR', qrBoxX + 6, qrBoxY + 8)

  doc.addImage(qrDataUrl, 'PNG', qrBoxX + 6, qrBoxY + 12, 40, 40)

  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.muted)
  const scanLines = doc.splitTextToSize('Escanear este codigo al ingresar al evento.', qrBoxW - 8)
  doc.text(scanLines, qrBoxX + 4, qrBoxY + 58)

  doc.setDrawColor(...COLORS.border)
  doc.line(cardX + 6, pageHeight - 24, pageWidth - 18, pageHeight - 24)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.muted)
  doc.text(`Referencia de orden: ${ticket.orderReference}`, cardX + 6, pageHeight - 18)
  doc.text('Soporte: soporte@plenair.com.ar', cardX + 6, pageHeight - 13)
  doc.text(`Pagina ${pageNumber}/${totalPages}`, pageWidth - 30, pageHeight - 13)
}

/**
 * Generate a single ticket PDF with QR code
 */
export async function generateTicketPDF(ticket: TicketData): Promise<Buffer> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const qrUrl = `${baseUrl}/tickets/validar/${ticket.ticketCode}`
  const qrDataURL = await QRCode.toDataURL(qrUrl, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.95,
    margin: 1,
    width: 200,
  })

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  drawTicketPage(doc, ticket, qrDataURL, 1, 1)

  return Buffer.from(doc.output('arraybuffer'))
}

/**
 * Generate multiple tickets PDF (one per page)
 */
export async function generateMultipleTicketsPDF(tickets: TicketData[]): Promise<Buffer> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const qrCodes = await Promise.all(
    tickets.map((t) =>
      QRCode.toDataURL(`${baseUrl}/tickets/validar/${t.ticketCode}`, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.95,
        margin: 1,
        width: 200,
      }),
    ),
  )

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  tickets.forEach((ticket, index) => {
    if (index > 0) {
      doc.addPage()
    }

    drawTicketPage(doc, ticket, qrCodes[index], index + 1, tickets.length)
  })

  return Buffer.from(doc.output('arraybuffer'))
}
