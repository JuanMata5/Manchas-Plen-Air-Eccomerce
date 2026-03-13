'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, ShoppingBag, Package, Ticket, LogOut, Home } from 'lucide-react'

const iconMap: Record<string, any> = {
  '/admin': LayoutDashboard,
  '/admin/ordenes': ShoppingBag,
  '/admin/productos': Package,
  '/admin/tickets': Ticket,
}

interface Props {
  navItems: { href: string; label: string }[]
}

export function AdminMobileNav({ navItems }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-sidebar-accent transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-64 bg-sidebar text-sidebar-foreground flex flex-col h-full ml-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border">
              <span className="font-serif font-bold text-sm uppercase tracking-wider">Admin</span>
              <button
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-sidebar-accent transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = iconMap[item.href] || LayoutDashboard
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-foreground'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="px-3 pb-4 flex flex-col gap-1">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
              >
                <Home className="h-5 w-5 shrink-0" />
                Volver al sitio
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all"
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
