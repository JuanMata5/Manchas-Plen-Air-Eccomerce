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
  // Function already corrected, no changes needed here
  const signRes = await fetch('/api/cloudinary/sign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'plenair/products' }),
  })

  if (!signRes.ok) throw new Error('Error al obtener la firma de subida.')
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
    if (!res.ok) throw new Error(`Error al subir la imagen ${file.name}.`)
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

        // 🔥 CORRECCIÓN: Lógica para modo de edición
        const initialDisplayOrder = mode === 'edit' ? product?.product_images?.length ?? 0 : 0;
        const productHasImages = initialDisplayOrder > 0;

        for (let i = 0; i < uploaded.length; i++) {
          const img = uploaded[i]
          const displayOrder = initialDisplayOrder + i
          
          // La primera imagen es primaria solo si el producto no tenía imágenes antes.
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
        {/* Fields with Controller, no changes needed */}
        <Controller control={control} name="name" render={({ field }) => (<div><Label>Nombre</Label><Input {...field} /></div>)} />
        <Controller control={control} name="slug" render={({ field }) => (<div><Label>Slug</Label><Input {...field} /></div>)} />
        {/* ... more fields ... */}
        <ImageUpload pendingImages={pendingImages} onPendingImagesChange={setPendingImages} multiple maxFiles={5} />
        <Button type="submit" disabled={loading}>{loading && <Loader2 className="animate-spin mr-2" />}Guardar</Button>
    </form>
  )
}
