import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CheckoutForm } from '@/components/checkout-form'

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="font-serif font-bold text-3xl md:text-4xl text-foreground mb-8">
          Finalizar compra
        </h1>
        <CheckoutForm />
      </main>
      <Footer />
    </>
  )
}
