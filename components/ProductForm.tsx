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

  category_id: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().uuid('Selecciona una categoría').nullable()
  ),

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

  stock: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.coerce.number({
      invalid_type_error: 'Stock debe ser un número',
      required_error: 'Stock es requerido',
    }).int().min(0, 'Stock debe ser ≥ 0')
  ),

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

export function ProductForm({ product, categories, mode }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      ...product,
      is_active: product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
      product_type: product?.product_type ?? 'merchandise',
      stock: product?.stock ?? 0,
      max_per_order: product?.max_per_order ?? 1,
    },
  })

  const productType = watch('product_type')

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true)

      const response = await fetch(
        mode === 'create'
          ? '/api/admin/products/create'
          : `/api/admin/products/${product?.id}`,
        {
          method: mode === 'create' ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) throw new Error('Error al guardar producto')

      toast.success('Producto guardado')
      router.push('/admin/productos')
      router.refresh()
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Nombre</Label>
          <Input {...register('name')} />
          {errors.name && <p className="text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <Label>Slug</Label>
          <Input {...register('slug')} />
        </div>
      </div>

      <div>
        <Label>Descripción</Label>
        <Textarea {...register('description')} />
      </div>

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
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />

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

      {/* SWITCHES */}
      <div className="flex justify-between">
        <Label>Activo</Label>
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <div className="flex justify-between">
        <Label>Destacado</Label>
        <Controller
          control={control}
          name="is_featured"
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="animate-spin mr-2" />}
        Guardar
      </Button>
    </form>
  )
}