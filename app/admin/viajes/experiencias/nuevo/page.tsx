import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TravelExperienceForm } from '@/components/TravelExperienceForm'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Nuevo Viaje | Plen Air Admin',
  description: 'Crear un nuevo paquete turístico',
}

export default function NewTravelExperiencePage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif font-bold text-2xl text-foreground">Nuevo viaje</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crea un paquete turístico independiente del catálogo de productos.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/viajes/experiencias">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      </div>

      <TravelExperienceForm mode="create" />
    </div>
  )
}
