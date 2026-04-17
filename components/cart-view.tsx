'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'
import { formatARS } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import type { CartItem } from '@/lib/types'

// Type guards
function isExperienceItem(item: CartItem) {
  return item.type === 'experience'
}

function isProductItem(item: CartItem) {
  return 'product' in item && item.product !== undefined
}

export function CartView() {
  const { items, removeItem, updateQuantity, totalARS, totalUSD } = useCartStore()
  console.log('[CartView] items:', items)

  if (items.length === 0) {
    console.log('[CartView] Carrito vacío')
    return (
      <Empty
        title="Tu carrito esta vacio"
        description="Agrega productos desde la tienda para continuar."
        action={
          <Button asChild>
            <Link href="/tienda">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Ir a la tienda
            </Link>
          </Button>
        }
      />
    )
  }

  items.forEach((item) => {
    if (isProductItem(item)) {
      console.log('[CartView] Render product item:', item.product.name, 'qty:', item.quantity)
    } else if (isExperienceItem(item)) {
      console.log('[CartView] Render experience item:', item.name, 'qty:', item.quantity)
    }
  })

  const invalidTrevelinItems = items.filter(
    (item) =>
      isExperienceItem(item) &&
      (item.metadata.location.toLowerCase().includes('trevelin') || item.name.toLowerCase().includes('trevelin')) &&
      item.price_ars_blue < 500000,
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Items list */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {items.map((item) => {
          if (isProductItem(item)) {
            const { product, quantity } = item
            return (
              <div
                key={product.id}
                className="flex gap-4 p-4 bg-card rounded-xl border border-border"
              >
                {/* Image */}
                <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-serif">
                      PA
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <p className="font-semibold text-foreground text-sm leading-snug">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{formatARS(product.price_ars)} c/u</p>
                  <div className="flex items-center gap-2 mt-auto">
                    {/* Qty control */}
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => {
                          console.log('[CartView] Disminuir', product.name, 'qty:', quantity)
                          updateQuantity(product.id, quantity - 1, 'product')
                        }}
                        disabled={quantity <= 1}
                        className="h-7 w-7 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                        aria-label="Disminuir"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-medium tabular-nums">{quantity}</span>
                      <button
                        onClick={() => {
                          console.log('[CartView] Aumentar', product.name, 'qty:', quantity)
                          updateQuantity(product.id, quantity + 1, 'product')
                        }}
                        disabled={quantity >= product.max_per_order || quantity >= product.stock}
                        className="h-7 w-7 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
                        aria-label="Aumentar"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        console.log('[CartView] Eliminar', product.name)
                        removeItem(product.id, 'product')
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-1"
                      aria-label="Eliminar del carrito"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="shrink-0 text-right">
                  <p className="font-bold text-foreground">
                    {formatARS(product.price_ars * quantity)}
                  </p>
                </div>
              </div>
            )
          } else if (isExperienceItem(item)) {
            // Experience item - no quantity controls
            return (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-card rounded-xl border border-border"
              >
                {/* Image */}
                <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xl font-serif">
                      EXP
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <p className="font-semibold text-foreground text-sm leading-snug">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Plan: {item.metadata.planName} • {item.metadata.location}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.price_ars_blue > 0 && `${formatARS(item.price_ars_blue)}`}
                    {item.price_ars_blue > 0 && item.price_usd > 0 && ' / '}
                    {item.price_usd > 0 && `USD ${item.price_usd.toFixed(2)}`}
                  </p>
                  <div className="flex items-center gap-2 mt-auto">
                    <button
                      onClick={() => {
                        console.log('[CartView] Eliminar experiencia', item.name)
                        removeItem(item.id, 'experience')
                      }}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Eliminar del carrito"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="shrink-0 text-right">
                  <p className="font-bold text-foreground text-sm">
                    {formatARS(item.price_ars_blue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    USD {item.price_usd.toFixed(2)}
                  </p>
                </div>
              </div>
            )
          }
        })}
      </div>

      {/* Order summary */}
      <div className="lg:col-span-1">
        <div className="bg-card rounded-xl border border-border p-6 sticky top-24 flex flex-col gap-4">
          <h2 className="font-serif font-semibold text-lg text-foreground">Resumen</h2>
          <Separator />
          <div className="flex flex-col gap-2">
            {items.map((item) => {
              if (isProductItem(item)) {
                const { product, quantity } = item
                return (
                  <div key={product.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-40">
                      {product.name} x{quantity}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatARS(product.price_ars * quantity)}
                    </span>
                  </div>
                )
              } else if (isExperienceItem(item)) {
                return (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate max-w-40">
                      {item.name} ({item.metadata.planName})
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatARS(item.price_ars_blue)}
                    </span>
                  </div>
                )
              }
            })}
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-foreground text-base">
            <span>Total ARS</span>
            <span className="tabular-nums">{formatARS(totalARS())}</span>
          </div>
          {totalUSD() > 0 && (
            <div className="flex justify-between text-foreground text-sm">
              <span>Total USD</span>
              <span className="tabular-nums">USD {totalUSD().toFixed(2)}</span>
            </div>
          )}
          {invalidTrevelinItems.length > 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Hay viajes a Trevelin en el carrito que deben reservarse desde $500.000 ARS. Ajusta el plan o elimina el viaje para continuar.
            </div>
          ) : (
            <Button asChild size="lg" className="w-full mt-2">
              <Link href="/checkout" onClick={() => {
                console.log('[CartView] Click en Continuar', items)
              }}>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Podes pagar con Mercado Pago o transferencia bancaria
          </p>
        </div>
      </div>
    </div>
  )
}
