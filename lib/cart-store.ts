'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import type { CartItem, Product } from '@/lib/types'

// Dummy storage para SSR
const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

export interface CartState {
  items: CartItem[]

  addItem: (product: Product, quantity?: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>

  totalItems: () => number
  totalARS: () => number

  loadCartFromDB: (user: User) => Promise<void>
  saveCartToDB: (user: User) => Promise<void>
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: async (product, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id)
          const maxQty = product.max_per_order

          if (existing) {
            const newQty = Math.min(existing.quantity + quantity, maxQty)
            return {
              items: state.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: newQty } : i
              ),
            }
          }

          return {
            items: [
              ...state.items,
              { product, quantity: Math.min(quantity, maxQty) },
            ],
          }
        })

        const user = await getCurrentUser()
        if (user) await get().saveCartToDB(user)
      },

      removeItem: async (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        }))

        const user = await getCurrentUser()
        if (user) await get().saveCartToDB(user)
      },

      updateQuantity: async (productId, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(productId)
          return
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId
              ? {
                  ...i,
                  quantity: Math.min(quantity, i.product.max_per_order),
                }
              : i
          ),
        }))

        const user = await getCurrentUser()
        if (user) await get().saveCartToDB(user)
      },

      clearCart: async () => {
        set({ items: [] })

        const user = await getCurrentUser()
        if (user) await get().saveCartToDB(user)
      },

      totalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalARS: () =>
        get().items.reduce(
          (sum, i) => sum + i.product.price_ars * i.quantity,
          0
        ),

      loadCartFromDB: async (user) => {
        const supabase = createClient()

        const { data } = await supabase
          .from('carts')
          .select('items')
          .eq('user_id', user.id)
          .single()

        if (data?.items) {
          set({ items: data.items })
        }
      },

      saveCartToDB: async (user) => {
        const supabase = createClient()
        const items = get().items

        await supabase.from('carts').upsert(
          {
            user_id: user.id,
            items,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
      },
    }),
    {
      name: 'plenair-cart',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : dummyStorage
      ),
    }
  )
)

// Obtener usuario actual
async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    return data.user ?? null
  } catch {
    return null
  }
}