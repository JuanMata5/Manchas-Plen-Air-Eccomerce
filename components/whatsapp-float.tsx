import { MessageCircle } from 'lucide-react'
import { createWhatsAppLink } from '@/lib/contact'

export function WhatsAppFloat() {
  const whatsappUrl = createWhatsAppLink('Hola, quiero hacer una consulta sobre Manchas Plen Air.')

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg transition-all hover:scale-105 hover:bg-[#1ea952] md:bottom-6 md:right-6"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline font-medium">WhatsApp</span>
    </a>
  )
}
