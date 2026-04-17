import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { TravelExperienceForm } from '@/components/TravelExperienceForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Editar Viaje</h1>
        <p className="text-gray-500 mt-2">Actualiza los datos principales de la experiencia.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Viaje</CardTitle>
        </CardHeader>
        <CardContent>
          <TravelExperienceForm experience={experience} />
        </CardContent>
      </Card>
    </div>
  )
}
