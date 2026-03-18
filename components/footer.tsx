import Link from 'next/link'
import { Leaf, Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react'

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z" />
    </svg>
  )
}

export function Footer() {
  return (
    <footer className="bg-foreground text-background mt-16 page-enter">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 font-serif font-bold text-lg mb-3">
            <Leaf className="h-4 w-4" />
            Manchas Plen Air
          </div>
          <p className="text-sm text-background/70 leading-relaxed mb-4">
            Tu lugar para conseguir entradas, viajes y experiencias unicas en toda Argentina.
          </p>
          {/* Social icons */}
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/manchas_plein_air/"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 w-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://www.facebook.com/MPABSAS2/#"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 w-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://www.threads.com/@manchas_plein_air"
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 w-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 transition-all duration-300 hover:-translate-y-1 hover:scale-105"
              aria-label="Threads"
            >
              <TikTokIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Tienda */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wider mb-3 text-background/50">
            Tienda
          </h3>
          <ul className="space-y-2 text-sm text-background/70">
            <li><Link href="/tienda" className="hover:text-background transition-colors">Todos los productos</Link></li>
            <li><Link href="/tienda?categoria=entradas" className="hover:text-background transition-colors">Entradas</Link></li>
            <li><Link href="/tienda?categoria=viajes" className="hover:text-background transition-colors">Viajes</Link></li>
            <li><Link href="/tienda?categoria=merchandising" className="hover:text-background transition-colors">Merchandising</Link></li>
            <li><Link href="/tienda?categoria=experiencias" className="hover:text-background transition-colors">Experiencias</Link></li>
          </ul>
        </div>

        {/* Cuenta */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wider mb-3 text-background/50">
            Tu cuenta
          </h3>
          <ul className="space-y-2 text-sm text-background/70">
            <li><Link href="/cuenta/mis-ordenes" className="hover:text-background transition-colors">Mis pedidos</Link></li>
            <li><Link href="/auth/login" className="hover:text-background transition-colors">Iniciar sesion</Link></li>
            <li><Link href="/auth/register" className="hover:text-background transition-colors">Crear cuenta</Link></li>
            <li><Link href="/#contacto" className="hover:text-background transition-colors">Contacto</Link></li>
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h3 className="font-semibold text-sm uppercase tracking-wider mb-3 text-background/50">
            Contacto
          </h3>
          <ul className="space-y-3 text-sm text-background/70">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-background/50" />
              <span>
                <a href="tel:1139430021" className="hover:text-background transition-colors">1139430021</a> (General) / <a href="tel:1167546892" className="hover:text-background transition-colors">1167546892</a> (Stands)
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-background/50" />
              <span>
                <a href="mailto:mpadsas@gmail.com" className="hover:text-background transition-colors">mpadsas@gmail.com</a> (General) / <a href="mailto:manchastribu70@gmail.com" className="hover:text-background transition-colors">manchastribu70@gmail.com</a> (Stands)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-background/50 mt-0.5" />
              <span>Buenos Aires, Argentina</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10 py-4 text-center text-xs text-background/40">
        &copy; {new Date().getFullYear()} Manchas Plen Air. Todos los derechos reservados.
      </div>
    </footer>
  )
}
