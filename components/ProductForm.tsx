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
  product?: Product
  categories: Category[]
  mode: 'create' | 'edit'
}

async function uploadImagesToCloudinary(files: File[]) {
  const signRes = await fetch('/api/cloudinary/sign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'plenair/products' }),
  })

  // LOG: Verificar estado de la respuesta de la firma
  console.log('SIGN RESPONSE STATUS:', signRes.status)

  if (!signRes.ok) {
    const errorBody = await signRes.json().catch(() => ({}))
    console.error('[Signature Error Body]', errorBody)
    throw new Error('Error al obtener la firma de subida de Cloudinary.')
  }

  const signData = await signRes.json()
  // LOG: Verificar datos de la firma
  console.log('SIGN DATA:', signData)

  const results = []

  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', signData.api_key)
    formData.append('timestamp', String(signData.timestamp))
    formData.append('signature', signData.signature)
    formData.append('folder', signData.folder)
    if (signData.upload_preset) {
        formData.append('upload_preset', signData.upload_preset);
    }

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`,
      { method: 'POST', body: formData }
    )

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('[Cloudinary Upload Error]', errorData)
      throw new Error(`Error al subir la imagen ${file.name} a Cloudinary.`)
    }

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
  const [loadingMessage, setLoadingMessage] = useState('')
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])

  const { handleSubmit, control, register } = useForm<ProductFormData>({
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
      setLoadingMessage('Guardando producto...')

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

      if (!res.ok) {
          const errorBody = await res.json().catch(() => ({}))
          console.error('[Product Save Error]', errorBody)
          throw new Error('Error al guardar el producto.')
      }

      const savedProduct = await res.json()

      // LOG: Verificar imágenes pendientes antes de subir
      console.log('IMAGES TO UPLOAD:', pendingImages)

      if (pendingImages.length > 0) {
        setLoadingMessage(`Subiendo ${pendingImages.length} imagen(es)...`)
        const files = pendingImages.map(p => p.file)
        const uploaded = await uploadImagesToCloudinary(files)

        // LOG: Verificar resultado de la subida a Cloudinary
        console.log('CLOUDINARY UPLOAD RESULT:', uploaded)

        setLoadingMessage('Guardando imágenes en la base de datos...')

        for (let i = 0; i < uploaded.length; i++) {
          const img = uploaded[i]
          // LOG: Verificar datos de la imagen a guardar en la DB
          console.log('SAVING IMAGE:', img)

          const uploadImageRes = await fetch('/api/admin/products/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: savedProduct.id,
              cloudinary_public_id: img.publicId,
              url: img.url,
              width: img.width,
              height: img.height,
              is_primary: i === 0, // La primera imagen es la principal
              display_order: i,
            }),
          })
          
          // LOG: Verificar estado de la respuesta al guardar en DB
          console.log('UPLOAD IMAGE STATUS:', uploadImageRes.status)

          if (!uploadImageRes.ok) {
            const errorBody = await uploadImageRes.json().catch(() => ({}))
            console.error('[DB Save Error Body]', errorBody)
            throw new Error('Error al guardar la referencia de la imagen en la base de datos.')
          }
        }
      }

      toast.success('Producto guardado exitosamente')
      router.push('/admin/productos')
      router.refresh()
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error desconocido.'
        console.error('[Submit Error]', errorMessage)
        toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
