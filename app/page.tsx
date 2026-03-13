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
  TrendingUp,
  Heart,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { ContactSection } from '@/components/contact-section'
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
    title: 'Entradas',
    description: 'Eventos, shows, convenciones y espectaculos en todo el pais.',
    href: '/tienda?categoria=entradas',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    icon: Plane,
    title: 'Viajes',
    description: 'Paquetes de viaje, excursiones y escapadas para todos los gustos.',
    href: '/tienda?categoria=viajes',
    color: 'bg-emerald-500/10 text-emerald-600',
  },
  {
    icon: Package,
    title: 'Merchandising',
    description: 'Productos exclusivos, remeras, accesorios y mas.',
    href: '/tienda?categoria=merchandising',
    color: 'bg-purple-500/10 text-purple-600',
  },
  {
    icon: MapPin,
    title: 'Experiencias',
    description: 'Talleres, cursos, degustaciones y actividades unicas.',
    href: '/tienda?categoria=experiencias',
    color: 'bg-amber-500/10 text-amber-600',
  },
]

const stats = [
  { value: '10K+', label: 'Clientes' },
  { value: '500+', label: 'Eventos' },
  { value: '50+', label: 'Ciudades' },
  { value: '4.9', label: 'Calificacion', icon: Star },
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

const howItWorks = [
  {
    step: '01',
    title: 'Elegí',
    description: 'Navega por nuestro catalogo de entradas, viajes y experiencias.',
  },
  {
    step: '02',
    title: 'Compra',
    description: 'Paga de forma segura con Mercado Pago o transferencia bancaria.',
  },
  {
    step: '03',
    title: 'Recibí',
    description: 'Tus entradas y confirmaciones llegan al instante a tu email.',
  },
  {
    step: '04',
    title: 'Disfruta',
    description: 'Presenta tu entrada y vivi la experiencia. Asi de simple.',
  },
]

const faqs = [
  {
    q: 'Como recibo mis entradas?',
    a: 'Una vez confirmado el pago, recibis tus entradas por email de forma inmediata. Tambien las podes ver desde tu cuenta en "Mis ordenes".',
  },
  {
    q: 'Que metodos de pago aceptan?',
    a: 'Aceptamos Mercado Pago (tarjetas de credito, debito, dinero en cuenta) y transferencia bancaria. En tu primera compra tenes un 5% de descuento automatico.',
  },
  {
    q: 'Puedo cancelar o pedir reembolso?',
    a: 'Si, podes solicitar un reembolso hasta 7 dias antes del evento. Contactanos y lo resolvemos.',
  },
  {
    q: 'Las entradas son transferibles?',
    a: 'Si, podes transferir tu entrada a otra persona. Contactanos con los datos del nuevo titular.',
  },
  {
    q: 'Que pasa si el evento se cancela?',
    a: 'Si un evento se cancela, recibis un reembolso completo automaticamente dentro de los 5 dias habiles.',
  },
  {
    q: 'Tienen descuentos para grupos?',
    a: 'Si! Escribinos para consultar por descuentos en compras grupales o corporativas.',
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
        {/* ── Hero ── */}
        <section className="relative bg-primary text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_70%)]" />
          <div className="relative z-10 max-w-6xl mx-auto px-4 py-24 md:py-36 flex flex-col items-center text-center gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 text-xs uppercase tracking-widest text-primary-foreground/70 font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              5% off en tu primera compra
            </div>
            <h1 className="font-serif font-bold text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tight text-balance leading-[1.1]">
              Manchas Plen Air
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl leading-relaxed text-balance">
              Entradas, viajes y experiencias unicas en toda Argentina.
              Compra segura, entrega inmediata.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <Button
                asChild
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold text-base px-8"
              >
                <Link href="/tienda">
                  Explorar catalogo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8"
              >
                <Link href="#como-funciona">Como funciona</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 mt-10 pt-8 border-t border-primary-foreground/10 w-full max-w-xl">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <span className="font-serif font-bold text-3xl md:text-4xl">{s.value}</span>
                  <span className="text-xs uppercase tracking-wider text-primary-foreground/60">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-background z-10" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
        </section>

        {/* ── Categories ── */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-10">
            <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-2">Categorias</p>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-foreground">Que estas buscando?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((cat) => (
              <Link
                key={cat.title}
                href={cat.href}
                className="group flex flex-col items-center text-center gap-3 p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className={`h-14 w-14 rounded-2xl ${cat.color} flex items-center justify-center`}>
                  <cat.icon className="h-7 w-7" />
                </div>
                <h3 className="font-serif font-semibold text-foreground text-lg">{cat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
                <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Ver productos <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="como-funciona" className="bg-muted scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <div className="text-center mb-12">
              <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-2">Simple</p>
              <h2 className="font-serif font-bold text-3xl md:text-4xl text-foreground">Como funciona</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {howItWorks.map((step, i) => (
                <div key={step.step} className="relative flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-xl">
                    {step.step}
                  </div>
                  {i < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-border" />
                  )}
                  <h3 className="font-serif font-semibold text-foreground text-lg">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured Products ── */}
        {productsToShow.length > 0 && (
          <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-2">
                  <TrendingUp className="h-3.5 w-3.5 inline mr-1" />
                  Popular
                </p>
                <h2 className="font-serif font-bold text-3xl md:text-4xl text-foreground">
                  Lo mas buscado
                </h2>
              </div>
              <Button asChild variant="ghost" className="text-primary hover:text-primary hidden sm:flex">
                <Link href="/tienda">
                  Ver todo
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsToShow.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Button asChild variant="outline">
                <Link href="/tienda">
                  Ver todos los productos
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        )}

        {/* ── Benefits ── */}
        <section className="bg-muted">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <div className="text-center mb-12">
              <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-2">Por que elegirnos</p>
              <h2 className="font-serif font-bold text-3xl md:text-4xl text-foreground">
                Compra con tranquilidad
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((b) => (
                <div key={b.title} className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <b.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-2">
              <Heart className="h-3.5 w-3.5 inline mr-1" />
              Testimonios
            </p>
            <h2 className="font-serif font-bold text-3xl md:text-4xl text-foreground">
              Lo que dicen nuestros clientes
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card rounded-xl border border-border p-5 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.location}</p>
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{t.event}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Promo banner ── */}
        <section className="max-w-6xl mx-auto px-4 pb-16 md:pb-20">
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="h-20 w-20 rounded-2xl bg-primary-foreground/10 flex items-center justify-center shrink-0">
              <Gift className="h-10 w-10" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-serif font-bold text-2xl md:text-3xl mb-2">Primera compra? 5% OFF</h3>
              <p className="text-primary-foreground/80">
                Registrate y obtene un 5% de descuento automatico en tu primera compra. Sin codigos, se aplica solo.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold shrink-0"
            >
              <Link href="/auth/registro">
                Crear cuenta gratis
              </Link>
            </Button>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-muted">
          <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
            <div className="text-center mb-12">
              <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-2">FAQ</p>
              <h2 className="font-serif font-bold text-3xl md:text-4xl text-foreground">
                Preguntas frecuentes
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="group bg-card border border-border rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="font-medium text-foreground text-sm pr-4">{faq.q}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Contact ── */}
        <ContactSection />

        {/* ── CTA Final ── */}
        <section className="relative bg-primary text-primary-foreground overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.08),transparent_70%)]" />
          <div className="relative z-10 max-w-3xl mx-auto px-4 py-20 md:py-28 text-center flex flex-col items-center gap-6">
            <h2 className="font-serif font-bold text-3xl md:text-5xl text-balance">
              Tu proxima experiencia te espera
            </h2>
            <p className="text-primary-foreground/80 leading-relaxed text-lg max-w-xl">
              Miles de personas ya compraron sus entradas y vivieron experiencias increibles.
              Es tu turno.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Button
                asChild
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold text-base px-8"
              >
                <Link href="/tienda">
                  Explorar catalogo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8"
              >
                <Link href="/auth/registro">Crear cuenta gratis</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
