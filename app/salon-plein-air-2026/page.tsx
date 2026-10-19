import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Empty } from '@/components/ui/empty'
import type { Product } from '@/lib/types'

const salonProductSlugs = [
  'concurso-salon-categoria-1',
  'concurso-salon-categoria-2',
  'muestra-colectiva-invitada-salon-2026',
  'jornada-plein-air-san-martin-2026',
]

interface PageProps {
  searchParams: Promise<{ producto?: string }>
}

async function getSalonProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .in('slug', salonProductSlugs)
    .eq('is_active', true)

  const products = data ?? []
  return salonProductSlugs
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is Product => !!product)
}

export default async function SalonPleinAir2026Page({ searchParams }: PageProps) {
  const [{ producto }, products] = await Promise.all([searchParams, getSalonProducts()])

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
            Salón Plein Air 2026
          </h1>
          <p className="mt-2 text-muted-foreground">
            Elegí una inscripción para consultar toda la información y continuar.
          </p>
        </header>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                initiallyOpen={producto === product.slug}
              />
            ))}
          </div>
        ) : (
          <Empty
            title="Inscripciones no disponibles"
            description="Las opciones del Salón no están cargadas o activas en este momento."
          />
        )}
      </main>
      <Footer />
    </>
  )
}
