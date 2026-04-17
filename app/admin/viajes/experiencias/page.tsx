import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Edit3 } from 'lucide-react'

type TravelExperienceSummary = {
  id: string
  title: string
  location: string
  dates: string
  capacity: number
  is_active: boolean
  created_at: string
}

async function getTravelExperiences() {
  const adminDb = createAdminClient()
  const { data } = await adminDb
    .from('travel_experiences')
    .select('id, title, location, dates, capacity, is_active, created_at')
    .order('created_at', { ascending: false })
  return (data ?? []) as TravelExperienceSummary[]
}

export default async function AdminTravelExperiencesPage() {
  const experiences = await getTravelExperiences()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-foreground">Viajes</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona y modifica los viajes disponibles.</p>
        </div>
        <Button asChild>
          <Link href="/admin/viajes/experiencias">Recargar</Link>
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Título</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Ubicación</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Fechas</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Cupos</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {experiences.map((experience) => (
                <tr key={experience.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{experience.title}</td>
                  <td className="px-5 py-3 text-muted-foreground">{experience.location}</td>
                  <td className="px-5 py-3 text-muted-foreground">{experience.dates}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{experience.capacity}</td>
                  <td className="px-5 py-3">
                    <Badge variant={experience.is_active ? 'default' : 'secondary'} className="text-xs">
                      {experience.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/viajes/experiencias/${experience.id}`}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {experiences.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
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
