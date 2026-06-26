import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Plus } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatARS, formatUSD } from '@/lib/format'
import { TravelExperienceActions } from '@/components/admin/travel-experience-actions'

type TravelExperienceSummary = {
  id: string
  slug: string | null
  title: string
  destination: string | null
  location: string
  category: string | null
  status: 'available' | 'upcoming' | 'sold_out' | 'finished'
  departure_date: string | null
  return_date: string | null
  available_spots: number | null
  capacity: number
  price_total: number | null
  price_reservation: number | null
  currency: 'ARS' | 'USD'
  image_url: string | null
  is_active: boolean
  created_at: string
}

const statusLabels = {
  available: { label: 'Disponible', className: 'bg-emerald-100 text-emerald-800 border-0' },
  upcoming: { label: 'Próximo', className: 'bg-blue-100 text-blue-800 border-0' },
  sold_out: { label: 'Agotado', className: 'bg-amber-100 text-amber-800 border-0' },
  finished: { label: 'Finalizado', className: 'bg-muted text-muted-foreground border-0' },
}

async function getTravelExperiences() {
  const adminDb = createAdminClient()
  const { data } = await adminDb
    .from('travel_experiences')
    .select('id, slug, title, destination, location, category, status, departure_date, return_date, available_spots, capacity, price_total, price_reservation, currency, image_url, is_active, created_at')
    .order('created_at', { ascending: false })

  return (data ?? []) as TravelExperienceSummary[]
}

function formatMoney(amount: number | null, currency: 'ARS' | 'USD') {
  if (!amount) return 'Sin precio'
  return currency === 'USD' ? formatUSD(amount) : formatARS(amount)
}

export default async function AdminTravelExperiencesPage() {
  const experiences = await getTravelExperiences()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-foreground">Viajes</h1>
          <p className="text-muted-foreground text-sm mt-1">{experiences.length} paquetes turísticos registrados.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/viajes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/viajes/experiencias/nuevo">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo viaje
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Viaje</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Destino</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Salida</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cupos</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Reserva</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {experiences.map((experience) => {
                const status = statusLabels[experience.status ?? 'available']
                return (
                  <tr key={experience.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 min-w-[260px]">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                          {experience.image_url ? (
                            <Image src={experience.image_url} alt={experience.title} fill className="object-cover" sizes="48px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-serif text-muted-foreground">VJ</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{experience.title}</p>
                          <p className="text-xs text-muted-foreground font-mono truncate">{experience.slug || experience.id}</p>
                          {experience.category && <p className="text-xs text-muted-foreground truncate">{experience.category}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{experience.destination || experience.location}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {experience.departure_date ? new Date(`${experience.departure_date}T00:00:00`).toLocaleDateString('es-AR') : 'A confirmar'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium tabular-nums">{experience.available_spots ?? experience.capacity}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium tabular-nums">{formatMoney(experience.price_reservation, experience.currency)}</div>
                      <div className="text-xs text-muted-foreground">Total {formatMoney(experience.price_total, experience.currency)}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge className={status.className}>{status.label}</Badge>
                        <Badge variant={experience.is_active ? 'default' : 'secondary'} className="text-xs">
                          {experience.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <TravelExperienceActions id={experience.id} isActive={experience.is_active} />
                    </td>
                  </tr>
                )
              })}
              {experiences.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    No hay viajes registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
