import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'

export interface BookingData {
  bookingReference: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  experienceTitle: string
  planName: string
  location: string
  dates: string
  priceUsd: number
  priceArsBlue: number
  paymentStatus: 'deposit_paid' | 'paid'
  orderReference: string
  isDeposit?: boolean
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

function formatCurrency(amount: number, currency: 'USD' | 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
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

export async function generateBookingPDF(data: BookingData): Promise<Buffer> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Background
  doc.setFillColor(...COLORS.background)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Header
  doc.setFillColor(...COLORS.orange)
  doc.rect(0, 0, pageWidth, 40, 'F')

  doc.setFontSize(20)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('CONFIRMACIÓN DE RESERVA', pageWidth / 2, 25, { align: 'center' })

  // Subtitle
  const subtitle = data.isDeposit ? 'DEPÓSITO CONFIRMADO' : 'PAGO COMPLETO'
  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.text(subtitle, pageWidth / 2, 35, { align: 'center' })

  // Main card
  const cardY = 50
  const cardHeight = 180
  doc.setFillColor(...COLORS.card)
  doc.setDrawColor(...COLORS.border)
  doc.roundedRect(20, cardY, pageWidth - 40, cardHeight, 5, 5, 'FD')

  let currentY = cardY + 20

  // Booking Reference
  currentY = writeLabelValue(doc, 'Referencia de Reserva', data.bookingReference, 30, currentY, 80)

  // Customer Info
  currentY = writeLabelValue(doc, 'Nombre', data.customerName, 30, currentY, 80)
  currentY = writeLabelValue(doc, 'Email', data.customerEmail, 30, currentY, 80)
  if (data.customerPhone) {
    currentY = writeLabelValue(doc, 'Teléfono', data.customerPhone, 30, currentY, 80)
  }

  // Experience Info
  currentY = writeLabelValue(doc, 'Experiencia', data.experienceTitle, 30, currentY, 80)
  currentY = writeLabelValue(doc, 'Plan', data.planName, 30, currentY, 80)
  currentY = writeLabelValue(doc, 'Ubicación', data.location, 30, currentY, 80)
  currentY = writeLabelValue(doc, 'Fechas', data.dates, 30, currentY, 80)

  // Payment Info
  const paymentLabel = data.isDeposit ? 'Monto del Depósito' : 'Monto Total'
  const paymentAmount = data.isDeposit ? Math.min(500000, data.priceArsBlue) : data.priceArsBlue
  currentY = writeLabelValue(doc, paymentLabel, formatCurrency(paymentAmount, 'ARS'), 30, currentY, 80)

  if (data.priceUsd > 0) {
    currentY = writeLabelValue(doc, 'Valor USD', formatCurrency(data.priceUsd, 'USD'), 30, currentY, 80)
  }

  // QR Code
  try {
    const qrData = `RESERVA-${data.bookingReference}`
    const qrCodeDataURL = await QRCode.toDataURL(qrData, { width: 100 })
    doc.addImage(qrCodeDataURL, 'PNG', pageWidth - 120, cardY + 20, 80, 80)
  } catch (error) {
    console.error('Error generating QR code:', error)
  }

  // Footer
  const footerY = pageHeight - 30
  doc.setFontSize(8)
  doc.setTextColor(...COLORS.muted)
  doc.text('Esta reserva está sujeta a confirmación final. Te contactaremos pronto con más detalles.', pageWidth / 2, footerY, { align: 'center' })
  doc.text(`Orden: ${data.orderReference}`, pageWidth / 2, footerY + 10, { align: 'center' })

  return Buffer.from(doc.output('arraybuffer'))
}

export async function generateDepositConfirmationPDF(data: BookingData): Promise<Buffer> {
  data.isDeposit = true
  return generateBookingPDF(data)
}

export async function generateFullPaymentConfirmationPDF(data: BookingData): Promise<Buffer> {
  data.isDeposit = false
  return generateBookingPDF(data)
}