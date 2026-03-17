'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { ImageUpload, type PendingImage } from './ImageUpload'
import { Product, Category } from '@/lib/types'

const productSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().optional(),

  category_id: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().nullable()
  ),

  price_ars: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().positive()
  ),

  price_usd: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().optional().nullable()
  ),

  stock: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().int().min(0)
  ),

  max_per_order: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number().int().min(1)
  ),

  is_active: z.boolean(),
  is_featured: z.boolean(),
  product_type: z.enum(['ticket', 'workshop', 'merchandise']),
})

type ProductFormData = z.infer<typeof productSchema>

interface Props {
  product?: Product
  categories: Category[]
  mode: 'create' | 'edit'
}

async function uploadImagesToCloudinary(files: File[]) {
  const signRes = await fetch('/api/cloudinary/sign-upload', {
    method: 'POST',
  })

  const signData = await signRes.json()

  const results = []

  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', signData.api_key)
    formData.append('timestamp', String(signData.timestamp))
    formData.append('signature', signData.signature)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`,
      { method: 'POST', body: formData }
    )

    const data = await res.json()

    results.push({
      publicId: data.public_id,
      url: data.secure_url,
    })
  }

  return results
}

export function ProductForm({ product, categories, mode }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])

  const { handleSubmit, control } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      ...product,
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      stock: product?.stock ?? 0,
      max_per_order: product?.max_per_order ?? 1,
      is_active: product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
      product_type: product?.product_type ?? 'merchandise',
    },
  })

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true)

      const res = await fetch(
        mode === 'create'
          ? '/api/admin/products/create'
          : `/api/admin/products/${product?.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )

      const savedProduct = await res.json()

      // 🔥 SUBIR IMÁGENES
      if (pendingImages.length > 0) {
        const files = pendingImages.map(p => p.file)
        const uploaded = await uploadImagesToCloudinary(files)

        for (let i = 0; i < uploaded.length; i++) {
          await fetch('/api/admin/products/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: savedProduct.id,
              url: uploaded[i].url,
              cloudinary_public_id: uploaded[i].publicId,
              is_primary: i === 0,
              display_order: i,
            }),
          })
        }
      }

      toast.success('Producto guardado')
      router.push('/admin/productos')
      router.refresh()
    } catch (err) {
      toast.error('Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* NAME */}
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <div>
            <Label>Nombre</Label>
            <Input {...field} />
          </div>
        )}
      />

      {/* SLUG */}
      <Controller
        control={control}
        name="slug"
        render={({ field }) => (
          <div>
            <Label>Slug</Label>
            <Input {...field} />
          </div>
        )}
      />

      {/* CATEGORY */}
      <Controller
        control={control}
        name="category_id"
        render={({ field }) => (
          <Select
            onValueChange={(val) => field.onChange(val || null)}
            value={field.value ?? ''}
          >
            <SelectTrigger>
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

      {/* PRECIOS */}
      <Controller
        control={control}
        name="price_ars"
        render={({ field }) => (
          <div>
            <Label>Precio ARS</Label>
            <Input type="number" {...field} />
          </div>
        )}
      />

      <Controller
        control={control}
        name="stock"
        render={({ field }) => (
          <div>
            <Label>Stock</Label>
            <Input type="number" {...field} />
          </div>
        )}
      />

      <Controller
        control={control}
        name="max_per_order"
        render={({ field }) => (
          <div>
            <Label>Max por orden</Label>
            <Input type="number" {...field} />
          </div>
        )}
      />

      {/* SWITCHES */}
      <Controller
        control={control}
        name="is_active"
        render={({ field }) => (
          <div className="flex justify-between">
            <Label>Activo</Label>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />

      <Controller
        control={control}
        name="is_featured"
        render={({ field }) => (
          <div className="flex justify-between">
            <Label>Destacado</Label>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />

      {/* IMAGES */}
      <ImageUpload
        pendingImages={pendingImages}
        onPendingImagesChange={setPendingImages}
        multiple
        maxFiles={5}
      />

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="animate-spin mr-2" />}
        Guardar
      </Button>
    </form>
  )
}