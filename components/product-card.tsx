'use client'

import Image from 'next/image'
import { ShoppingCart, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'
import { formatARS } from '@/lib/format'
import { useCartStore } from '@/lib/cart-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductModal } from '@/components/product-modal'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const [added, setAdded] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (product.stock <= 0) return
    addItem(product, 1)
    setAdded(true)
    toast.success(`${product.name} agregado al carrito`)
    setTimeout(() => setAdded(false), 2000)
  }

  const isSoldOut = product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock <= 5

  return (
    <>
      <article
        onClick={() => setModalOpen(true)}
        className="cursor-pointer group bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col h-full hover-lift surface-sheen"
      >
        {/* Image */}
        <div className="relative aspect-4/3 bg-muted overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground text-4xl font-serif">PA</span>
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_featured && (
              <Badge className="bg-brand-earth text-white text-xs border-0">
                Destacado
              </Badge>
            )}
            {isSoldOut && (
              <Badge variant="secondary" className="text-xs">
                Agotado
              </Badge>
            )}
            {isLowStock && !isSoldOut && (
              <Badge className="bg-amber-500 text-white text-xs border-0">
                Ultimas unidades
              </Badge>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col flex-1 gap-3">
          {product.categories && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {product.categories.name}
            </span>
          )}
          <h2 className="font-serif font-semibold text-foreground text-base leading-snug text-balance group-hover:text-primary transition-colors">
            {product.name}
          </h2>
          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
              {product.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
            <div>
              <p className="font-bold text-foreground text-lg">{formatARS(product.price_ars)}</p>
              {product.price_usd && (
                <p className="text-xs text-muted-foreground">USD {product.price_usd}</p>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={isSoldOut || added}
              className="gap-1.5"
              aria-label={`Agregar ${product.name} al carrito`}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" />
                  Agregado
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  {isSoldOut ? 'Agotado' : 'Agregar'}
                </>
              )}
            </Button>
          </div>
        </div>
      </article>

      <ProductModal product={product} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
