import type { Metadata } from 'next'
import { Lato, Playfair_Display, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _lato = Lato({ subsets: ['latin'], weight: ['300', '400', '700', '900'] })
const _playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Plen Air — Convención de Pintura al Aire Libre',
  description:
    'Comprá tus entradas y merchandising para Plen Air, la convención argentina de pintura al aire libre. Plein air painting en Argentina.',
  keywords: ['plen air', 'plein air', 'pintura', 'convención', 'arte', 'Argentina', 'entradas'],
  openGraph: {
    title: 'Plen Air — Convención de Pintura al Aire Libre',
    description: 'Comprá tus entradas y productos para Plen Air.',
    type: 'website',
    locale: 'es_AR',
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
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
