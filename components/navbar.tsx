'use client'

import Link from 'next/link'
import { ShoppingCart, Menu, X, Leaf, Settings, LogOut, LogIn, UserPlus, Sun, Moon, Ticket } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useCartStore } from '@/lib/cart-store'
import { useUser } from '@/components/user-provider'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

const navLinks = [
  { href: '/', label: 'Inicio' },
  { href: '/tienda', label: 'Tienda' },
  { href: '/tienda?categoria=entradas', label: 'Entradas' },
  { href: '/tienda?categoria=merchandising', label: 'Merch' },
]

export function Navbar() {
  const totalItems = useCartStore((s) => s.totalItems())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { user } = useUser()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }
  
  const isAdmin = false; // TODO: Implement profile fetching if needed

  return (
    <header className="sticky top-0 z-50 w-full bg-amber-600 text-white">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif font-bold text-xl tracking-wide hover:opacity-90 transition-all duration-300 hover:scale-[1.02]">
          <Leaf className="h-5 w-5" />
          Manchas Plen Air
        </Link>

        <ul className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm font-medium text-amber-100 hover:text-white transition-colors">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {mounted && (
            <Button variant="ghost" size="icon" aria-label="Cambiar tema" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="hover:bg-white/10">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          {/* User auth links for desktop */}
          <div className="hidden md:flex items-center gap-4 ml-2">
            {user ? (
              <>
                <Link href="/cuenta/mis-ordenes" className="text-sm font-medium text-amber-100 hover:text-white transition-colors flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Mis Órdenes
                </Link>
                <Link href="/cuenta/mis-tickets" className="text-sm font-medium text-amber-100 hover:text-white transition-colors flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Mis Tickets
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="text-sm font-medium text-amber-100 hover:text-white transition-colors flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Panel Admin
                  </Link>
                )}
                <button onClick={handleSignOut} className="text-sm font-medium text-amber-100 hover:text-white transition-colors flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-amber-100 hover:text-white transition-colors flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Iniciar Sesión
                </Link>
                <Link href="/auth/register" className="text-sm font-medium text-amber-100 hover:text-white transition-colors flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Registrarse
                </Link>
              </>
            )}
          </div>

          <Link href="/carrito">
            <Button variant="ghost" size="icon" className="relative hover:bg-white/10" aria-label={`Carrito con ${mounted ? totalItems : 0} productos`}>
              <ShoppingCart className="h-5 w-5" />
              {mounted && totalItems > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs">
                  {totalItems > 9 ? '9+' : totalItems}
                </Badge>
              )}
            </Button>
          </Link>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-white/10" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 pt-12">
              <ul className="flex flex-col gap-6 mt-4">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-lg font-medium hover:text-muted-foreground transition-colors" onClick={() => setMobileOpen(false)}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                 <Separator className="my-2"/>
                 {user ? (
                  <>
                    <li className='font-semibold text-lg'>Mi Cuenta</li>
                    <li><Link href="/cuenta/mis-ordenes" className="text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>Mis ordenes</Link></li>
                    <li><Link href="/cuenta/mis-tickets" className="text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(false)}>Mis tickets</Link></li>
                    {isAdmin && <li><Link href="/admin" className="hover:text-foreground" onClick={() => setMobileOpen(false)}>Panel Admin</Link></li>}
                    <li><button onClick={() => { handleSignOut(); setMobileOpen(false) }} className="text-red-500">Cerrar sesion</button></li>
                  </>
                ) : (
                  <>
                    <li><Link href="/auth/login" className="text-lg font-medium hover:text-muted-foreground" onClick={() => setMobileOpen(false)}>Iniciar sesion</Link></li>
                    <li><Link href="/auth/register" className="text-lg font-medium hover:text-muted-foreground" onClick={() => setMobileOpen(false)}>Registrarse</Link></li>
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
