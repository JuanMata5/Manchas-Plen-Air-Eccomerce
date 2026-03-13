import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ProductForm } from '@/components/ProductForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Editar Producto | Plen Air Admin',
  description: 'Editar información del producto',
}

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Verify user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Verify user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    redirect('/admin')
  }

  // Fetch product
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) {
    notFound()
  }

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Producto</h1>
        <p className="text-gray-500 mt-2">{product.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            product={product}
            categories={categories || []}
            mode="edit"
          />
        </CardContent>
      </Card>
    </div>
  )
}
