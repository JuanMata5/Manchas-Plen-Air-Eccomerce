import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { CategoryFilter } from '@/components/category-filter'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Empty } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import Link from 'next/link'
import { MapPin, Users, DollarSign, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import type { Product, Category } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{ categoria?: string; q?: string; viaje?: string }>
}

interface TravelExperience {
  id: string
  title: string
  location: string
  dates: string
  description: string
  capacity: number
  image_url: string
  plans: Array<{
    name: string
    price_usd: number
    price_ars_blue?: number
  }>
  is_active: boolean
}

async function getProducts(categorySlug?: string, q?: string): Promise<Product[]> {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('*, categories(id, name, slug)')
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })

  if (categorySlug) {
    // join on categories.slug
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()
    if (cat) {
      query = query.eq('category_id', cat.id)
    }
  }

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data } = await query
  return data ?? []
}

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('name')
  return data ?? []
}

async function getTravelExperiences(locationFilter?: string): Promise<TravelExperience[]> {
  const supabase = await createClient()
  let query = supabase
    .from('travel_experiences')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (locationFilter && locationFilter !== 'all') {
    query = query.ilike('location', `%${locationFilter}%`)
  }

  const { data } = await query
  return data ?? []
}

function buildTiendaHref({
  categoria,
  q,
  viaje,
}: {
  categoria?: string | null
  q?: string | null
  viaje?: string | null
}) {
  const params = new URLSearchParams()

  if (categoria) params.set('categoria', categoria)
  if (q) params.set('q', q)
  if (viaje) params.set('viaje', viaje)

  const queryString = params.toString()
  return `/tienda${queryString ? `?${queryString}` : ''}`
}

async function ProductGrid({
  categorySlug,
  q,
}: {
  categorySlug?: string
  q?: string
}) {
  let products = await getProducts(categorySlug, q)

  if (products.length === 0) {
    return (
      <Empty
        title="Sin productos"
        description="No encontramos productos con esos filtros. Proba con otra categoria."
      />
    )
  }

  // Ordenar destacados por precio mayor a menor
  const destacados = products.filter(p => p.is_featured)
    .sort((a, b) => (b.price_ars || 0) - (a.price_ars || 0))
  const normales = products.filter(p => !p.is_featured)

  const productosOrdenados = [...destacados, ...normales]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {productosOrdenados.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

async function ExperiencesGrid({ locationFilter }: { locationFilter?: string }) {
  const experiences = await getTravelExperiences(locationFilter)

  if (experiences.length === 0) {
    return (
      <Empty
        title="Sin experiencias"
        description="No encontramos experiencias con ese filtro. Probá con otra opción."
      />
    )
  }

  const getMinPrice = (exp: TravelExperience) => {
    if (!exp.plans || exp.plans.length === 0) return 0
    return Math.min(...exp.plans.map(p => p.price_usd))
  }

  const getMinPriceARS = (exp: TravelExperience) => {
    if (!exp.plans || exp.plans.length === 0) return 0
    return Math.min(...exp.plans.map(p => p.price_ars_blue || p.price_usd * 1100))
  }

  return (
    <div className="mb-12">
      <h2 className="font-serif font-bold text-2xl md:text-3xl text-foreground mb-6">
        Experiencias Premium
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experiences.map((experience) => (
          <Link
            key={experience.id}
            href={`/viajes/reservar/${experience.id}`}
            className="group"
          >
            <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer h-full flex flex-col">
              {/* Image */}
              <div className="relative h-64 w-full bg-slate-200 overflow-hidden">
                {experience.image_url ? (
                  <Image
                    src={experience.image_url}
                    alt={experience.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                    <span className="text-slate-500">Sin imagen</span>
                  </div>
                )}
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 m-3 rounded-full text-sm font-semibold">
                  Experiencia
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                  {experience.title}
                </h3>

                {/* Location */}
                <div className="flex items-center text-slate-600 mb-3">
                  <MapPin size={16} className="mr-2 flex-shrink-0" />
                  <span className="text-sm">{experience.location}</span>
                </div>

                {/* Description */}
                <p className="text-slate-700 text-sm mb-4 line-clamp-2 flex-grow">
                  {experience.description}
                </p>

                {/* Capacity */}
                <div className="flex items-center text-slate-600 mb-4">
                  <Users size={16} className="mr-2" />
                  <span className="text-sm">{experience.capacity} cupos</span>
                </div>

                {/* Price */}
                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <DollarSign size={16} className="text-green-600" />
                      <span className="text-xl font-bold text-green-600">
                        {getMinPrice(experience)} USD
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600">
                    Desde ${getMinPriceARS(experience).toLocaleString('es-AR')} ARS
                  </p>
                </div>

                {/* CTA */}
                <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2">
                  Ver opciones de pago
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default async function TiendaPage({ searchParams }: PageProps) {
  const params = await searchParams
  const categories = await getCategories()

  const categorySlug = params.categoria
  const q = params.q
  const locationFilter = params.viaje ?? 'all'

  const activeCategory = categories.find((c) => c.slug === categorySlug)
  const pageTitle = activeCategory ? activeCategory.name : 'Tienda'

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="font-serif font-bold text-3xl md:text-4xl text-foreground mb-2 text-balance">
            {pageTitle}
          </h1>
          {activeCategory?.description && (
            <p className="text-muted-foreground">{activeCategory.description}</p>
          )}
        </div>

        {/* Show Experiences section only when no category filter */}
        {!categorySlug && (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-foreground">Filtrar viajes:</span>
              <Link
                href={buildTiendaHref({ categoria: categorySlug ?? null, q: q ?? null, viaje: null })}
                className={`rounded-full border px-4 py-2 text-sm transition ${locationFilter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'}`}
              >
                Todos
              </Link>
              <Link
                href={buildTiendaHref({ categoria: categorySlug ?? null, q: q ?? null, viaje: 'trevelin' })}
                className={`rounded-full border px-4 py-2 text-sm transition ${locationFilter === 'trevelin' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'}`}
              >
                Trevelin
              </Link>
            </div>
            <Suspense fallback={null}>
              <ExperiencesGrid locationFilter={locationFilter} />
            </Suspense>
          </>
        )}

        {/* Filters */}
        <div className="mb-8">
          <Suspense fallback={null}>
            <CategoryFilter categories={categories} />
          </Suspense>
        </div>

        {/* Products */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          }
        >
          <ProductGrid categorySlug={categorySlug} q={q} />
        </Suspense>
      </main>
      <Footer />
    </>
  )
}
