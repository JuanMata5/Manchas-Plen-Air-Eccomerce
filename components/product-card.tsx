'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { Product } from '@/lib/types'
import { formatARS } from '@/lib/format'
import { getProductAvailabilityBadge } from '@/lib/product-badges'
import { Badge } from '@/components/ui/badge'
import { ProductModal } from '@/components/product-modal'
import { useCartStore } from '@/lib/cart-store'
import { useUser } from '@/components/user-provider'
import { useRouter } from 'next/navigation'

interface ProductCardProps {
  product: Product
  initiallyOpen?: boolean
}

const salonProductSlugs = new Set([
  'concurso-salon-categoria-1',
  'concurso-salon-categoria-2',
  'muestra-colectiva-invitada-salon-2026',
  'jornada-plein-air-san-martin-2026',
])

export function ProductCard({ product, initiallyOpen = false }: ProductCardProps) {
  const isSoldOut = product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock <= 10
  const stockBadge = getProductAvailabilityBadge(product)
  const usesDynamicStockBadge = !!stockBadge && /^Ãšltima/i.test(stockBadge)
  const addItem = useCartStore((s) => s.addItem)
  const [added, setAdded] = useState(false)
  const [modalOpen, setModalOpen] = useState(initiallyOpen)
  const { user } = useUser()
  const router = useRouter()
  const opensSalonModal = salonProductSlugs.has(product.slug)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.stock <= 0) return
    if (!user) {
      router.push('/auth/login')
      return
    }
    await addItem(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const cardContent = (
    <>
      <div className="relative aspect-4/3 bg-muted overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-5xl font-serif">PA</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {!isSoldOut && stockBadge ? (
            <Badge className={usesDynamicStockBadge ? 'bg-amber-500 text-white text-xs font-semibold border-0 animate-pulse' : 'bg-primary text-white text-xs border-0'}>
              {stockBadge}
            </Badge>
          ) : isLowStock && !isSoldOut ? (
            <Badge className="bg-amber-500 text-white text-xs font-semibold border-0 animate-pulse">
              ¡Poco stock!
            </Badge>
          ) : null}
          {isSoldOut && (
            <Badge variant="secondary" className="text-xs font-semibold">
              Agotado
            </Badge>
          )}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        {product.categories && (
          <span className="text-xs text-primary font-semibold uppercase tracking-wider">
            {product.categories.name}
          </span>
        )}
        <h2 className="font-serif font-bold text-lg text-foreground mt-2 mb-2 leading-snug text-balance group-hover:text-primary transition-colors">
          {product.name}
        </h2>
        <div className="mb-3">
          {product.subtitle && (
            <p className="text-sm text-muted-foreground font-medium mb-1">
              {product.subtitle}
            </p>
          )}
          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
          {product.features && product.features.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-0.5 mt-2">
              {product.features.slice(0, 2).map((feature, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="text-primary text-xs">•</span>
                  <span>{feature}</span>
                </li>
              ))}
              {product.features.length > 2 && (
                <li className="text-primary text-xs font-medium">
                  +{product.features.length - 2} más
                </li>
              )}
            </ul>
          )}
        </div>
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="font-serif font-bold text-xl text-foreground tabular-nums">
              {product.cta_link ? 'Gratis' : formatARS(product.price_ars)}
            </span>
          </div>
          {opensSalonModal ? (
            <span className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground">
              Ver información
            </span>
          ) : product.cta_link ? null : (
            <button
              onClick={handleAddToCart}
              disabled={isSoldOut}
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSoldOut ? 'Agotado' : added ? '¡Agregado!' : 'Agregar al carrito'}
            </button>
          )}
        </div>
      </div>
    </>
  )

  const cardClassName = 'group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full'

  return (
    <>
      {opensSalonModal ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`${cardClassName} w-full text-left`}
          aria-label={`Ver información de ${product.name}`}
        >
          {cardContent}
        </button>
      ) : (
        <Link href={`/products/${product.slug}`} className={cardClassName}>
          {cardContent}
        </Link>
      )}
      {opensSalonModal && (
        <ProductModal product={product} open={modalOpen} onOpenChange={setModalOpen} />
      )}
    </>
  )
}
