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
  const { clearCart } = useCartStore()
  // Use a ref to store the previous user ID to compare against on re-renders
  const previousUserIdRef = useRef<string | undefined>(user?.id)

  useEffect(() => {
    // Get the current user ID and the previous one from the ref
    const currentUserId = user?.id
    const previousUserId = previousUserIdRef.current

    // If the user ID has changed (login, logout, or account switch), clear the cart.
    if (currentUserId !== previousUserId) {
      console.log(
        `[CartSessionManager] User changed from ${previousUserId || 'guest'} to ${currentUserId || 'guest'}. Clearing cart.`
      )
      clearCart()
    }

    // After the check, update the ref to the current user ID for the next render
    previousUserIdRef.current = currentUserId
  }, [user, clearCart]) // Effect runs whenever user object or clearCart function changes

  // This component does not render anything to the DOM
  return null
}
