'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OptionGroupEditor, PaymentModesEditor } from '@/components/travel-options-editor'
import { formatARS, formatUSD, slugify } from '@/lib/format'
import type { TravelExperience, TravelItineraryDay, TravelOptionGroup, TravelPaymentMode } from '@/lib/types'

type TravelFormProps = {
  experience?: Partial<TravelExperience>
  mode?: 'create' | 'edit'
}

type FormState = {
  title: string
  slug: string
  short_description: string
  full_description: string
  destination: string
  country: string
  city: string
  category: string
  status: 'available' | 'upcoming' | 'sold_out' | 'finished'
  departure_date: string
  return_date: string
  duration_days: number
  reservation_deadline: string
  available_spots: number
  min_spots: number
  max_spots: number
  price_total: number
  price_reservation: number
  currency: 'ARS' | 'USD'
  show_both_prices: boolean
  image_url: string
  gallery: string[]
  video_url: string
  itinerary: TravelItineraryDay[]
  includes: string[]
  excludes: string[]
  packing_list: string[]
  recommendations: string
  difficulty: string
  language: string
  expected_weather: string
  seo_title: string
  seo_description: string
  seo_slug: string
  share_image_url: string
  optionGroups: TravelOptionGroup[]
  paymentModes: TravelPaymentMode[]
  is_active: boolean
}

const emptyDay = (): TravelItineraryDay => ({
  title: '',
  description: '',
  time: '',
  images: [],
})

function toDateInput(value?: string | null) {
  if (!value) return ''
  return value.slice(0, 10)
}

function initialState(experience?: Partial<TravelExperience>): FormState {
  const firstPlan = experience?.plans?.[0]
  const total = Number(experience?.price_total ?? firstPlan?.price_ars_blue ?? 0)
  const reserve = Number(experience?.price_reservation ?? firstPlan?.precio_reserva_ars ?? 0)

  return {
    title: experience?.title ?? '',
    slug: experience?.slug ?? experience?.id ?? '',
    short_description: experience?.short_description ?? experience?.description ?? '',
    full_description: experience?.full_description ?? experience?.description ?? '',
    destination: experience?.destination ?? experience?.location ?? '',
    country: experience?.country ?? '',
    city: experience?.city ?? '',
    category: experience?.category ?? '',
    status: experience?.status ?? (experience?.is_active === false ? 'finished' : 'available'),
    departure_date: toDateInput(experience?.departure_date),
    return_date: toDateInput(experience?.return_date),
    duration_days: Number(experience?.duration_days ?? 0),
    reservation_deadline: toDateInput(experience?.reservation_deadline),
    available_spots: Number(experience?.available_spots ?? experience?.capacity ?? 0),
    min_spots: Number(experience?.min_spots ?? 1),
    max_spots: Number(experience?.max_spots ?? experience?.capacity ?? 0),
    price_total: total,
    price_reservation: reserve,
    currency: experience?.currency ?? 'ARS',
    show_both_prices: Boolean(experience?.show_both_prices),
    image_url: experience?.image_url ?? '',
    gallery: experience?.gallery ?? [],
    video_url: experience?.video_url ?? '',
    itinerary: experience?.itinerary?.length ? experience.itinerary : [emptyDay()],
    includes: experience?.includes ?? firstPlan?.includes ?? [],
    excludes: experience?.excludes ?? firstPlan?.excludes ?? firstPlan?.not_includes ?? [],
    packing_list: experience?.packing_list ?? [],
    recommendations: experience?.recommendations ?? '',
    difficulty: experience?.difficulty ?? '',
    language: experience?.language ?? '',
    expected_weather: experience?.expected_weather ?? '',
    seo_title: experience?.seo_title ?? '',
    seo_description: experience?.seo_description ?? '',
    seo_slug: experience?.seo_slug ?? experience?.slug ?? '',
    share_image_url: experience?.share_image_url ?? '',
    optionGroups: experience?.optionGroups ?? [],
    paymentModes: experience?.paymentModes ?? [],
    is_active: experience?.is_active ?? true,
  }
}

function splitLines(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function ListEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={values.join('\n')}
        onChange={(event) => onChange(splitLines(event.target.value))}
        rows={5}
        placeholder={placeholder}
      />
      <p className="text-xs text-muted-foreground">Una línea por ítem.</p>
    </div>
  )
}

export function TravelExperienceForm({ experience, mode = experience ? 'edit' : 'create' }: TravelFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>(() => initialState(experience))

  const balanceDue = Math.max(0, Number(form.price_total || 0) - Number(form.price_reservation || 0))
  const readableTotal = form.currency === 'USD' ? formatUSD(form.price_total) : formatARS(form.price_total)
  const readableReserve = form.currency === 'USD' ? formatUSD(form.price_reservation) : formatARS(form.price_reservation)
  const readableBalance = form.currency === 'USD' ? formatUSD(balanceDue) : formatARS(balanceDue)

  const computedDuration = useMemo(() => {
    if (!form.departure_date || !form.return_date) return 0
    const start = new Date(`${form.departure_date}T00:00:00`)
    const end = new Date(`${form.return_date}T00:00:00`)
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
    return Number.isFinite(diff) && diff > 0 ? diff : 0
  }, [form.departure_date, form.return_date])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const addGalleryImage = () => setField('gallery', [...form.gallery, ''])
  const updateGalleryImage = (index: number, value: string) => {
    setField('gallery', form.gallery.map((item, idx) => (idx === index ? value : item)))
  }

  const removeGalleryImage = (index: number) => {
    setField('gallery', form.gallery.filter((_, idx) => idx !== index))
  }

  const updateDay = (index: number, value: TravelItineraryDay) => {
    setField('itinerary', form.itinerary.map((day, idx) => (idx === index ? value : day)))
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const duration = form.duration_days || computedDuration
      const slug = slugify(form.slug || form.title)
      const emptyToNull = (value: string) => value.trim() || null
      const payload = {
        ...form,
        slug,
        seo_slug: slugify(form.seo_slug || slug),
        duration_days: duration,
        departure_date: emptyToNull(form.departure_date),
        return_date: emptyToNull(form.return_date),
        reservation_deadline: emptyToNull(form.reservation_deadline),
        capacity: form.max_spots || form.available_spots,
        description: form.short_description || form.full_description,
        image_url: emptyToNull(form.image_url),
        video_url: emptyToNull(form.video_url),
        share_image_url: emptyToNull(form.share_image_url),
        gallery: form.gallery.filter(Boolean),
        itinerary: form.itinerary.filter((day) => day.title || day.description),
        optionGroups: form.optionGroups,
        paymentModes: form.paymentModes,
        plans: [
          {
            id: 'base',
            name: 'Reserva',
            description: form.short_description,
            price_usd: form.currency === 'USD' ? form.price_total : 0,
            price_ars_blue: form.currency === 'ARS' ? form.price_total : 0,
            precio_reserva_ars: form.price_reservation,
            includes: form.includes,
            excludes: form.excludes,
            not_includes: form.excludes,
          },
        ],
      }

      const url =
        mode === 'create'
          ? '/api/admin/travel-experiences'
          : `/api/admin/travel-experiences/${experience?.id}`

      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()

      if (!res.ok) {
        throw new Error(typeof result.error === 'string' ? result.error : 'No se pudo guardar el viaje')
      }

      toast.success(mode === 'create' ? 'Viaje creado' : 'Viaje actualizado')
      router.push('/admin/viajes/experiencias')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo guardar el viaje')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Tabs defaultValue="general" className="gap-6">
        <TabsList className="h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="dates">Fechas y cupos</TabsTrigger>
          <TabsTrigger value="prices">Precios</TabsTrigger>
          <TabsTrigger value="options">Opciones</TabsTrigger>
          <TabsTrigger value="payment">Modalidades de pago</TabsTrigger>
          <TabsTrigger value="media">Galería</TabsTrigger>
          <TabsTrigger value="itinerary">Itinerario</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Información general</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del viaje</Label>
                  <Input value={form.title} onChange={(event) => setField('title', event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(event) => setField('slug', slugify(event.target.value))}
                    placeholder="patagonia-arte-y-naturaleza"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Destino</Label>
                  <Input value={form.destination} onChange={(event) => setField('destination', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>País</Label>
                  <Input value={form.country} onChange={(event) => setField('country', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input value={form.city} onChange={(event) => setField('city', event.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Input value={form.category} onChange={(event) => setField('category', event.target.value)} placeholder="Arte, naturaleza, retiro..." />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={form.status} onValueChange={(value) => setField('status', value as FormState['status'])}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponible</SelectItem>
                      <SelectItem value="upcoming">Próximo</SelectItem>
                      <SelectItem value="sold_out">Agotado</SelectItem>
                      <SelectItem value="finished">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Activo en la web</Label>
                  <Switch checked={form.is_active} onCheckedChange={(value) => setField('is_active', value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción corta</Label>
                <Textarea value={form.short_description} onChange={(event) => setField('short_description', event.target.value)} rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Descripción completa</Label>
                <Textarea
                  value={form.full_description}
                  onChange={(event) => setField('full_description', event.target.value)}
                  rows={9}
                  placeholder="<p>Descripción completa del viaje...</p>"
                />
                <p className="text-xs text-muted-foreground">Acepta texto plano o HTML básico para render enriquecido.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dates">
          <Card>
            <CardHeader>
              <CardTitle>Fechas y cupos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de salida</Label>
                  <Input type="date" value={form.departure_date} onChange={(event) => setField('departure_date', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de regreso</Label>
                  <Input type="date" value={form.return_date} onChange={(event) => setField('return_date', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Duración</Label>
                  <Input
                    type="number"
                    value={form.duration_days || computedDuration}
                    onChange={(event) => setField('duration_days', Number(event.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Límite para reservar</Label>
                  <Input type="date" value={form.reservation_deadline} onChange={(event) => setField('reservation_deadline', event.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cupos disponibles</Label>
                  <Input type="number" value={form.available_spots} onChange={(event) => setField('available_spots', Number(event.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Cupos mínimos</Label>
                  <Input type="number" value={form.min_spots} onChange={(event) => setField('min_spots', Number(event.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Cupos máximos</Label>
                  <Input type="number" value={form.max_spots} onChange={(event) => setField('max_spots', Number(event.target.value))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices">
          <Card>
            <CardHeader>
              <CardTitle>Precios y pagos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Moneda</Label>
                  <Select value={form.currency} onValueChange={(value) => setField('currency', value as FormState['currency'])}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ARS">ARS</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Precio total</Label>
                  <Input type="number" value={form.price_total} onChange={(event) => setField('price_total', Number(event.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Precio de reserva</Label>
                  <Input type="number" value={form.price_reservation} onChange={(event) => setField('price_reservation', Number(event.target.value))} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Mostrar ambos precios</Label>
                  <Switch checked={form.show_both_prices} onCheckedChange={(value) => setField('show_both_prices', value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-semibold tabular-nums">{readableTotal}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Reserva</p>
                  <p className="text-xl font-semibold tabular-nums">{readableReserve}</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Saldo pendiente</p>
                  <p className="text-xl font-semibold tabular-nums">{readableBalance}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="options">
          <Card>
            <CardHeader>
              <CardTitle>Opciones personalizadas</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Configura categorías de opciones que los clientes pueden seleccionar durante la reserva. 
                El precio de cada opción se sumará al total del viaje.
              </p>
            </CardHeader>
            <CardContent>
              <OptionGroupEditor
                groups={form.optionGroups}
                onChange={(groups) => setField('optionGroups', groups)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Modalidades de pago</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Define las formas de pago disponibles para los clientes. 
                Ej: Pago único (con descuento), Reserva + cuotas, etc.
              </p>
            </CardHeader>
            <CardContent>
              <PaymentModesEditor
                modes={form.paymentModes}
                onChange={(modes) => setField('paymentModes', modes)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Galería</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Imagen principal</Label>
                <Input value={form.image_url} onChange={(event) => setField('image_url', event.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Video opcional</Label>
                <Input value={form.video_url} onChange={(event) => setField('video_url', event.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Imágenes adicionales</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addGalleryImage}>
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar
                  </Button>
                </div>
                {form.gallery.map((image, index) => (
                  <div key={index} className="flex gap-2">
                    <Input value={image} onChange={(event) => updateGalleryImage(index, event.target.value)} placeholder="https://..." />
                    <Button type="button" size="icon" variant="ghost" onClick={() => removeGalleryImage(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="itinerary">
          <Card>
            <CardHeader>
              <CardTitle>Itinerario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.itinerary.map((day, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Día {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setField('itinerary', form.itinerary.filter((_, idx) => idx !== index))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      value={day.title}
                      onChange={(event) => updateDay(index, { ...day, title: event.target.value })}
                      placeholder="Título"
                    />
                    <Input
                      value={day.time ?? ''}
                      onChange={(event) => updateDay(index, { ...day, time: event.target.value })}
                      placeholder="Horario opcional"
                    />
                    <Input
                      value={(day.images ?? []).join(', ')}
                      onChange={(event) => updateDay(index, { ...day, images: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
                      placeholder="Imágenes separadas por coma"
                    />
                  </div>
                  <Textarea
                    value={day.description}
                    onChange={(event) => updateDay(index, { ...day, description: event.target.value })}
                    rows={3}
                    placeholder="Descripción del día"
                  />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setField('itinerary', [...form.itinerary, emptyDay()])}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar día
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Servicios e información adicional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ListEditor label="Incluye" values={form.includes} onChange={(values) => setField('includes', values)} placeholder={'Transporte\nHotel\nDesayuno'} />
                <ListEditor label="No incluye" values={form.excludes} onChange={(values) => setField('excludes', values)} placeholder={'Pasajes aéreos\nSeguro\nAlmuerzos'} />
              </div>
              <ListEditor label="Qué llevar" values={form.packing_list} onChange={(values) => setField('packing_list', values)} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Nivel de dificultad</Label>
                  <Input value={form.difficulty} onChange={(event) => setField('difficulty', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <Input value={form.language} onChange={(event) => setField('language', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Clima esperado</Label>
                  <Input value={form.expected_weather} onChange={(event) => setField('expected_weather', event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Recomendaciones</Label>
                <Textarea value={form.recommendations} onChange={(event) => setField('recommendations', event.target.value)} rows={4} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Meta título</Label>
                  <Input value={form.seo_title} onChange={(event) => setField('seo_title', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>URL amigable</Label>
                  <Input value={form.seo_slug} onChange={(event) => setField('seo_slug', slugify(event.target.value))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Meta descripción</Label>
                <Textarea value={form.seo_description} onChange={(event) => setField('seo_description', event.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Imagen para compartir</Label>
                <Input value={form.share_image_url} onChange={(event) => setField('share_image_url', event.target.value)} placeholder="https://..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-4 z-20 rounded-lg border bg-background/95 p-4 shadow-lg backdrop-blur flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          Reserva: <span className="font-medium text-foreground">{readableReserve}</span>
          <span className="mx-2">·</span>
          Saldo pendiente: <span className="font-medium text-foreground">{readableBalance}</span>
        </div>
        <Button type="submit" disabled={loading || !form.title || !form.slug}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Guardando...' : mode === 'create' ? 'Crear viaje' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
