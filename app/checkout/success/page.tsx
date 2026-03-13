import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { ClearCartOnMount } from '@/components/clear-cart'

interface PageProps {
  searchParams: Promise<{ order_id?: string }>
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { order_id } = await searchParams

  return (
    <>
      <ClearCartOnMount />
      <Navbar />
      <main className="max-w-lg mx-auto px-4 py-20 flex flex-col items-center text-center gap-6">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-serif font-bold text-3xl text-foreground">
          Pago exitoso
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Tu pago fue procesado correctamente. En breve recibirás un email con tus entradas y
          los detalles de tu compra.
        </p>
        {order_id && (
          <p className="text-sm text-muted-foreground bg-muted px-4 py-2 rounded-lg font-mono">
            Orden: {order_id}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Button asChild>
            <Link href="/cuenta/mis-ordenes">Ver mis ordenes</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/tienda">Seguir comprando</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  )
}
