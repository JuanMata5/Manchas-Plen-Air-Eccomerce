import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CartView } from '@/components/cart-view'

export default function CarritoPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-serif font-bold text-3xl md:text-4xl text-foreground mb-8">
          Tu carrito
        </h1>
        <CartView />
      </main>
      <Footer />
    </>
  )
}
