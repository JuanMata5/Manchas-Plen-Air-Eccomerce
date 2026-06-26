import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { TravelExperienceForm } from '@/components/TravelExperienceForm'
import { Button } from '@/components/ui/button'

interface EditTravelExperiencePageProps {
  params: Promise<{ id: string }>
}

export const metadata = {
  title: 'Editar Viaje | Plen Air Admin',
  description: 'Editar información del viaje',
}

export default async function EditTravelExperiencePage({ params }: EditTravelExperiencePageProps) {
  const { id } = await params
  const adminDb = createAdminClient()

  const { data: experience } = await adminDb
    .from('travel_experiences')
    .select('*')
    .eq('id', id)
    .single()

  if (!experience) {
    notFound()
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-foreground">Editar viaje</h1>
          <p className="text-muted-foreground text-sm mt-1">Actualiza el paquete turístico, precios y contenido público.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/viajes/experiencias">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <TravelExperienceForm experience={experience} mode="edit" />
    </div>
  )
}
