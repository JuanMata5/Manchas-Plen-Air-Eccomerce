import Link from 'next/link'
import Image from 'next/image'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatARS } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

async function getProducts() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, categories(name)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-foreground">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} productos</p>
        </div>
        <Button asChild>
          <Link href="/admin/productos/nuevo">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Producto</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Categoria</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Precio</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-serif text-muted-foreground">PA</div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {product.categories?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 font-medium tabular-nums">{formatARS(product.price_ars)}</td>
                  <td className="px-5 py-3">
                    <span className={`font-medium tabular-nums ${product.stock <= 5 ? 'text-amber-600' : 'text-foreground'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-xs">
                      {product.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    {product.is_featured && (
                      <Badge className="ml-1 text-xs bg-brand-earth text-white border-0">Destacado</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/productos/${product.id}`}>Editar</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
