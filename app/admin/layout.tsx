import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingBag, Ticket, Leaf, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminMobileNav } from '@/components/admin/admin-mobile-nav'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/ordenes', label: 'Ordenes', icon: ShoppingBag },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/tickets', label: 'Tickets', icon: Ticket },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?from=/admin')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-50 bg-sidebar text-sidebar-foreground flex items-center justify-between px-4 h-14 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2 font-serif font-bold text-lg">
          <Leaf className="h-5 w-5" />
          Manchas Plen Air
        </Link>
        <AdminMobileNav navItems={navItems.map((item) => ({ href: item.href, label: item.label }))} />
      </div>

      {/* Desktop sidebar */}
      <aside className="w-56 bg-sidebar text-sidebar-foreground flex-col shrink-0 hidden md:flex">
        <div className="px-5 py-6 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2 font-serif font-bold text-lg hover:opacity-80 transition-opacity">
            <Leaf className="h-5 w-5" />
            Manchas Plen Air
          </Link>
          <p className="text-xs text-sidebar-foreground/50 mt-1 uppercase tracking-wider">Admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 pb-4">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Cerrar sesion
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
