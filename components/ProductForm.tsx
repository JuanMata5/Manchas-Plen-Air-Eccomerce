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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
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
  event_date: z.string().nullable().optional(),
  event_location: z.string().optional(),
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

  if (!signRes.ok) {
    console.error('[Cloudinary Signature Error]', await signRes.json())
    throw new Error('Error al obtener firma de subida')
  }
  const signData = await signRes.json()

  const results = []
  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', signData.api_key)
    formData.append('timestamp', String(signData.timestamp))
    formData.append('signature', signData.signature)
    formData.append('folder', signData.folder)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`,
      { method: 'POST', body: formData },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Cloudinary Upload Error]', errorData)
      throw new Error(`Error al subir ${file.name}`)
    }

    const data = await response.json()
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
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])

  const {
    control, // Usar control para los componentes Controller
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    // Restaurar defaultValues para asegurar inicialización correcta
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
      event_date: product?.event_date ?? null,
      event_location: product?.event_location ?? '',
    },
  })

  const handleDelete = async () => {
    // Lógica de borrado (sin cambios)
  }

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true)
      setLoadingMessage('Guardando producto...')

      const payload = { ...data }
      const url = mode === 'create'
          ? '/api/admin/products/create'
          : `/api/admin/products/${product?.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar producto')
      }

      const savedProduct = await response.json()

      console.log('IMAGES TO UPLOAD:', pendingImages)

      if (pendingImages.length > 0) {
        setLoadingMessage(`Subiendo ${pendingImages.length} imagen(es)...`)
        const files = pendingImages.map((p) => p.file)
        const uploaded = await uploadImagesToCloudinary(files)
        console.log('CLOUDINARY UPLOAD RESULT:', uploaded)

        setLoadingMessage('Guardando imágenes...')

        for (let i = 0; i < uploaded.length; i++) {
          const img = uploaded[i]
          const uploadImageRes = await fetch('/api/admin/products/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: savedProduct.id,
              cloudinary_public_id: img.publicId,
              url: img.url,
              width: img.width,
              height: img.height,
              is_primary: i === 0,
              display_order: i,
            }),
          })

          if (!uploadImageRes.ok) {
            const errorData = await uploadImageRes.json().catch(() => ({}))
            console.error('[API Upload-Image Error]', errorData)
            throw new Error('Error al guardar una de las imágenes.')
          }
        }
      }

      toast.success(mode === 'create' ? 'Producto creado' : 'Producto actualizado')
      router.push(mode === 'create' ? `/admin/productos/${savedProduct.id}` : '/admin/productos')
      router.refresh()

    } catch (error) {
      console.error('[Product Form Error]', error)
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error')
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre del producto *</Label>
          <Input id="name" {...register('name')} disabled={loading} />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="slug">URL Slug *</Label>
          <Input id="slug" {...register('slug')} disabled={loading} />
          {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" rows={4} {...register('description')} disabled={loading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {/* Restaurar Controller para Select */}
        <Controller
          control={control}
          name="category_id"
          render={({ field }) => (
            <div>
              <Label>Categoría *</Label>
              <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={loading}>
                <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
                <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>}
            </div>
          )}
        />
        <Controller
          control={control}
          name="product_type"
          render={({ field }) => (
             <div>
              <Label>Tipo de Producto *</Label>
              <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticket">Entrada/Ticket</SelectItem>
                  <SelectItem value="workshop">Taller/Workshop</SelectItem>
                  <SelectItem value="merchandise">Merchandising</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price_ars">Precio ARS *</Label>
          <Input id="price_ars" type="number" step="100" {...register('price_ars')} disabled={loading} />
          {errors.price_ars && <p className="text-red-500 text-sm mt-1">{errors.price_ars.message}</p>}
        </div>
        <div>
          <Label htmlFor="price_usd">Precio USD</Label>
          <Input id="price_usd" type="number" step="0.01" {...register('price_usd')} disabled={loading} />
          {errors.price_usd && <p className="text-red-500 text-sm mt-1">{errors.price_usd.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stock">Stock *</Label>
          <Input id="stock" type="number" min="0" {...register('stock')} disabled={loading} />
          {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>}
        </div>
        <div>
          <Label htmlFor="max_per_order">Máximo por orden *</Label>
          <Input id="max_per_order" type="number" min="1" {...register('max_per_order')} disabled={loading} />
          {errors.max_per_order && <p className="text-red-500 text-sm mt-1">{errors.max_per_order.message}</p>}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Imágenes del Producto</h3>
        <ImageUpload
          pendingImages={pendingImages}
          onPendingImagesChange={setPendingImages}
          multiple={true}
          maxFiles={5}
        />
      </div>

      <div className="border-t pt-6 space-y-4">
        {/* Restaurar Controller para Switch */}
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_active">Producto Activo</Label>
                <p className="text-sm text-muted-foreground">Mostrar en tienda</p>
              </div>
              <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
            </div>
          )}
        />
        <Controller
          control={control}
          name="is_featured"
          render={({ field }) => (
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_featured">Producto Destacado</Label>
                <p className="text-sm text-muted-foreground">Mostrar en inicio</p>
              </div>
              <Switch id="is_featured" checked={field.value} onCheckedChange={field.onChange} disabled={loading} />
            </div>
          )}
        />
      </div>

      <div className="flex gap-3 justify-between border-t pt-6">
        <div>
          {mode === 'edit' && (
            <Button type="button" variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={loading || deleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? loadingMessage : (mode === 'create' ? 'Crear Producto' : 'Guardar Cambios')}
          </Button>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        {/* ... (sin cambios) */}
      </AlertDialog>
    </form>
  )
}
