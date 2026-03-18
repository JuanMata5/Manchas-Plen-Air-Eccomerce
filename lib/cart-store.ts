'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import type { CartItem, Product } from '@/lib/types'

// Dummy storage for SSR
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
          const existingItem = state.items.find((i) => i.product.id === product.id)
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id
                  ? {
                      ...i,
                      quantity: Math.min(
                        i.quantity + quantity,
                        product.max_per_order
                      ),
                    }
                  : i
              ),
            }
          }
          return {
            items: [...state.items, { product, quantity: Math.min(quantity, product.max_per_order) }],
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
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('carts')
            .select('items')
            .eq('user_id', user.id)
            .maybeSingle()

          if (error) {
            console.error('[CartStore] Error loading from DB:', error)
            return
          }

          const dbItems: CartItem[] = data?.items || []
          const localItems = get().items

          // Merge: DB items take precedence, but we combine quantities
          const merged: Record<string, CartItem> = {}
          
          // First add local items
          for (const item of localItems) {
            merged[item.product.id] = { ...item }
          }
          
          // Then add DB items (overwrite if conflict, or combine)
          for (const item of dbItems) {
            const id = item.product.id
            if (merged[id]) {
              merged[id].quantity = Math.min(
                merged[id].quantity + item.quantity,
                item.product.max_per_order
              )
            } else {
              merged[id] = { ...item }
            }
          }

          const mergedItems = Object.values(merged)
          set({ items: mergedItems })
          
          // Sync back to DB if merged something new
          if (localItems.length > 0) {
            await get().saveCartToDB(user)
          }
        } catch (err) {
          console.error('[CartStore] Unexpected error loading cart:', err)
        }
      },

      saveCartToDB: async (user) => {
        try {
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
        } catch (err) {
          console.error('[CartStore] Error saving to DB:', err)
        }
      },
    }),
    {
      name: 'plenair-cart',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : dummyStorage
      ),
    }
  )
)

// Helper to get current user
async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()
    return data.user ?? null
  } catch {
    return null
  }
}
