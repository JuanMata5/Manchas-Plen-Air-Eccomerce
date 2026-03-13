import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProductForm } from '@/components/ProductForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata = {
  title: 'Nuevo Producto | Plen Air Admin',
  description: 'Crear nuevo producto',
}

export default async function NewProductPage() {
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

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Crear Nuevo Producto</h1>
        <p className="text-gray-500 mt-2">Agrega un nuevo producto al catálogo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Producto</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            categories={categories || []}
            mode="create"
          />
        </CardContent>
      </Card>
    </div>
  )
}
