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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { ImageUpload, type PendingImage } from './ImageUpload'
import { Product, Category, ProductImage } from '@/lib/types'

const productSchema = z.object({
  name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  category_id: z.string().uuid().nullable(),
  price_ars: z.coerce.number().positive(),
  price_usd: z.coerce.number().optional().nullable(),
  stock: z.coerce.number().int().min(0),
  max_per_order: z.coerce.number().int().min(1),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  product_type: z.enum(['ticket', 'workshop', 'merchandise']),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product & { product_images: ProductImage[] }
  categories: Category[]
  mode: 'create' | 'edit'
}

async function uploadImagesToCloudinary(files: File[]) {
  const signRes = await fetch('/api/cloudinary/sign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'plenair/products' }),
  })

  if (!signRes.ok) throw new Error('Error firma Cloudinary')
  const signData = await signRes.json()

  const results = []

  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', signData.api_key)
    formData.append('timestamp', String(signData.timestamp))
    formData.append('signature', signData.signature)
    formData.append('folder', signData.folder)

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`,
      { method: 'POST', body: formData }
    )

    if (!res.ok) throw new Error('Error subiendo imagen')

    const data = await res.json()

    results.push({
      publicId: data.public_id,
      url: data.secure_url,
      width: data.width,
      height: data.height,
    })
  }

  return results
}

export function ProductForm({ product, categories, mode }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])

  const { handleSubmit, register, control } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      description: product?.description ?? '',
      category_id: product?.category_id ?? null,
      price_ars: product?.price_ars ?? 0,
      price_usd: product?.price_usd ?? undefined,
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

      const url =
        mode === 'create'
          ? '/api/admin/products/create'
          : `/api/admin/products/${product?.id}`

      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Error guardando producto')

      const savedProduct = await res.json()

      if (pendingImages.length > 0) {
        const files = pendingImages.map((p) => p.file)
        const uploaded = await uploadImagesToCloudinary(files)

        const existingCount =
          mode === 'edit' ? product?.product_images?.length ?? 0 : 0

        for (let i = 0; i < uploaded.length; i++) {
          const img = uploaded[i]

          await fetch('/api/admin/products/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: savedProduct.id,
              cloudinary_public_id: img.publicId,
              url: img.url,
              width: img.width,
              height: img.height,
              is_primary: existingCount === 0 && i === 0,
              display_order: existingCount + i,
            }),
          })
        }
      }

      toast.success('Producto guardado')
      router.push('/admin/productos')
      router.refresh()
    } catch (err) {
      toast.error('Error')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* NOMBRE Y SLUG */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nombre</Label>
          <Input {...register('name')} />
        </div>

        <div>
          <Label>Slug</Label>
          <Input {...register('slug')} />
        </div>
      </div>

      {/* DESCRIPCIÓN */}
      <div>
        <Label>Descripción</Label>
        <Textarea {...register('description')} />
      </div>

      {/* PRECIOS */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Precio ARS</Label>
          <Input type="number" {...register('price_ars')} />
        </div>

        <div>
          <Label>Precio USD</Label>
          <Input type="number" {...register('price_usd')} />
        </div>
      </div>

      {/* STOCK */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Stock</Label>
          <Input type="number" {...register('stock')} />
        </div>

        <div>
          <Label>Máx por orden</Label>
          <Input type="number" {...register('max_per_order')} />
        </div>
      </div>

      {/* CATEGORÍA */}
      <Controller
        control={control}
        name="category_id"
        render={({ field }) => (
          <div>
            <Label>Categoría</Label>
            <Select
              onValueChange={field.onChange}
              value={field.value ?? ''}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      />

      {/* IMÁGENES */}
      <ImageUpload
        pendingImages={pendingImages}
        onPendingImagesChange={setPendingImages}
      />

      {/* SWITCHES */}
      <Controller
        control={control}
        name="is_active"
        render={({ field }) => (
          <div className="flex justify-between">
            <Label>Activo</Label>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </div>
        )}
      />

      <Controller
        control={control}
        name="is_featured"
        render={({ field }) => (
          <div className="flex justify-between">
            <Label>Destacado</Label>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </div>
        )}
      />

      {/* SUBMIT */}
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="animate-spin mr-2" />}
        Guardar
      </Button>
    </form>
  )
}