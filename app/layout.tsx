import type { Metadata } from 'next'
import { Lato, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _lato = Lato({ subsets: ['latin'], weight: ['300', '400', '700', '900'] })
const _playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'] })

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://manchas-plen-air-eccomerce.vercel.app'

export const metadata: Metadata = {
  title: {
    default: 'Manchas Plen Air — Entradas, Viajes y Experiencias',
    template: '%s | Manchas Plen Air',
  },
  description:
    'Comprá entradas, viajes y experiencias únicas en toda Argentina. Pago seguro con Mercado Pago, entrega inmediata por email.',
  keywords: ['manchas plen air', 'entradas', 'tickets', 'viajes', 'experiencias', 'eventos', 'Argentina', 'merchandising'],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: 'Manchas Plen Air — Entradas, Viajes y Experiencias',
    description: 'Comprá entradas, viajes y experiencias únicas en toda Argentina.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Manchas Plen Air',
    url: BASE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Manchas Plen Air',
    description: 'Entradas, viajes y experiencias únicas en Argentina.',
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
      <body className="font-sans antialiased bg-background text-foreground page-enter">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
