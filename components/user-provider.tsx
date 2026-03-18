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
    // The listener is fired immediately with the current session, so we don't need a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false) // Stop loading once we have the auth state.
    })

    // Cleanup the subscription when the component unmounts.
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
