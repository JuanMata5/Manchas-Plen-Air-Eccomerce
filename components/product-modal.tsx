'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Minus, Plus, ShoppingCart, Check, Truck, Shield, Clock } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'
import { formatARS } from '@/lib/format'
import { useCartStore } from '@/lib/cart-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface ProductModalProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

const includesMap: Record<string, string[]> = {
  ticket: [
    'Acceso completo al evento durante toda la jornada',
    'Kit de bienvenida con programa del evento',
    'Acceso a todas las demostraciones en vivo',
    'Certificado digital de participacion',
  ],
  workshop: [
    'Materiales incluidos (lienzo, pinceles, pinturas)',
    'Guia personalizada del instructor',
    'Certificado de finalizacion del taller',
    'Acceso al grupo privado de alumnos',
  ],
  merchandise: [
    'Producto oficial Plen Air',
    'Material de alta calidad',
    'Diseno exclusivo de la convencion',
    'Empaque especial de regalo',
  ],
}

export function ProductModal({ product, open, onOpenChange }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const isSoldOut = product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock <= 5
  const max = Math.min(product.max_per_order, product.stock)
  const productType = product.product_type || 'merchandise'
  const includes = includesMap[productType] || includesMap.merchandise

  const handleAdd = () => {
    addItem(product, quantity)
    setAdded(true)
    toast.success(`${quantity}x ${product.name} agregado al carrito`)
    setTimeout(() => {
      setAdded(false)
      setQuantity(1)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative aspect-square bg-muted sm:rounded-l-lg overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 50vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground text-6xl font-serif">PA</span>
              </div>
            )}
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {product.is_featured && (
                <Badge className="bg-brand-earth text-white text-xs border-0">Destacado</Badge>
              )}
              {isSoldOut && <Badge variant="secondary" className="text-xs">Agotado</Badge>}
              {isLowStock && !isSoldOut && (
                <Badge className="bg-amber-500 text-white text-xs border-0">
                  Ultimas {product.stock} unidades
                </Badge>
              )}
              {product.badge && (
                <Badge className="bg-primary text-white text-xs border-0">{product.badge}</Badge>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-5 flex flex-col gap-4">
            <DialogHeader className="text-left">
              {product.categories && (
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  {product.categories.name}
                </span>
              )}
              {/* Subtitle */}
              {product.subtitle && (
                <p className="text-base text-primary font-semibold mb-1">{product.subtitle}</p>
              )}
              <DialogTitle className="font-serif font-bold text-xl leading-tight">
                {product.name}
              </DialogTitle>
              {product.description && (
                <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </DialogDescription>
              )}
            </DialogHeader>

            {/* Price */}
            <div>
              <p className="font-bold text-2xl text-foreground">{formatARS(product.price_ars)}</p>
              {product.price_usd && (
                <p className="text-xs text-muted-foreground">USD {product.price_usd} aprox.</p>
              )}
            </div>

            {/* Features */}
            {product.features && Array.isArray(product.features) && product.features.length > 0 && (
              <ul className="mt-2 mb-2 list-disc pl-5 text-sm text-foreground">
                {product.features.map((f: string, idx: number) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            )}

            {/* CTA Link */}
            {product.cta_link && (
              <a href={product.cta_link} target="_blank" rel="noopener" className="mt-2 inline-block">
                <Badge className="bg-brand-earth text-white border-0">Comprar en etickets</Badge>
              </a>
            )}

            {/* Includes (fallback) */}
            {!product.features && (
              <div className="border-t border-border pt-3">
                <p className="text-sm font-semibold text-foreground mb-2">Incluye:</p>
                <ul className="space-y-1.5">
                  {includes.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Info badges */}
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" /> Envio digital inmediato
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> Compra segura
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Soporte 24/7
              </span>
            </div>

            {/* Add to cart */}
            <div className="border-t border-border pt-3 mt-auto">
              {isSoldOut ? (
                <Button disabled size="lg" className="w-full">Agotado</Button>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Cantidad:</span>
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="h-8 w-8 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium tabular-nums">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(max, q + 1))}
                        disabled={quantity >= max}
                        className="h-8 w-8 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {product.stock} disponibles
                    </span>
                  </div>
                  <Button onClick={handleAdd} size="lg" className="w-full gap-2" disabled={added}>
                    {added ? (
                      <>
                        <Check className="h-5 w-5" />
                        Agregado
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5" />
                        Agregar al carrito
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
