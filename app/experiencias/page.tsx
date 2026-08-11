import { redirect } from 'next/navigation'

export default function ExperienciasPage() {
  // Redirect to the travel-first storefront section
  redirect('/tienda?categoria=viajes')
}

