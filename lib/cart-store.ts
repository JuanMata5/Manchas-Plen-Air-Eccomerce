'use client'

import { create } from 'zustand'
// Import persist and createJSONStorage directly from their module files
// This is the most robust way to avoid CJS/ESM module resolution issues in Next.js
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartItem, Product } from '@/lib/types'

// A dummy storage implementation that does nothing, used for server-side rendering.
const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalARS: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id)
          const maxQty = product.max_per_order
          if (existing) {
            const newQty = Math.min(existing.quantity + quantity, maxQty)
            return {
              items: state.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: newQty } : i,
              ),
            }
          }
          return {
            items: [...state.items, { product, quantity: Math.min(quantity, maxQty) }],
          }
        })
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId
              ? { ...i, quantity: Math.min(quantity, i.product.max_per_order) }
              : i,
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalARS: () =>
        get().items.reduce((sum, i) => sum + i.product.price_ars * i.quantity, 0),
    }),
    {
      name: 'plenair-cart',
      // Use createJSONStorage to handle serialization. Conditionally provide a storage engine.
      storage: createJSONStorage(() =>
        // If we are in a browser environment, use sessionStorage. Otherwise, use a dummy storage.
        typeof window !== 'undefined' ? sessionStorage : dummyStorage,
      ),
    },
  ),
)
