import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

export interface TicketData {
  orderReference: string
  ticketCode: string
  holderName: string
  productName: string
  eventDate?: string
  eventLocation?: string
  eventName?: string
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

  // Background color
  doc.setFillColor(102, 126, 234) // Purple gradient color
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F')

  // Title
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont(undefined, 'bold')
  doc.text('PLEN AIR', 15, 20)

  // Event info section
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.setFont(undefined, 'normal')

  let yPos = 45

  doc.text('INFORMACIÓN DE LA ENTRADA', 15, yPos)
  yPos += 10

  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)

  doc.text(`Código: ${ticket.ticketCode}`, 15, yPos)
  yPos += 7

  doc.text(`Titular: ${ticket.holderName}`, 15, yPos)
  yPos += 7

  if (ticket.productName) {
    doc.text(`Tipo de entrada: ${ticket.productName}`, 15, yPos)
    yPos += 7
  }

  if (ticket.eventDate) {
    const formattedDate = new Date(ticket.eventDate).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    doc.text(`Fecha: ${formattedDate}`, 15, yPos)
    yPos += 7
  }

  if (ticket.eventLocation) {
    const lines = doc.splitTextToSize(`Lugar: ${ticket.eventLocation}`, 180)
    doc.text(lines, 15, yPos)
    yPos += lines.length * 7 + 5
  }

  // QR Code section
  yPos += 10
  doc.setFont(undefined, 'bold')
  doc.setFontSize(10)
  doc.text('CÓDIGO QR (escanear en entrada)', 15, yPos)
  yPos += 8

  // Add QR code image to PDF - centered
  const qrSize = 60 // 60mm QR code
  const pageWidth = doc.internal.pageSize.getWidth()
  const qrX = (pageWidth - qrSize) / 2
  doc.addImage(qrDataURL, 'PNG', qrX, yPos, qrSize, qrSize)

  yPos += qrSize + 10

  // Footer with terms
  doc.setFontSize(8)
  doc.setFont(undefined, 'normal')
  doc.setTextColor(100, 100, 100)

  const footerText = [
    'Esta entrada es intransferible. Debe ser presentada en la entrada del evento.',
    `Referencia de orden: ${ticket.orderReference}`,
    'Para consultas: soporte@plenair.com.ar',
  ]

  footerText.forEach((line, idx) => {
    doc.text(line, 15, yPos + idx * 5)
  })

  // Add page number
  doc.setFontSize(9)
  doc.text(`Pág. 1`, pageWidth - 20, doc.internal.pageSize.getHeight() - 5)

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

    // Background color
    doc.setFillColor(102, 126, 234)
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F')

    // Title
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont(undefined, 'bold')
    doc.text('MANCHAS PLEN AIR', 15, 20)

    // Event info
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(11)
    doc.setFont(undefined, 'normal')

    let yPos = 45

    doc.text('INFORMACIÓN DE LA ENTRADA', 15, yPos)
    yPos += 10

    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)

    doc.text(`Código: ${ticket.ticketCode}`, 15, yPos)
    yPos += 7
    doc.text(`Titular: ${ticket.holderName}`, 15, yPos)
    yPos += 7

    if (ticket.productName) {
      doc.text(`Tipo: ${ticket.productName}`, 15, yPos)
      yPos += 7
    }

    if (ticket.eventDate) {
      const date = new Date(ticket.eventDate).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      doc.text(`Fecha: ${date}`, 15, yPos)
      yPos += 7
    }

    if (ticket.eventLocation) {
      doc.text(`Lugar: ${ticket.eventLocation}`, 15, yPos)
      yPos += 7
    }

    // QR
    yPos += 10
    doc.setFont(undefined, 'bold')
    doc.setFontSize(10)
    doc.text('CÓDIGO QR', 15, yPos)
    yPos += 8

    const qrSize = 60
    const pageWidth = doc.internal.pageSize.getWidth()
    const qrX = (pageWidth - qrSize) / 2
    doc.addImage(qrCodes[index], 'PNG', qrX, yPos, qrSize, qrSize)

    // Footer
    yPos += qrSize + 10
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(
      `Entrada ${index + 1}/${tickets.length} | Ref: ${ticket.orderReference} | soporte@plenair.com.ar`,
      15,
      yPos,
    )
  })

  return Buffer.from(doc.output('arraybuffer'))
}
