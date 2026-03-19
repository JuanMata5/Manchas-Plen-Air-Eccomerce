import Link from 'next/link'
import {
  ArrowRight,
  Ticket,
  Package,
  Plane,
  MapPin,
  Calendar,
  Star,
  ChevronDown,
  Shield,
  Clock,
  CreditCard,
  Headphones,
  Gift,
  Sparkles,
  Heart,
  Palette,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { ContactSection } from '@/components/contact-section'
import { EventCountdown } from '@/components/event-countdown'
import { Reveal } from '@/components/reveal'
import type { Product } from '@/lib/types'

async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(6)
  return data ?? []
}

async function getAllProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(6)
  return data ?? []
}

const categories = [
  {
    icon: Ticket,
    title: 'Eventos',
    description: 'Entradas oficiales para convenciones, shows y actividades en vivo.',
    href: '/tienda?categoria=entradas',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    icon: Plane,
    title: 'Viajes artisticos',
    description: 'Salidas, encuentros y experiencias creativas en distintas locaciones.',
    href: '/tienda',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    icon: Package,
    title: 'Productos',
    description: 'Materiales, kits y productos oficiales seleccionados para artistas.',
    href: '/tienda?categoria=merchandising',
    color: 'bg-purple-500/10 text-purple-600',
  },
  {
    icon: Palette,
    title: 'Workshops',
    description: 'Talleres y clinicas con docentes invitados para todos los niveles.',
    href: '/tienda',
    color: 'bg-amber-500/10 text-amber-600',
  },
]

const benefits = [
  {
    icon: Shield,
    title: 'Compra segura',
    description: 'Tus datos estan protegidos. Pagos seguros con Mercado Pago o transferencia.',
  },
  {
    icon: Clock,
    title: 'Entrega inmediata',
    description: 'Recibis tus entradas y confirmaciones al instante en tu email.',
  },
  {
    icon: CreditCard,
    title: 'Formas de pago',
    description: 'Tarjeta de credito, debito, Mercado Pago o transferencia bancaria.',
  },
  {
    icon: Headphones,
    title: 'Soporte 24/7',
    description: 'Estamos para ayudarte antes, durante y despues de tu compra.',
  },
]

const testimonials = [
  {
    name: 'Lucia F.',
    location: 'Buenos Aires',
    text: 'Super facil comprar las entradas. Llegaron al instante al email y la entrada al show fue sin problemas.',
    event: 'Show en vivo',
  },
  {
    name: 'Martin R.',
    location: 'Cordoba',
    text: 'Compre un paquete de viaje para Bariloche y la experiencia fue increible. Todo muy organizado.',
    event: 'Viaje a Bariloche',
  },
  {
    name: 'Camila S.',
    location: 'Rosario',
    text: 'Los talleres de arte fueron lo mejor que hice este ano. Excelente atencion y organizacion.',
    event: 'Taller de arte',
  },
  {
    name: 'Diego A.',
    location: 'Mendoza',
    text: 'La atencion al cliente es de 10. Tuve un problema con mi entrada y lo resolvieron al toque.',
    event: 'Festival de musica',
  },
]

const faqs = [
  {
    q: 'Como recibo mis entradas?',
    a: 'Una vez confirmado el pago, recibis tus entradas por email de forma inmediata. Tambien las podes ver desde tu cuenta en "Mis ordenes".',
  },
  {
    q: 'Que metodos de pago aceptan?',
    a: 'Aceptamos Mercado Pago (tarjetas de credito, debito, dinero en cuenta) y transferencia bancaria. En tu primera compra tienes un 5% de descuento automático.',
  },
  {
    q: 'Cuales son los datos para pagar por transferencia?',
    a: 'Para pagar por transferencia, usa los siguientes datos y luego subí tu comprobante en el detalle de tu orden. Las ordenes sin pago se cancelan tras 48hs. <br/><br/><b>CUENTA EN PESOS (ARS)</b><br/>Nombre: Liliana Viviana Paola Nievas<br/>CUIT/CUIL: 27214734686<br/>ALIAS: VOLCAN.JAGUAR.CLIMA<br/>CBU: 0140009003400951112934<br/><br/><b>CUENTA EN DÓLARES (USD)</b><br/>Titular: Liliana Viviana Paola Nievas<br/>CUIT/CUIL: 27214734686<br/>Caja de ahorro en U$S: 000000020400017941<br/>ALIAS: TROTE.DAMA.FUENTE<br/><br/>Revisá tu carpeta de spam/promociones para ver los mails. Si tenés dudas o no recibís el mail, escribinos a <a href="mailto:mpadsas@gmail.com" class="underline">mpadsas@gmail.com</a>.',
  },
  {
    q: 'Puedo cancelar o pedir reembolso?',
    a: 'Si, podes solicitar un reembolso hasta 7 dias antes del evento. Contactanos y lo resolvemos.',
  },
  {
    q: 'Las entradas son transferibles?',
    a: 'Si, podes transferir tu entrada a otra persona. Contactanos con los datos del nuevo titular.',
  },
]

export default async function HomePage() {
  const featured = await getFeaturedProducts()
  const allProducts = await getAllProducts()
  const productsToShow = featured.length > 0 ? featured : allProducts

  return (
    <>
      <Navbar />
      <main>
        {/* ── 1. Hero Section ── */}
        <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center text-center text-white overflow-hidden">
          {/* -- Video de fondo -- */}
          {/* Reemplaza este src con la URL de tu video. El video debe estar en la carpeta /public/videos/ */}
          <video 
            src="/2c26b202-351c-4323-817e-1f033c78b3b8.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover z-0" 
          />
          {/* -- Overlay oscuro para legibilidad -- */}
          <div className="absolute inset-0 bg-black/50 z-10" />

          {/* -- Contenido de texto -- */}
          <div className="relative z-20 max-w-4xl mx-auto px-4 flex flex-col items-center gap-6">
            <h1 className="font-serif font-bold text-4xl sm:text-5xl md:text-6xl tracking-tight text-balance leading-tight">
              Manchas Eventos
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed text-balance">
              EVENTOS Y EXPERIENCIAS PREMIUM PARA ARTISTAS
            </p>
            <div className="mt-4">
              <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 font-semibold text-base px-8 shadow-lg">
                <Link href="/tienda?categoria=entradas">
                  Explorar Eventos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              return (
                <>
                  <Navbar />
                  <main>
                    {/* ── 1. Hero Section (solo desktop) ── */}
                    <section className="hidden md:flex relative w-full h-[60vh] min-h-[500px] items-center justify-center text-center text-white overflow-hidden">
                      {/* -- Video de fondo -- */}
                      <video 
                        src="/2c26b202-351c-4323-817e-1f033c78b3b8.mp4" 
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="absolute top-0 left-0 w-full h-full object-cover z-0" 
                      />
                      {/* -- Overlay oscuro para legibilidad -- */}
                      <div className="absolute inset-0 bg-black/50 z-10" />
                      {/* -- Contenido de texto -- */}
                      <div className="relative z-20 max-w-4xl mx-auto px-4 flex flex-col items-center gap-6">
                        <h1 className="font-serif font-bold text-4xl sm:text-5xl md:text-6xl tracking-tight text-balance leading-tight">
                          Manchas Eventos
                        </h1>
                        <p className="text-lg md:text-xl text-white/80 max-w-2xl leading-relaxed text-balance">
                          EVENTOS Y EXPERIENCIAS PREMIUM PARA ARTISTAS
                        </p>
                        <div className="mt-4">
                          <Button asChild size="lg" className="bg-white text-black hover:bg-white/90 font-semibold text-base px-8 shadow-lg">
                            <Link href="/tienda?categoria=entradas">
                              Explorar Eventos
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </section>
          <Reveal className="bg-linear-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="h-20 w-20 rounded-2xl bg-primary-foreground/10 flex items-center justify-center shrink-0">
              <Gift className="h-10 w-10" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-serif font-bold text-2xl md:text-3xl mb-2">¿Primera compra? 5% OFF</h3>
              <p className="text-primary-foreground/80">
                Registrate y obtene un 5% de descuento automatico en tu primera compra. Sin codigos, se aplica solo.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold shrink-0"
            >
              <Link href="/auth/register">
                Crear cuenta y recibir 5% OFF
              </Link>
            </Button>
          </Reveal>
        </section>

        {/* ── 4. Main Event ── */}
        <section id="evento" className="max-w-6xl mx-auto px-4 pb-16 md:pb-20 scroll-mt-20">
          <Reveal className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-background to-amber-500/10 p-6 md:p-10">
            <div className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-amber-500/20 blur-3xl" />
            <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
              <div className="lg:col-span-3">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-primary mb-3">
                  <Sparkles className="h-3.5 w-3.5" />
                  Evento destacado 2026
                </p>
                <h3 className="font-serif font-bold text-3xl md:text-5xl text-foreground leading-tight">
                  Convencion Plein Air Bs.As
                </h3>
                <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">
                  1° Convencion plein air en Bs.As + ARG y Expo talleres. Es un evento de primer nivel dedicado a la pintura al aire libre, del 1° al 3 de mayo en Av. Sarmiento 1875, C.O.M.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button asChild size="lg" className="font-semibold">
                    <Link href="/tienda?categoria=entradas">
                      Conseguir mis entradas
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="mt-6 space-y-2 text-base text-muted-foreground">
                  <div>
                    <b>Entradas generales:</b> <a href="mailto:mpadsas@gmail.com" className="underline">mpadsas@gmail.com</a> / <a href="tel:1139430021" className="underline">1139430021</a>
                  </div>
                  <div>
                    <b>Stands:</b> <a href="mailto:manchastribu70@gmail.com" className="underline">manchastribu70@gmail.com</a> / <a href="tel:1167546892" className="underline">1167546892</a>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2 space-y-3">
                <EventCountdown
                  targetIso="2026-05-01T12:00:00-03:00"
                  title="Cuenta regresiva al evento"
                />
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                  <p className="text-xs uppercase tracking-widest font-semibold text-amber-700 animate-pulse">
                    Cupos limitados
                  </p>
                  <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                    72% de capacidad reservada. ¡Reserva ahora y asegura tu lugar!
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
        
        {/* ── 5. Categories ── */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-20 bg-muted rounded-3xl">
          <div className="text-center mb-10">
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-foreground">Explora por Categoría</h2>
            <p className="text-muted-foreground mt-2">Encuentra exactamente lo que buscas.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((cat, index) => (
              <Reveal key={cat.title} delay={index * 90}>
                <Link
                  href={cat.href}
                  className="group relative overflow-hidden flex flex-col items-center text-center gap-3 p-7 rounded-2xl border border-border bg-card hover:-translate-y-1 hover:shadow-xl transition-all duration-300 hover-lift"
                >
                  <div className={`h-16 w-16 rounded-2xl ${cat.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                    <cat.icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-serif font-semibold text-foreground text-xl">{cat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 6. Trust Section (Benefits & Testimonials) ── */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <div className="text-center mb-12">
              <h2 className="font-serif font-bold text-3xl md:text-4xl text-foreground">
                Compra con total confianza
              </h2>
              <p className="text-muted-foreground mt-2">Miles de artistas ya nos eligieron.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {benefits.map((b, index) => (
                <Reveal key={b.title} delay={index * 80}>
                  <div className="bg-card rounded-xl border border-border p-6 flex flex-col items-center text-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <b.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{b.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t, index) => (
              <Reveal key={t.name} delay={index * 80}>
                <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4 h-full">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                  <div className="pt-3 border-t border-border">
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.location}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 7. Final CTA ── */}
        <section className="bg-primary text-primary-foreground">
          <div className="max-w-3xl mx-auto px-4 py-20 md:py-28 text-center flex flex-col items-center gap-6">
            <h2 className="font-serif font-bold text-3xl md:text-5xl text-balance">
              Tu próxima experiencia artística te espera
            </h2>
            <p className="text-primary-foreground/80 leading-relaxed text-lg max-w-xl">
              No te quedes afuera. Únete a miles de artistas que ya vivieron la experiencia.
            </p>
            <div className="mt-2">
              <Button
                asChild
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold text-base px-8"
              >
                <Link href="/tienda">
                  Explorar todo el catálogo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* ── 8. FAQ ── */}
        <section className="bg-muted">
          <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
            <div className="text-center mb-12">
              <h2 className="font-serif font-bold text-3xl md:text-4xl text-foreground">
                Preguntas Frecuentes
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq, index) => (
                <Reveal key={faq.q} delay={index * 60}>
                  <details className="group bg-card border border-border rounded-xl overflow-hidden">
                    <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <span className="font-medium text-foreground text-sm pr-4">{faq.q}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-5 pb-5 -mt-1">
                      <p className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: faq.a }} />
                    </div>
                  </details>
                </Reveal>
              ))}\
            </div>
          </div>
        </section>

        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
