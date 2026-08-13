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
  priceUsd?: number
  priceArsBlue?: number
  priceTotal?: number
  amountPaid?: number
  balanceDue?: number
  passengerCount?: number
  paymentStatus: 'deposit_paid' | 'paid'
  orderReference: string
  qrToken?: string | null
}

const money = (amount: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(amount)

function row(doc: jsPDF, label: string, value: string, y: number) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(100)
  doc.text(label.toUpperCase(), 25, y)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(35)
  doc.text(doc.splitTextToSize(value || '-', 110), 25, y + 5)
  return y + 14
}

export async function generateBookingPDF(data: BookingData): Promise<Buffer> {
  const priceTotal = Number(data.priceTotal ?? data.priceArsBlue ?? 0)
  const balanceDue = Number(data.balanceDue ?? (data.paymentStatus === 'paid' ? 0 : priceTotal))
  const amountPaid = Number(data.amountPaid ?? Math.max(0, priceTotal - balanceDue))
  const fullPaid = data.paymentStatus === 'paid' && balanceDue <= 0
  const doc = new jsPDF(); const w = doc.internal.pageSize.getWidth()
  doc.setFillColor(234, 106, 35); doc.rect(0, 0, w, 42, 'F')
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(19)
  doc.text(fullPaid ? 'RESERVA CONFIRMADA' : 'COMPROBANTE DE RESERVA', w / 2, 20, { align: 'center' })
  doc.setFontSize(11); doc.text(fullPaid ? 'PAGO COMPLETO' : 'RESERVA CON PAGO PARCIAL', w / 2, 32, { align: 'center' })
  doc.setDrawColor(226, 220, 212); doc.roundedRect(18, 52, w - 36, 177, 4, 4, 'S')
  let y = 68
  y = row(doc, 'Código de reserva', data.bookingReference, y)
  y = row(doc, 'Pasajero', data.customerName, y)
  y = row(doc, 'Email', data.customerEmail, y)
  y = row(doc, 'Viaje', data.experienceTitle, y)
  y = row(doc, 'Plan / destino', `${data.planName} — ${data.location}`, y)
  y = row(doc, 'Fecha del viaje', data.dates, y)
  y = row(doc, 'Pasajeros', String(data.passengerCount || 1), y)
  y = row(doc, 'Precio total', money(priceTotal), y)
  y = row(doc, 'Importe abonado', money(amountPaid), y)
  y = row(doc, 'Saldo pendiente', money(balanceDue), y)
  if (fullPaid && data.qrToken) {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const qr = await QRCode.toDataURL(`${base}/reservation/verify/${data.qrToken}`, { width: 120 })
    doc.addImage(qr, 'PNG', w - 74, 65, 45, 45)
    doc.setFontSize(8); doc.setTextColor(70); doc.text('QR de validación', w - 51, 115, { align: 'center' })
  }
  doc.setFontSize(9); doc.setTextColor(80)
  const message = fullPaid
    ? 'PAGO COMPLETO — RESERVA CONFIRMADA. Presentá este QR al momento del check-in.'
    : 'Tu reserva fue recibida correctamente. El importe abonado corresponde a la reserva/seña. Para conocer las opciones y condiciones para completar el pago del viaje, comunicate con nosotros por email.'
  doc.text(doc.splitTextToSize(message, w - 46), 23, 244)
  return Buffer.from(doc.output('arraybuffer'))
}

export const generateDepositConfirmationPDF = generateBookingPDF
export const generateFullPaymentConfirmationPDF = generateBookingPDF
