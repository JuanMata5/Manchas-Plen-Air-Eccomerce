'use client'

import { useState } from 'react'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'
import { useCartStore } from '@/lib/cart-store'
import { useUser } from '@/components/user-provider'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface AddToCartSectionProps {
  product: Product
}

  const [quantity, setQuantity] = useState(1)
  const addItem = useCartStore((s) => s.addItem)
  const { user } = useUser()
  const router = useRouter()

  const isSoldOut = product.stock <= 0
  const max = Math.min(product.max_per_order, product.stock)

  const decrement = () => setQuantity((q) => Math.max(1, q - 1))
  const increment = () => setQuantity((q) => Math.min(max, q + 1))

  const handleAdd = () => {
    if (!user) {
      toast.error('Debes iniciar sesión para agregar productos al carrito')
      router.push('/auth/login')
      return
    }
    addItem(product, quantity)
    toast.success(`${quantity}x ${product.name} agregado al carrito`)
  }

  if (isSoldOut) {
    return (
      <Button disabled size="lg" className="w-full">
        Agotado
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Cantidad:</span>
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            onClick={decrement}
            disabled={quantity <= 1}
            className="h-9 w-9 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
            aria-label="Disminuir cantidad"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-medium tabular-nums">{quantity}</span>
          <button
            onClick={increment}
            disabled={quantity >= max}
            className="h-9 w-9 flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
            aria-label="Aumentar cantidad"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Button onClick={handleAdd} size="lg" className="w-full gap-2">
        <ShoppingCart className="h-5 w-5" />
        Agregar al carrito
      </Button>
    </div>
  )
}
