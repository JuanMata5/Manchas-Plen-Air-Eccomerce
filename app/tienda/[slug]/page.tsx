import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AddToCartSection } from '@/components/add-to-cart-section'
import TravelExperienceCart from '@/components/travel-experience-cart'
import { formatARS } from '@/lib/format'
import { getProductAvailabilityBadge } from '@/lib/product-badges'
import { Badge } from '@/components/ui/badge'
import type { Product, TravelExperience } from '@/lib/types'
import type { Metadata } from 'next'

interface PageProps {
  params: { slug: string }
}

async function getAllProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, categories(id, name, slug, description)')
    .eq('is_active', true)
  return data ?? []
}

async function getProduct(slug: string): Promise<Product | null> {
  noStore()
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, categories(id, name, slug, description)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data ?? null
}

async function getTravelExperience(slug: string): Promise<TravelExperience | null> {
  noStore()
  const supabase = await createClient()
  const { data } = await supabase
    .from('travel_experiences')
    .select('*')
    .eq('id', slug)
    .eq('is_active', true)
    .single()
  return data ?? null
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getAllProductsForStatic(): Promise<{ slug: string }[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/products?is_active=eq.true&select=slug`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    next: { revalidate: 60 }, // ISR opcional
  })
  if (!res.ok) return []
  return await res.json()
}

export async function generateStaticParams() {
  const products = await getAllProductsForStatic()
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProduct(params.slug)
  const experience = product ? null : await getTravelExperience(params.slug)
  
  if (!product && !experience) return { title: 'Producto no encontrado' }
  
  const title = product?.name || experience?.title || 'Producto'
  const description = product?.description || experience?.description || title
  
  return {
    title,
    description,
  }
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProduct(params.slug)
  const experience = product ? null : await getTravelExperience(params.slug)
  
  if (!product && !experience) notFound()

  if (experience) {
    // Render experience
    return (
      <>
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/tienda" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              Tienda
            </Link>
            <span>/</span>
            <span className="text-foreground truncate">{experience.title}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            {/* Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              {experience.image_url ? (
                <Image
                  src={experience.image_url}
                  alt={experience.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400" />
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col gap-5">
              <span className="text-sm text-muted-foreground uppercase tracking-wider">
                Experiencia Premium
              </span>

              <h1 className="font-serif font-bold text-3xl md:text-4xl text-foreground leading-tight">
                {experience.title}
              </h1>

              <Badge className="bg-blue-600 text-white border-0 w-fit">
                En stock
              </Badge>

              {/* Location & Dates */}
              <div className="text-muted-foreground space-y-2">
                <p>📍 {experience.location}</p>
                <p>📅 {experience.dates}</p>
                <p>👥 {experience.capacity} cupos disponibles</p>
              </div>

              <p className="text-foreground leading-relaxed">
                {experience.description}
              </p>

              {/* Plan Selection */}
              <TravelExperienceCart experience={experience} />
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Render normal product
  const isSoldOut = product!.stock <= 0
  const stockBadge = getProductAvailabilityBadge(product!)
  const usesDynamicStockBadge = !!stockBadge && /^Última/i.test(stockBadge)

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/tienda" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Tienda
          </Link>
          {product!.categories && (
            <>
              <span>/</span>
              <Link
                href={`/tienda?categoria=${product!.categories.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {product!.categories.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground truncate max-w-50">{product!.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            {product!.image_url ? (
              <Image
                src={product!.image_url}
                alt={product!.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground text-6xl font-serif">PA</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-5">
            {product!.categories && (
              <Link
                href={`/tienda?categoria=${product!.categories.slug}`}
                className="text-sm text-muted-foreground uppercase tracking-wider hover:text-primary transition-colors w-fit"
              >
                {product!.categories.name}
              </Link>
            )}

            <h1 className="font-serif font-bold text-3xl md:text-4xl text-foreground leading-tight text-balance">
              {product!.name}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product!.is_featured && (
                <Badge className="bg-brand-earth text-white border-0">Destacado</Badge>
              )}
              {isSoldOut && <Badge variant="secondary">Agotado</Badge>}
              {!isSoldOut && stockBadge && (
                <Badge className={usesDynamicStockBadge ? 'bg-amber-500 text-white border-0' : 'bg-primary text-white border-0'}>
                  {stockBadge}
                </Badge>
              )}
            </div>

            {/* Price */}
            <div>
              <span className="text-2xl font-bold text-foreground">{formatARS(product!.price_ars)}</span>
            </div>

            {/* Add to cart */}
            <AddToCartSection product={product!} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
