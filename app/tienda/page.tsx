import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/product-card'
import { CategoryFilter } from '@/components/category-filter'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Empty } from '@/components/ui/empty'
import { Spinner } from '@/components/ui/spinner'
import type { Product, Category } from '@/lib/types'

interface PageProps {
  searchParams: Promise<{ categoria?: string; q?: string }>
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

async function ProductGrid({
  categorySlug,
  q,
}: {
  categorySlug?: string
  q?: string
}) {
  const products = await getProducts(categorySlug, q)

  if (products.length === 0) {
    return (
      <Empty
        title="Sin productos"
        description="No encontramos productos con esos filtros. Proba con otra categoria."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

export default async function TiendaPage({ searchParams }: PageProps) {
  const params = await searchParams
  const categories = await getCategories()

  const categorySlug = params.categoria
  const q = params.q

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
