import Image from 'next/image'
import type { Product } from '@/lib/types'
import { formatARS } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const isSoldOut = product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock <= 10

  return (
    <Link href={`/tienda/${product.slug}`} className="group bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full hover-lift surface-sheen">
      {/* --- Imagen y Badges --- */}
      <div className="relative aspect-4/3 bg-muted overflow-hidden">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground text-5xl font-serif">PA</span>
          </div>
        )}
        {/* --- Badges de Estado --- */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {isLowStock && !isSoldOut && (
            <Badge className="bg-amber-500 text-white text-xs font-semibold border-0 animate-pulse">
              ¡Poco Stock!
            </Badge>
          )}
          {isSoldOut && (
            <Badge variant="secondary" className="text-xs font-semibold">
              Agotado
            </Badge>
          )}
        </div>
      </div>

      {/* --- Informacion del producto --- */}
      <div className="p-4 flex flex-col flex-1">
        {product.categories && (
          <span className="text-xs text-primary font-semibold uppercase tracking-wider">
            {product.categories.name}
          </span>
        )}

        <h2 className="font-serif font-bold text-lg text-foreground mt-2 mb-2 leading-snug text-balance group-hover:text-primary transition-colors">
          {product.name}
        </h2>

        <div className="mt-auto mb-4">
          <p className="font-display font-bold text-2xl text-foreground -mt-1">
            {formatARS(product.price_ars)}
          </p>
        </div>
      </div>
    </Link>
  )
}
