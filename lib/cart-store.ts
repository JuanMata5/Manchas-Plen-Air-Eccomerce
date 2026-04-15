'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import type { CartItem, Product, ExperienceCartItem, ProductCartItem } from '@/lib/types'

// Dummy storage for SSR
const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

// Type guards
function isExperienceCartItem(item: CartItem): item is ExperienceCartItem {
  return item.type === 'experience'
}

function isProductCartItem(item: CartItem): item is ProductCartItem {
  return 'product' in item && item.product !== undefined
}

export interface CartState {
  items: CartItem[]

  // Support both old addItem (products) and new addToCart (both types)
  addItem: (product: Product, quantity?: number) => Promise<void>
  addToCart: (item: ExperienceCartItem | (ProductCartItem & { product: Product })) => void
  removeItem: (itemId: string, type?: 'product' | 'experience') => Promise<void>
  updateQuantity: (itemId: string, quantity: number, type?: 'product' | 'experience') => Promise<void>
  clearCart: () => Promise<void>

  totalItems: () => number
  totalARS: () => number
  totalUSD: () => number

  loadCartFromDB: (user: User) => Promise<void>
  saveCartToDB: (user: User) => Promise<void>
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: async (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(
            (i) => isProductCartItem(i) && i.product.id === product.id
          )

          if (existingItem && isProductCartItem(existingItem)) {
            return {
              items: state.items.map((i) =>
                isProductCartItem(i) && i.product.id === product.id
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
            items: [
              ...state.items,
              {
                product,
                quantity: Math.min(quantity, product.max_per_order),
                type: 'product' as const,
              } as ProductCartItem,
            ],
          }
        })

        const user = await getCurrentUser()
        if (user) await get().saveCartToDB(user)
      },

      addToCart: (item) => {
        set((state) => {
          if (isExperienceCartItem(item)) {
            // For experiences, always replace (quantity is always 1)
            const existingIndex = state.items.findIndex(
              (i) => isExperienceCartItem(i) && i.id === item.id && i.metadata.planIndex === item.metadata.planIndex
            )

            if (existingIndex >= 0) {
              // Experience with same plan already in cart, just update
              return {
                items: state.items.map((i, idx) =>
                  idx === existingIndex ? item : i
                ),
              }
            }

            return {
              items: [...state.items, item],
            }
          } else {
            // For products, merge quantities
            const existingItem = state.items.find(
              (i) => isProductCartItem(i) && i.product.id === item.product.id
            )

            if (existingItem && isProductCartItem(existingItem)) {
              return {
                items: state.items.map((i) =>
                  isProductCartItem(i) && i.product.id === item.product.id
                    ? {
                        ...i,
                        quantity: Math.min(
                          i.quantity + item.quantity,
                          item.product.max_per_order
                        ),
                      }
                    : i
                ),
              }
            }

            return {
              items: [...state.items, item],
            }
          }
        })
      },

      removeItem: async (itemId, type) => {
        set((state) => {
          if (type === 'experience') {
            return {
              items: state.items.filter(
                (i) => !isExperienceCartItem(i) || i.id !== itemId
              ),
            }
          }

          // Product removal
          return {
            items: state.items.filter(
              (i) => !isProductCartItem(i) || i.product.id !== itemId
            ),
          }
        })

        const user = await getCurrentUser()
        if (user) await get().saveCartToDB(user)
      },

      updateQuantity: async (itemId, quantity, type) => {
        if (quantity <= 0) {
          await get().removeItem(itemId, type)
          return
        }

        set((state) => {
          if (type === 'experience') {
            // Experiences always have quantity 1, don't update
            return { items: state.items }
          }

          // Product quantity update
          return {
            items: state.items.map((i) =>
              isProductCartItem(i) && i.product.id === itemId
                ? {
                    ...i,
                    quantity: Math.min(quantity, i.product.max_per_order),
                  }
                : i
            ),
          }
        })

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
        get().items.reduce((sum, i) => {
          if (isProductCartItem(i)) {
            return sum + (i.product?.price_ars || 0) * i.quantity
          }
          // Experience
          return sum + (i.price_ars_blue || 0) * i.quantity
        }, 0),

      totalUSD: () =>
        get().items.reduce((sum, i) => {
          if (isProductCartItem(i)) {
            return sum + (i.product?.price_usd || 0) * i.quantity
          }
          // Experience
          return sum + (i.price_usd || 0) * i.quantity
        }, 0),

      loadCartFromDB: async (user) => {
        try {
          const supabase = createClient()

          const { data, error } = await supabase
            .from('carts')
            .select('items')
            .eq('user_id', user.id)
            .maybeSingle()

          if (error) {
            console.error('[CartStore] Load error:', error)
            return
          }

          const dbItems: CartItem[] = data?.items || []

          // Reemplazar el carrito local por el de la base de datos
          set({ items: dbItems })

          await get().saveCartToDB(user)
        } catch (err) {
          console.error('[CartStore] Unexpected load error:', err)
        }
      },

      saveCartToDB: async (user) => {
        try {
          const supabase = createClient()
          const items = get().items

          const { error } = await supabase.from('carts').upsert(
            {
              user_id: user.id,
              items,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id',
            }
          )

          if (error) {
            console.error('[CartStore] UPSERT ERROR:', error)
          }
        } catch (err) {
          console.error('[CartStore] Save error:', err)
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