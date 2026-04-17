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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import type { TravelExperience } from '@/lib/types'

const travelExperienceSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  location: z.string().min(3, 'La ubicación debe tener al menos 3 caracteres'),
  dates: z.string().min(3, 'Las fechas deben tener al menos 3 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  capacity: z.coerce.number().int().min(1, 'La capacidad debe ser al menos 1'),
  image_url: z.string().url('Debe ser una URL válida').optional().nullable(),
  is_active: z.boolean().optional(),
})

type TravelExperienceFormData = z.infer<typeof travelExperienceSchema>

interface TravelExperienceFormProps {
  experience: TravelExperience
}

export function TravelExperienceForm({ experience }: TravelExperienceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { handleSubmit, control } = useForm<TravelExperienceFormData>({
    resolver: zodResolver(travelExperienceSchema),
    defaultValues: {
      title: experience.title,
      location: experience.location,
      dates: experience.dates,
      description: experience.description,
      capacity: experience.capacity,
      image_url: experience.image_url || '',
      is_active: experience.is_active,
    },
  })

  const onSubmit = async (data: TravelExperienceFormData) => {
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/travel-experiences/${experience.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()
      if (!res.ok) {
        throw new Error(result.error || 'Error al actualizar el viaje')
      }

      toast.success('Viaje actualizado con éxito')
      router.push('/admin/viajes/experiencias')
    } catch (error: any) {
      toast.error(error.message || 'No se pudo actualizar el viaje')
      console.error('[TravelExperienceForm]', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Controller
        control={control}
        name="title"
        render={({ field, fieldState }) => (
          <div>
            <Label>Nombre del viaje</Label>
            <Input {...field} />
            {fieldState.error?.message && (
              <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          control={control}
          name="location"
          render={({ field, fieldState }) => (
            <div>
              <Label>Ubicación</Label>
              <Input {...field} />
              {fieldState.error?.message && (
                <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
        <Controller
          control={control}
          name="dates"
          render={({ field, fieldState }) => (
            <div>
              <Label>Fechas</Label>
              <Input {...field} />
              {fieldState.error?.message && (
                <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      <Controller
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <div>
            <Label>Descripción</Label>
            <Textarea {...field} rows={5} />
            {fieldState.error?.message && (
              <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          control={control}
          name="capacity"
          render={({ field, fieldState }) => (
            <div>
              <Label>Cupos</Label>
              <Input type="number" {...field} />
              {fieldState.error?.message && (
                <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
        <Controller
          control={control}
          name="image_url"
          render={({ field, fieldState }) => (
            <div>
              <Label>URL de imagen</Label>
              <Input {...field} />
              {fieldState.error?.message && (
                <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
              )}
            </div>
          )}
        />
      </div>

      <Controller
        control={control}
        name="is_active"
        render={({ field }) => (
          <div className="flex items-center justify-between gap-4">
            <Label>Activo</Label>
            <Switch checked={field.value} onCheckedChange={field.onChange} />
          </div>
        )}
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </Button>
    </form>
  )
}
