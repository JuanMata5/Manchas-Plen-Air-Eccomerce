'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@/components/user-provider'
import { useCartStore } from '@/lib/cart-store'

/**
 * A client component that manages the cart session in response to user auth changes.
 * This component is crucial for multi-user security on a shared device.
 */
export function CartSessionManager() {
  const { user } = useUser()
  const { clearCart, loadCartFromDB } = useCartStore()
  const previousUserIdRef = useRef<string | undefined>(user?.id)

  useEffect(() => {
    const currentUserId = user?.id
    const previousUserId = previousUserIdRef.current

    if (currentUserId && currentUserId !== previousUserId) {
      // Login o cambio de usuario: cargar carrito desde DB
      loadCartFromDB(user)
    } else if (!currentUserId && previousUserId) {
      // Logout: limpiar carrito local
      clearCart()
    }
    previousUserIdRef.current = currentUserId
  }, [user, clearCart, loadCartFromDB])

  return null
}
