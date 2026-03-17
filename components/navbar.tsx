'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X, Leaf, User, Settings, LogOut, LogIn, UserPlus, Ticket, Sun, Moon } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useCartStore } from '@/lib/cart-store'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Profile } from '@/lib/types'
import { type Session } from '@supabase/supabase-js'

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/tienda', label: 'Tienda' },
  { href: '/tienda?categoria=entradas', label: 'Entradas' },
  { href: '/tienda?categoria=merchandising', label: 'Merch' },
]

export function Navbar() {
  const totalItems = useCartStore((s) => s.totalItems())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setMounted(true)

    ;(async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        console.error("Error getting session:", error.message)
        setSession(null)
        setProfile(null)
        return
      }

      const currentSession = data.session
      console.log('[Navbar] initial getSession()', {
        hasSession: Boolean(currentSession),
        email: currentSession?.user?.email,
      })
      setSession(currentSession)

      if (currentSession?.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single()

        if (profileError) {
          console.error("Error fetching profile:", profileError.message)
          setProfile(null)
        } else {
          setProfile(profileData)
        }
      } else {
        setProfile(null)
      }
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[Navbar] onAuthStateChange', {
        event: _event,
        hasSession: Boolean(session),
        email: session?.user?.email,
      })
      setSession(session)
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (error) {
          console.error("Error fetching profile:", error.message)
          setProfile(null)
        } else {
          setProfile(data)
        }
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }
  
  const user = session?.user
  const userName = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : ''
  const isAdmin = profile?.is_admin ?? false

  return (
    <header className="sticky top-0 z-50 bg-primary/95 text-primary-foreground shadow-md animate-header-in">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif font-bold text-xl tracking-wide hover:opacity-90 transition-all duration-300 hover:scale-[1.02]">
          <Leaf className="h-5 w-5" />
          Manchas Plen Air
        </Link>

        <ul className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm font-medium hover:text-primary-foreground/70 transition-all duration-300 hover:-translate-y-0.5">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {mounted && (
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80 transition-transform duration-300 hover:scale-105" aria-label="Cambiar tema" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          <DropdownMenu
            modal={false}
            open={accountMenuOpen}
            onOpenChange={(open) => {
              console.log('[Navbar] account dropdown open change', {
                open,
                hasUser: Boolean(user),
                email: user?.email,
              })
              setAccountMenuOpen(open)
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80 transition-transform duration-300 hover:scale-105" aria-label="Mi cuenta">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 z-[9999] bg-background text-foreground border-border shadow-lg"
            >
              {user ? (
                <>
                  <div className="px-2 py-2 text-sm">
                    <div className="font-bold truncate">{userName}</div>
                    <div className="text-muted-foreground truncate">{user.email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/cuenta/mis-ordenes" className="cursor-pointer">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Mis ordenes
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/cuenta/mis-tickets" className="cursor-pointer">
                      <Ticket className="h-4 w-4 mr-2" />
                      Mis tickets
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Settings className="h-4 w-4 mr-2" />
                        Panel Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-500">
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar sesion
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/login" className="cursor-pointer">
                      <LogIn className="h-4 w-4 mr-2" />
                      Iniciar sesion
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/auth/register" className="cursor-pointer">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Registrarse
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href="/carrito">
            <Button variant="ghost" size="icon" className="relative text-primary-foreground hover:bg-primary/80 transition-transform duration-300 hover:scale-105" aria-label={`Carrito con ${mounted ? totalItems : 0} productos`}>
              <ShoppingCart className="h-5 w-5" />
              {mounted && totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-brand-earth text-white border-0">
                  {totalItems > 9 ? '9+' : totalItems}
                </Badge>
              )}
            </Button>
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-primary-foreground hover:bg-primary/80 transition-transform duration-300 hover:scale-105" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-primary text-primary-foreground w-64 pt-12">
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-primary-foreground/70 hover:text-primary-foreground" aria-label="Cerrar menú">
                <X className="h-5 w-5" />
              </button>
              <ul className="flex flex-col gap-6 mt-4">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-lg font-medium hover:text-primary-foreground/70 transition-colors" onClick={() => setMobileOpen(false)}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                {user ? (
                  <>
                    <li><Link href="/cuenta/mis-ordenes" className="text-lg font-medium hover:text-primary-foreground/70 transition-colors" onClick={() => setMobileOpen(false)}>Mis ordenes</Link></li>
                    <li><Link href="/cuenta/mis-tickets" className="text-lg font-medium hover:text-primary-foreground/70 transition-colors" onClick={() => setMobileOpen(false)}>Mis tickets</Link></li>
                    {isAdmin && <li><Link href="/admin" className="text-lg font-medium hover:text-primary-foreground/70 transition-colors" onClick={() => setMobileOpen(false)}>Panel Admin</Link></li>}
                    <li><button onClick={() => { handleSignOut(); setMobileOpen(false) }} className="text-lg font-medium text-red-300 hover:text-red-200 transition-colors">Cerrar sesion</button></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/auth/login" className="text-lg font-medium hover:text-primary-foreground/70 transition-colors" onClick={() => setMobileOpen(false)}>Iniciar sesion</Link></li>
                    <li><Link href="/auth/register" className="text-lg font-medium hover:text-primary-foreground/70 transition-colors" onClick={() => setMobileOpen(false)}>Registrarse</Link></li>
                  </>
                )}
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
