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
import { Product, Category, ProductImage } from '@/lib/types'

const productSchema = z.object({
  name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Solo letras, números y guiones'),
  description: z.string().optional(),
  category_id: z.string().uuid('Selecciona una categoría').nullable(),
  price_ars: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({
      invalid_type_error: 'Precio ARS debe ser un número',
      required_error: 'Precio ARS es requerido',
    }).positive('Precio ARS debe ser mayor que 0')
  ),
  price_usd: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({
      invalid_type_error: 'Precio USD debe ser un número',
    }).positive('Precio USD debe ser mayor que 0').optional().nullable()
  ),
  stock: z.coerce.number().int().min(0, 'Stock debe ser ≥ 0'),
  max_per_order: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({
      invalid_type_error: 'Máximo por orden debe ser un número',
      required_error: 'Máximo por orden es requerido',
    }).int().min(1, 'Máximo por orden debe ser al menos 1')
  ),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  product_type: z.enum(['ticket', 'workshop', 'merchandise']).default('merchandise'),
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

  if (!signRes.ok) throw new Error('Error al obtener la firma de subida de Cloudinary.')
  const signData = await signRes.json()

  const results = []
  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', signData.api_key)
    formData.append('timestamp', String(signData.timestamp))
    formData.append('signature', signData.signature)
    formData.append('folder', signData.folder)
    if (signData.eager) formData.append('eager', signData.eager)
    if (signData.eager_async) formData.append('eager_async', String(signData.eager_async))
    if (signData.upload_preset) formData.append('upload_preset', signData.upload_preset)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`, { method: 'POST', body: formData })
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('[Cloudinary Upload Error]', errorData)
        throw new Error(`Error subiendo imagen`)
    }
    const data = await res.json()
    results.push({ publicId: data.public_id, url: data.secure_url, width: data.width, height: data.height })
  }
  return results
}

export function ProductForm({ product, categories, mode }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])

  const { handleSubmit, control } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      description: product?.description ?? '',
      category_id: product?.category_id ?? null,
      price_ars: product?.price_ars ?? undefined,
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
      setLoadingMessage('Guardando producto...')

      const productId = product?.id
      const url = mode === 'create' ? '/api/admin/products/create' : `/api/admin/products/${productId}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}))
        throw new Error(`Error al guardar el producto: ${errorBody.error || 'Error desconocido'}`)
      }

      const savedProduct = await res.json()

      if (pendingImages.length > 0) {
        setLoadingMessage(`Subiendo ${pendingImages.length} imagen(es)...`)
        const files = pendingImages.map(p => p.file)
        const uploaded = await uploadImagesToCloudinary(files)

        setLoadingMessage('Guardando imágenes...')

        const initialDisplayOrder = mode === 'edit' ? product?.product_images?.length ?? 0 : 0;
        const productHasImages = initialDisplayOrder > 0;

        for (let i = 0; i < uploaded.length; i++) {
          const img = uploaded[i]
          const displayOrder = initialDisplayOrder + i
          const isPrimary = !productHasImages && i === 0;

          const uploadImageRes = await fetch('/api/admin/products/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: savedProduct.id,
              cloudinary_public_id: img.publicId,
              url: img.url,
              width: img.width,
              height: img.height,
              is_primary: isPrimary,
              display_order: displayOrder,
            }),
          })

          if (!uploadImageRes.ok) {
            throw new Error('Error al guardar una de las imágenes en la base de datos.')
          }
        }
      }

      toast.success(mode === 'create' ? 'Producto creado con éxito' : 'Producto actualizado con éxito')
      router.push(mode === 'create' ? `/admin/productos/${savedProduct.id}` : '/admin/productos')
      router.refresh()

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error.'
        console.error('[ProductForm Submit Error]', errorMessage)
        toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <Controller control={control} name="name" render={({ field, fieldState }) => (<div><Label>Nombre</Label><Input {...field} /><p className="text-red-500 text-sm">{fieldState.error?.message}</p></div>)} />
      
      {/* Slug */}
      <Controller control={control} name="slug" render={({ field, fieldState }) => (<div><Label>Slug</Label><Input {...field} /><p className="text-red-500 text-sm">{fieldState.error?.message}</p></div>)} />

      {/* Description */}
      <Controller control={control} name="description" render={({ field }) => (<div><Label>Descripción</Label><Textarea {...field} value={field.value ?? ''} /></div>)} />

      {/* Category */}
      <Controller control={control} name="category_id" render={({ field, fieldState }) => (<div><Label>Categoría</Label><Select onValueChange={(val) => field.onChange(val || null)} value={field.value ?? ''}><SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger><SelectContent>{categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select><p className="text-red-500 text-sm">{fieldState.error?.message}</p></div>)} />

      {/* Product Type */}
      <Controller control={control} name="product_type" render={({ field, fieldState }) => (<div><Label>Tipo de Producto</Label><Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Tipo de producto" /></SelectTrigger><SelectContent><SelectItem value="merchandise">Merchandise</SelectItem><SelectItem value="ticket">Ticket</SelectItem><SelectItem value="workshop">Workshop</SelectItem></SelectContent></Select><p className="text-red-500 text-sm">{fieldState.error?.message}</p></div>)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price ARS */}
        <Controller control={control} name="price_ars" render={({ field, fieldState }) => (<div><Label>Precio ARS</Label><Input type="number" {...field} /><p className="text-red-500 text-sm">{fieldState.error?.message}</p></div>)} />

        {/* Price USD */}
        <Controller control={control} name="price_usd" render={({ field, fieldState }) => (<div><Label>Precio USD (Opcional)</Label><Input type="number" {...field} value={field.value ?? ''} /><p className="text-red-500 text-sm">{fieldState.error?.message}</p></div>)} />

        {/* Stock */}
        <Controller control={control} name="stock" render={({ field, fieldState }) => (<div><Label>Stock</Label><Input type="number" {...field} /><p className="text-red-500 text-sm">{fieldState.error?.message}</p></div>)} />

        {/* Max per order */}
        <Controller control={control} name="max_per_order" render={({ field, fieldState }) => (<div><Label>Máximo por orden</Label><Input type="number" {...field} /><p className="text-red-500 text-sm">{fieldState.error?.message}</p></div>)} />
      </div>

      {/* Image Upload */}
      <ImageUpload pendingImages={pendingImages} onPendingImagesChange={setPendingImages} multiple maxFiles={5} />

      <div className="flex flex-col space-y-4">
          {/* Is Active */}
          <Controller control={control} name="is_active" render={({ field }) => (<div className="flex justify-between items-center"><Label>Activo</Label><Switch checked={field.value} onCheckedChange={field.onChange} /></div>)} />

          {/* Is Featured */}
          <Controller control={control} name="is_featured" render={({ field }) => (<div className="flex justify-between items-center"><Label>Destacado</Label><Switch checked={field.value} onCheckedChange={field.onChange} /></div>)} />
      </div>

      {/* SUBMIT */}
      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="animate-spin mr-2" />}
        {loading ? loadingMessage : 'Guardar Producto'}
      </Button>
    </form>
  )
}
