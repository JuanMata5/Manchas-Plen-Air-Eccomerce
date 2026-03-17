'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
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
  // Get signed upload params
  const signRes = await fetch('/api/cloudinary/sign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'plenair/products' }),
  })

  if (!signRes.ok) throw new Error('Error al obtener firma de subida')
  const signData = await signRes.json()

  const results = []
  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('api_key', signData.api_key)
    formData.append('timestamp', String(signData.timestamp))
    formData.append('signature', signData.signature)
    formData.append('folder', signData.folder)
    formData.append('eager', signData.eager)
    formData.append('eager_async', String(signData.eager_async))
    if (signData.upload_preset) {
      formData.append('upload_preset', signData.upload_preset)
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloud_name}/image/upload`,
      { method: 'POST', body: formData },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Cloudinary error:', errorData)
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
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      is_active: true,
      is_featured: false,
      product_type: 'merchandise',
      max_per_order: 1,
    },
  })

  const productType = watch('product_type')

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/admin/products/${product?.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar producto')
      }

      toast.success('Producto eliminado exitosamente')
      router.push('/admin/productos')
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al eliminar')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true)
      setLoadingMessage('Guardando producto...')

      // Auto-generate slug from name if creating
      let finalSlug = data.slug
      if (mode === 'create' && !data.slug) {
        finalSlug = data.name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      }

      const payload = {
        ...data,
        slug: finalSlug,
      }

      const url =
        mode === 'create'
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

      // Upload pending images to Cloudinary then save to DB
      if (pendingImages.length > 0) {
        setLoadingMessage(`Subiendo ${pendingImages.length} imagen(es)...`)

        const files = pendingImages.map((p) => p.file)
        const uploaded = await uploadImagesToCloudinary(files)

        setLoadingMessage('Guardando imágenes...')

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
              is_primary: i === 0,
              display_order: i,
            }),
          })
        }
      }

      toast.success(
        mode === 'create'
          ? 'Producto creado exitosamente'
          : 'Producto actualizado exitosamente',
      )

      if (mode === 'create') {
        router.push(`/admin/productos/${savedProduct.id}`)
      } else {
        router.push('/admin/productos')
      }
      router.refresh()
    } catch (error) {
      console.error('Form error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al guardar')
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div>
          <Label htmlFor="name">Nombre del producto *</Label>
          <Input
            id="name"
            placeholder="Ej: Entrada General 2025"
            {...register('name')}'''
            disabled={loading}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        {/* Slug */}
        <div>
          <Label htmlFor="slug">URL Slug (auto-generado) *</Label>
          <Input
            id="slug"
            placeholder="entrada-general-2025"
            {...register('slug')}'''
            disabled={loading}
          />
          {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>}
        </div>
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          placeholder="Descripción detallada del producto..."
          rows={4}
          {...register('description')}'''
          disabled={loading}
        />
      </div>

      {/* Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category_id">Categoría *</Label>
          <Select
            onValueChange={(value) => setValue('category_id', value || null)}
            defaultValue={product?.category_id || ''}
          >
            <SelectTrigger disabled={loading}>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category_id && (
            <p className="text-red-500 text-sm mt-1">{errors.category_id.message}</p>
          )}
        </div>

        {/* Product Type */}
        <div>
          <Label htmlFor="product_type">Tipo de Producto *</Label>
          <Select
            onValueChange={(value) => setValue('product_type', value as any)}
            defaultValue={product?.product_type || 'merchandise'}
          >
            <SelectTrigger disabled={loading}>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ticket">Entrada/Ticket</SelectItem>
              <SelectItem value="workshop">Taller/Workshop</SelectItem>
              <SelectItem value="merchandise">Merchandising</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price_ars">Precio ARS *</Label>
          <Input
            id="price_ars"
            type="number"
            step="100"
            placeholder="15000"
            {...register('price_ars')}'''
            disabled={loading}
          />
          {errors.price_ars && (
            <p className="text-red-500 text-sm mt-1">{errors.price_ars.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="price_usd">Precio USD</Label>
          <Input
            id="price_usd"
            type="number"
            step="0.01"
            placeholder="15"
            {...register('price_usd')}'''
            disabled={loading}
          />
        </div>
      </div>

      {/* Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="stock">Stock *</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            placeholder="100"
            {...register('stock')}'''
            disabled={loading}
          />
          {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>}
        </div>

        <div>
          <Label htmlFor="max_per_order">Máximo por orden *</Label>
          <Input
            id="max_per_order"
            type="number"
            min="1"
            placeholder="5"
            {...register('max_per_order')}'''
            disabled={loading}
          />
          {errors.max_per_order && (
            <p className="text-red-500 text-sm mt-1">{errors.max_per_order.message}</p>
          )}
        </div>
      </div>

      {/* Event date/location (conditionally for tickets) */}
      {(productType === 'ticket' || productType === 'workshop') && (
        <div className="bg-blue-500/10 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event_date">Fecha del evento</Label>
              <Input
                id="event_date"
                type="date"
                {...register('event_date')}'''
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="event_location">Ubicación del evento</Label>
              <Input
                id="event_location"
                placeholder="Ej: Parque Los Andes, Buenos Aires"
                {...register('event_location')}'''
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Upload */}
      <div className="border-t pt-6">
        <h3 className="font-semibold mb-4">Imágenes del Producto</h3>
        <ImageUpload
          pendingImages={pendingImages}
          onPendingImagesChange={setPendingImages}
          multiple={true}
          maxFiles={5}
        />
      </div>

      {/* Toggles */}
      <div className="border-t pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="is_active">Producto Activo</Label>
            <p className="text-sm text-muted-foreground">Mostrar en tienda</p>
          </div>
          <Switch {...register('is_active')}''' disabled={loading} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="is_featured">Producto Destacado</Label>
            <p className="text-sm text-muted-foreground">Mostrar en inicio</p>
          </div>
          <Switch {...register('is_featured')}''' disabled={loading} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-between border-t pt-6">
        <div>
          {mode === 'edit' && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={loading || deleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Producto
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading && loadingMessage
              ? loadingMessage
              : mode === 'create'
                ? 'Crear Producto'
                : 'Guardar Cambios'}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán el producto y todas sus imágenes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-red-500/10 p-3 rounded text-sm text-red-800">
            <strong>{product?.name}</strong> será eliminado permanentemente.
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
