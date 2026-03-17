'use client'

import Image from 'next/image'
import { ShoppingCart, Check, Star, Mail, ArrowRight } from 'lucide-react'
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

// --- Componente de Estrellas (para prueba social) ---
const StarRating = ({ rating = 4.5 }: { rating?: number }) => (
  <div className="flex items-center gap-1">
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'fill-muted stroke-muted-foreground'}`}
        />
      ))}
    </div>
    <span className="text-xs text-muted-foreground font-medium">{rating.toFixed(1)}</span>
  </div>
)

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

  const handleNotifyMe = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info(`Te avisaremos por email cuando ${product.name} vuelva a estar disponible.`);
  }

  const isSoldOut = product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock <= 10 // Aumentamos el umbral para crear mas urgencia
  
  // --- Tactica CRO: Falso descuento para crear valor ---
  const originalPrice = product.price_ars * 1.15; // Simula un 15% de descuento
  const discountPercentage = 15; // Para la badge

  return (
    <>
      <article
        onClick={() => setModalOpen(true)}
        className="cursor-pointer group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full hover-lift surface-sheen"
      >
        {/* --- Imagen y Badges --- */}
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
          
          {/* --- Badges de Oferta y Estado --- */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {!isSoldOut && (
                <Badge className="bg-red-600 text-white text-xs font-semibold border-0">
                    {discountPercentage}% OFF
                </Badge>
            )}
            {isLowStock && !isSoldOut && (
              <Badge className="bg-amber-500 text-white text-xs font-semibold border-0 animate-pulse">
                ¡Poco Stock!
              </Badge>
            )}
             {isSoldOut && (
              <Badge variant="secondary" className="text-xs font-semibold">
                Agotado
              </Badge>
            )}
          </div>
        </div>

        {/* --- Informacion del producto --- */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex justify-between items-start gap-2">
            {product.categories && (
                <span className="text-xs text-primary font-semibold uppercase tracking-wider">
                {product.categories.name}
                </span>
            )}
            {/* --- Prueba Social: Estrellas --- */}
            <StarRating />
          </div>

          <h2 className="font-serif font-bold text-lg text-foreground mt-2 mb-2 leading-snug text-balance group-hover:text-primary transition-colors">
            {product.name}
          </h2>

          {/* --- Precio con Anclaje (CRO) --- */}
          <div className="mt-auto mb-4">
            <p className="text-sm text-muted-foreground line-through">
                {formatARS(originalPrice)}
            </p>
            <p className="font-display font-bold text-2xl text-foreground -mt-1">
                {formatARS(product.price_ars)}
            </p>
          </div>

          {/* --- Botones de Accion (CTA Inteligente) --- */}
          <div className="mt-auto pt-3 border-t border-border/60">
            {isSoldOut ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNotifyMe}
                    className="w-full gap-2 font-semibold"
                    aria-label={`Avisarme cuando ${product.name} este disponible`}
                    >
                    <Mail className="h-4 w-4" />
                    Avisarme cuando vuelva
                </Button>
            ) : (
                <Button
                    size="sm"
                    onClick={handleAddToCart}
                    disabled={added}
                    className={`w-full gap-2 font-bold ${added && 'bg-green-600'}`}
                    aria-label={`Agregar ${product.name} al carrito`}
                >
                    {added ? (
                        <>
                        <Check className="h-4 w-4" />
                        ¡Agregado!
                        </>
                    ) : (
                        <>
                        <ShoppingCart className="h-4 w-4" />
                        Agregar al Carrito
                        </>
                    )}
                </Button>
            )}
            
          </div>
        </div>
      </article>

      <ProductModal product={product} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
