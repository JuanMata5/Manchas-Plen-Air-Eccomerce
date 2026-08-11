import type { Metadata } from 'next'
import { Lato, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { UserProvider } from '@/components/user-provider'
import { CartSessionManager } from '@/components/cart-session-manager' // 🔥 Importado
import { WhatsAppFloat } from '@/components/whatsapp-float'
import './globals.css'

const _lato = Lato({ subsets: ['latin'], weight: ['300', '400', '700', '900'] })
const _playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'] })

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://manchas-plen-air-eccomerce.vercel.app'

export const metadata: Metadata = {
  title: {
    default: 'Manchas Plen Air — Viajes y Experiencias',
    template: '%s | Manchas Plen Air',
  },
  description:
    'Comprá viajes y experiencias únicas para artistas en toda Argentina. Pago seguro con Mercado Pago y reserva rápida.',
  keywords: ['manchas plen air', 'viajes', 'experiencias', 'artistas', 'Argentina', 'merchandising'],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: 'Manchas Plen Air — Viajes y Experiencias',
    description: 'Comprá viajes y experiencias únicas para artistas en toda Argentina.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Manchas Plen Air',
    url: BASE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manchas Plen Air',
    description: 'Viajes y experiencias únicas para artistas en Argentina.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <UserProvider>
            <CartSessionManager /> {/* 🔥 Añadido el guardián */}
            {children}
            <WhatsAppFloat />
            <Toaster richColors position="top-right" />
          </UserProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
