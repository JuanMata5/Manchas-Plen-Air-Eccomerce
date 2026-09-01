import { z } from 'zod'
import { slugify } from '@/lib/format'

const BLUE_DOLLAR_RATE = 1100

const itineraryDaySchema = z.object({
  title: z.string().optional().default(''),
  description: z.string().optional().default(''),
  time: z.string().optional().default(''),
  images: z.array(z.string()).optional().default([]),
})

const travelOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceModifier: z.coerce.number().default(0),
  description: z.string().optional(),
})

const travelOptionGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['accommodation', 'transport', 'companion', 'discount', 'optional', 'payment']),
  description: z.string().optional(),
  type: z.enum(['radio', 'checkbox', 'select']),
  maxOptions: z.coerce.number().int().min(1).optional(),
  options: z.array(travelOptionSchema),
  isRequired: z.boolean().default(false),
})

const travelPaymentModeSchema = z.object({
  id: z.string(),
  name: z.string(),
  priceModifier: z.coerce.number().default(0),
  description: z.string().optional(),
  installments: z.coerce.number().int().optional(),
  installmentRate: z.coerce.number().optional(),
})

const planSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional().default('Plan base'),
  description: z.string().optional().default(''),
  price_usd: z.coerce.number().min(0).optional().default(0),
  price_ars_blue: z.coerce.number().min(0).optional().default(0),
  precio_reserva_ars: z.coerce.number().min(0).optional().nullable(),
  includes: z.array(z.string()).optional().default([]),
  excludes: z.array(z.string()).optional().default([]),
  not_includes: z.array(z.string()).optional().default([]),
})

export const travelExperienceSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
  short_description: z.string().optional().nullable(),
  full_description: z.string().optional().nullable(),
  description: z.string().optional(),
  destination: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  status: z.enum(['available', 'upcoming', 'sold_out', 'finished']).default('available'),
  departure_date: z.string().optional().nullable(),
  return_date: z.string().optional().nullable(),
  duration_days: z.coerce.number().int().min(0).optional().nullable(),
  reservation_deadline: z.string().optional().nullable(),
  available_spots: z.coerce.number().int().min(0).optional().nullable(),
  min_spots: z.coerce.number().int().min(0).optional().nullable(),
  max_spots: z.coerce.number().int().min(0).optional().nullable(),
  capacity: z.coerce.number().int().min(0).optional(),
  price_total: z.coerce.number().min(0),
  price_reservation: z.coerce.number().min(0),
  currency: z.enum(['ARS', 'USD']).default('ARS'),
  show_both_prices: z.boolean().default(false),
  image_url: z.string().optional().nullable(),
  gallery: z.array(z.string()).default([]),
  video_url: z.string().optional().nullable(),
  itinerary: z.array(itineraryDaySchema).default([]),
  includes: z.array(z.string()).default([]),
  excludes: z.array(z.string()).default([]),
  packing_list: z.array(z.string()).default([]),
  recommendations: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  expected_weather: z.string().optional().nullable(),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  seo_slug: z.string().optional().nullable(),
  share_image_url: z.string().optional().nullable(),
  plans: z.array(planSchema).default([]),
  optionGroups: z.array(travelOptionGroupSchema).default([]),
  paymentModes: z.array(travelPaymentModeSchema).default([]),
  is_active: z.boolean().default(true),
})

export async function generateUniqueTravelSlug(baseSlug: string, adminDb: any, currentId?: string) {
  const cleanBase = slugify(baseSlug) || `viaje-${Date.now()}`
  let candidate = cleanBase
  let counter = 1

  while (true) {
    const { data, error } = await adminDb
      .from('travel_experiences')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error) throw error
    if (!data || data.id === currentId) return candidate

    candidate = `${cleanBase}-${counter}`
    counter += 1
  }
}

export function getOptionGroupModifier(
  group: { category?: string; options: { id: string; priceModifier?: number; name?: string }[] },
  selectedValue: string | string[] | undefined,
  basePrice: number,
) {
  if (!selectedValue || !group?.options?.length) return 0

  const selectedIds = Array.isArray(selectedValue) ? selectedValue : [selectedValue]
  let modifier = 0

  for (const optionId of selectedIds) {
    const option = group.options.find((item) => item.id === optionId)
    if (!option) continue

    const percentValue = Number(option.priceModifier ?? 0)
    if (group.category === 'discount' && percentValue !== 0) {
      modifier -= basePrice * (percentValue / 100)
      continue
    }

    modifier += Number(option.priceModifier ?? 0)
  }

  return modifier
}

export function buildTravelPayload(data: z.infer<typeof travelExperienceSchema>, slug: string) {
  const destination = data.destination || [data.city, data.country].filter(Boolean).join(', ') || data.title
  const dateLabel = [data.departure_date, data.return_date].filter(Boolean).join(' al ')
  const capacity = data.capacity ?? data.available_spots ?? data.max_spots ?? 0

  const toBlueDollarArs = (value: number | string | null | undefined) => {
    const numericValue = Number(value ?? 0)
    return Number.isFinite(numericValue) ? Math.round(numericValue * BLUE_DOLLAR_RATE) : 0
  }

  const priceTotalArs = data.currency === 'USD'
    ? toBlueDollarArs(data.price_total)
    : Number(data.price_total || 0)

  const priceReservationArs = data.currency === 'USD'
    ? toBlueDollarArs(data.price_reservation)
    : Number(data.price_reservation || 0)

  const basePlan = {
    id: 'base',
    name: 'Reserva',
    price_usd: data.currency === 'USD' ? Number(data.price_total || 0) : 0,
    price_ars_blue: priceTotalArs,
    precio_reserva_ars: priceReservationArs,
    includes: data.includes,
    excludes: data.excludes,
    not_includes: data.excludes,
    description: data.short_description || '',
  }

  const plans = data.plans.length > 0 ? data.plans : [basePlan]

  return {
    ...data,
    slug,
    title: data.title,
    location: destination,
    dates: dateLabel || (data.duration_days ? `${data.duration_days} dias` : 'Fechas a confirmar'),
    description: data.short_description || data.full_description || data.description || data.title,
    full_description: data.full_description || data.description || data.short_description || '',
    short_description: data.short_description || data.description || '',
    destination,
    price_total: priceTotalArs,
    price_reservation: priceReservationArs,
    capacity,
    available_spots: data.available_spots ?? capacity,
    max_spots: data.max_spots ?? capacity,
    image_url: data.image_url || null,
    gallery: data.gallery,
    plans: plans.map((plan) => {
      const usdValue = Number(plan.price_usd ?? 0)
      const arsValue = data.currency === 'USD'
        ? (typeof plan.price_ars_blue === 'number' && plan.price_ars_blue > 0
          ? plan.price_ars_blue
          : toBlueDollarArs(usdValue))
        : Number(plan.price_ars_blue ?? 0)

      const reservationArsValue = data.currency === 'USD'
        ? (typeof plan.precio_reserva_ars === 'number' && plan.precio_reserva_ars > 0
          ? plan.precio_reserva_ars
          : toBlueDollarArs(Number(plan.price_usd ?? 0)))
        : Number(plan.precio_reserva_ars ?? 0)

      return {
        ...plan,
        price_usd: data.currency === 'USD' ? usdValue : 0,
        price_ars_blue: arsValue,
        precio_reserva_ars: reservationArsValue,
      }
    }),
  }
}
