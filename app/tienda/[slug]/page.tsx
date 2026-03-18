import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { AddToCartSection } from '@/components/add-to-cart-section'
import { formatARS } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/lib/types'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, categories(id, name, slug, description)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  return data ?? null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Producto no encontrado' }
  return {
    title: product.name,
    description: product.description || `${product.name} — Disponible en Manchas Plen Air`,
    openGraph: {
      title: product.name,
      description: product.description || `${product.name} — Manchas Plen Air`,
      type: 'website',
      ...(product.image_url && { images: [{ url: product.image_url, width: 1200, height: 630, alt: product.name }] }),
    },
  }
}

function ProductJsonLd({ product }: { product: Product }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://manchas-plen-air-eccomerce.vercel.app'
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': product.product_type === 'ticket' ? 'Event' : 'Product',
    name: product.name,
    description: product.description || product.name,
    url: `${baseUrl}/tienda/${product.slug}`,
    ...(product.image_url && { image: product.image_url }),
  }

  if (product.product_type === 'ticket') {
    jsonLd.eventStatus = 'https://schema.org/EventScheduled'
    jsonLd.eventAttendanceMode = 'https://schema.org/OfflineEventAttendanceMode'
    if (product.event_date) jsonLd.startDate = product.event_date
    if (product.event_location) {
      jsonLd.location = { '@type': 'Place', name: product.event_location }
    }
    jsonLd.offers = {
      '@type': 'Offer',
      price: product.price_ars,
      priceCurrency: 'ARS',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      url: `${baseUrl}/tienda/${product.slug}`,
    }
    jsonLd.organizer = { '@type': 'Organization', name: 'Manchas Plen Air' }
  } else {
    jsonLd.offers = {
      '@type': 'Offer',
      price: product.price_ars,
      priceCurrency: 'ARS',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      url: `${baseUrl}/tienda/${product.slug}`,
    }
    jsonLd.brand = { '@type': 'Brand', name: 'Manchas Plen Air' }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const isSoldOut = product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock <= 5

  return (
    <>
      <ProductJsonLd product={product} />
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/tienda" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" />
            Tienda
          </Link>
          {product.categories && (
            <>
              <span>/</span>
              <Link
                href={`/tienda?categoria=${product.categories.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {product.categories.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
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
            {product.categories && (
              <Link
                href={`/tienda?categoria=${product.categories.slug}`}
                className="text-sm text-muted-foreground uppercase tracking-wider hover:text-primary transition-colors w-fit"
              >
                {product.categories.name}
              </Link>
            )}

            {/* Subtitle */}
            {product.subtitle && (
              <p className="text-lg text-primary font-semibold mb-2">{product.subtitle}</p>
            )}

            <h1 className="font-serif font-bold text-3xl md:text-4xl text-foreground leading-tight text-balance">
              {product.name}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.is_featured && (
                <Badge className="bg-brand-earth text-white border-0">Destacado</Badge>
              )}
              {isSoldOut && <Badge variant="secondary">Agotado</Badge>}
              {isLowStock && (
                <Badge className="bg-amber-500 text-white border-0">
                  Solo {product.stock} disponibles
                </Badge>
              )}
              {product.badge && (
                <Badge className="bg-primary text-white border-0">{product.badge}</Badge>
              )}
            </div>

            {/* Price */}
            <div>
              <p className="font-bold text-3xl text-foreground">{formatARS(product.price_ars)}</p>
              {product.price_usd && (
                <p className="text-sm text-muted-foreground mt-1">USD {product.price_usd} aprox.</p>
              )}
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {/* Features */}
            {product.features && Array.isArray(product.features) && product.features.length > 0 && (
              <ul className="mt-4 mb-4 list-disc pl-5 text-sm text-foreground">
                {product.features.map((f: string, idx: number) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            )}

            {/* CTA Link */}
            {product.cta_link && (
              <Link href={product.cta_link} target="_blank" rel="noopener" className="mt-2 inline-block">
                <Badge className="bg-brand-earth text-white border-0">Comprar en etickets</Badge>
              </Link>
            )}

            <div className="border-t border-border pt-5">
              <AddToCartSection product={product} />
            </div>

            <div className="text-xs text-muted-foreground flex flex-col gap-1">
              {product.stock > 0 && (
                <span>{product.stock} unidades disponibles</span>
              )}
              <span>Maximo {product.max_per_order} por orden</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
