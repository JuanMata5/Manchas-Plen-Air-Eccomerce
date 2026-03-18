'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

const supabase = createClient()

interface UserContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = (props: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Listener para cambios locales de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Chequeo activo en Supabase: si la cuenta fue borrada, cerrar sesión local
    async function verifyUserStillExists() {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data?.user) {
        await supabase.auth.signOut()
        setSession(null)
        setUser(null)
      }
    }
    verifyUserStillExists()

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const value = {
    session,
    user,
    isLoading,
  }

  return <UserContext.Provider value={value} {...props} />
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
