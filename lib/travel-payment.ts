export type TravelPaymentState = 'RESERVA_RECIBIDA' | 'PAID' | 'PAGO_PENDIENTE'

export type PayableTravelBooking = {
  balance_due?: number | null
  payment_status?: string | null
  reservation_status?: string | null
  travel_experiences?: { reservation_deadline?: string | null; departure_date?: string | null } | null
}

export function roundMoney(value: number) {
  return Math.max(0, Math.round((Number(value) || 0) * 100) / 100)
}

export function getTravelPaymentState(booking: Pick<PayableTravelBooking, 'balance_due' | 'payment_status'>): TravelPaymentState {
  if (roundMoney(Number(booking.balance_due)) === 0 && booking.payment_status === 'paid') return 'PAID'
  if (booking.payment_status === 'deposit_paid' || roundMoney(Number(booking.balance_due)) > 0) return 'RESERVA_RECIBIDA'
  return 'PAGO_PENDIENTE'
}

/** The single policy used by API routes and UI to decide whether online balance payment is allowed. */
export function canPayRemainingBalance(booking: PayableTravelBooking, now = new Date()): boolean {
  if (booking.reservation_status === 'cancelled' || roundMoney(Number(booking.balance_due)) <= 0) return false
  const travel = booking.travel_experiences
  const cutoff = travel?.reservation_deadline || travel?.departure_date
  if (!cutoff) return true
  // Date-only values expire at the end of their calendar day in Argentina/local time.
  const deadline = new Date(`${cutoff}T23:59:59`)
  return !Number.isNaN(deadline.getTime()) && now <= deadline
}
