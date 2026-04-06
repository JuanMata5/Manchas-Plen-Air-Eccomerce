export const SUPPORT_WHATSAPP_NUMBER = '5491167546892'
export const SUPPORT_WHATSAPP_DISPLAY = '11 6754-6892'

export function createWhatsAppLink(message: string) {
  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
