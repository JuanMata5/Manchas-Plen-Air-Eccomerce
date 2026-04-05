import Image from 'next/image'
import { unstable_noStore as noStore } from 'next/cache'
import { notFound } from 'next/navigation'
import { AddToCartSection } from '@/components/add-to-cart-section'
import { Navbar } from '@/components/navbar'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { getProductAvailabilityBadge } from '@/lib/product-badges'
import type { Product } from '@/lib/types'

async function getProduct(slug: string): Promise<Product | null> {
  noStore()

  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  return data ?? null
}

export async function ProductPageView({ slug }: { slug: string }) {
  const product = await getProduct(slug)

  if (!product) notFound()

  const isSoldOut = product.stock <= 0
  const stockBadge = getProductAvailabilityBadge(product)
  const usesDynamicStockBadge = !!stockBadge && /^Última/i.test(stockBadge)

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="relative w-full md:w-1/2 aspect-square bg-muted rounded-lg overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-muted-foreground text-6xl font-serif">PA</span>
              </div>
            )}

            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {product.is_featured && (
                <Badge className="bg-brand-earth text-white text-xs border-0">Destacado</Badge>
              )}
              {isSoldOut && (
                <Badge variant="secondary" className="text-xs font-semibold">Agotado</Badge>
              )}
              {!isSoldOut && stockBadge && (
                <Badge
                  className={usesDynamicStockBadge
                    ? 'bg-amber-500 text-white text-xs font-semibold border-0'
                    : 'bg-primary text-white text-xs border-0'}
                >
                  {stockBadge}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {product.categories && (
              <span className="text-xs text-primary font-semibold uppercase tracking-wider">
                {product.categories.name}
              </span>
            )}

            {product.subtitle && (
              <p className="text-base text-primary font-semibold mb-1">{product.subtitle}</p>
            )}

            <h1 className="font-serif font-bold text-2xl md:text-3xl text-foreground leading-tight">
              {product.name}
            </h1>

            {product.description && (
              <p className="text-base text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            {product.features && Array.isArray(product.features) && product.features.length > 0 && (
              <ul className="mt-2 mb-2 list-disc pl-5 text-sm text-foreground">
                {product.features.map((feature, index) => (
                  <li key={`${product.slug}-feature-${index}`} className="mb-1">
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            {product.cta_link && (
              <a href={product.cta_link} target="_blank" rel="noopener" className="mt-2 inline-block">
                <Badge className="bg-brand-earth text-white border-0">Comprar en etickets</Badge>
              </a>
            )}

            <div className="mt-4">
              <AddToCartSection product={product} />
            </div>

            <div className="mt-8 border-t border-border pt-4 flex flex-col gap-2">
              <p className="font-bold text-2xl text-foreground">${product.price_ars} ARS</p>
              {product.price_usd && (
                <p className="text-xs text-muted-foreground">USD {product.price_usd} aprox.</p>
              )}
              <div className="flex gap-3 mt-2">
                <Badge className="bg-[#00B686] text-white border-0">Mercado Pago</Badge>
                <Badge className="bg-[#1A237E] text-white border-0">Transferencia</Badge>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
