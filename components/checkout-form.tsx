'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CreditCard, Building2, ShoppingBag, Loader2, Gift } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useCartStore } from '@/lib/cart-store'
import { formatARS } from '@/lib/format'
import { useUser } from '@/components/user-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Empty } from '@/components/ui/empty'
import { cn } from '@/lib/utils'

const checkoutSchema = z.object({
  buyer_email: z.string().email(),
  buyer_dni: z.string().min(7, 'DNI obligatorio').max(10, 'DNI inválido'),
  coupon_code: z.string().optional(),
  payment_method: z.enum(['mercadopago', 'transfer']),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

const paymentMethods = [
  { id: 'mercadopago' as const, label: 'Mercado Pago', description: 'Tarjeta de credito, debito, dinero en cuenta', icon: CreditCard },
  { id: 'transfer' as const, label: 'Transferencia bancaria', description: 'CBU / Alias. Te enviamos los datos por email.', icon: Building2 },
]

const FIRST_PURCHASE_DISCOUNT_PERCENTAGE = 5

export function CheckoutForm() {
  const router = useRouter()
  const { user, isLoading: isUserLoading } = useUser()
  const { items, totalARS, clearCart } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [manualCoupon, setManualCoupon] = useState<any | null>(null)
  const [isFirstPurchase, setIsFirstPurchase] = useState(false)

  useEffect(() => {
    async function checkFirstPurchase() {
      if (!user) return
      try {
        const res = await fetch('/api/orders/check-first-purchase')
        const data = await res.json()
        setIsFirstPurchase(data.is_first_purchase)
      } catch (err) {
        console.error('Error checking first purchase:', err)
      }
    }
    checkFirstPurchase()
  }, [user])

  const { register, handleSubmit, watch, setValue } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { payment_method: 'mercadopago', buyer_dni: '' },
  })

  useEffect(() => {
    if (user?.email) {
      setValue('buyer_email', user.email)
    }
  }, [user, setValue])

  const paymentMethod = watch('payment_method')
  const couponCode = watch('coupon_code')

  if (items.length === 0 && !isSubmitting) {
    return <Empty title="Tu carrito esta vacio" description="Agrega productos antes de continuar." action={<Button asChild><Link href="/tienda"><ShoppingBag className="mr-2 h-4 w-4" />Ir a la tienda</Link></Button>} />
  }

  const subtotal = totalARS()
  let manualDiscountAmount = 0
  let discountLabel = ''
  let finalCouponCode = null

  if (manualCoupon) {
    manualDiscountAmount = manualCoupon.type === 'percentage' ? Math.round((subtotal * manualCoupon.value) / 100) : manualCoupon.value
    discountLabel = `Cupón (${manualCoupon.code})`
    finalCouponCode = manualCoupon.code
  }

  const firstPurchaseDiscountAmount = isFirstPurchase ? Math.round(subtotal * 0.05) : 0
  const totalDiscount = manualDiscountAmount + firstPurchaseDiscountAmount
  const total = subtotal - totalDiscount

  const handleApplyCoupon = async () => {
    if (!couponCode?.trim()) return
    try {
      const res = await fetch('/api/coupons/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: couponCode, subtotal }) })
      const data = await res.json()
      if (res.ok && data.valid) {
        setManualCoupon({ code: couponCode, ...data })
        toast.success(`Cupon aplicado: ${data.description}`)
      } else {
        toast.error(data.error ?? 'Cupon invalido')
      }
    } catch { toast.error('Error al validar el cupon') }
  }

  const onSubmit = async (data: CheckoutFormData) => {
    if (!user) {
      toast.error('Debes iniciar sesión para comprar.')
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        buyer_name: user.user_metadata.full_name || user.email,
        buyer_email: user.email,
        buyer_dni: data.buyer_dni,
        items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity, unit_price_ars: i.product.price_ars })),
        coupon_code: finalCouponCode,
        subtotal_ars: subtotal,
        discount_ars: manualDiscountAmount, // Enviamos solo el manual, el backend calculará el de primera compra si corresponde
        total_ars: total,
      }
      const res = await fetch('/api/orders/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await res.json()
      if (!res.ok) { throw new Error(result.error ?? 'Error al crear la orden') }
      if (data.payment_method === 'mercadopago' && result.init_point) {
        window.location.href = result.init_point
      } else if (data.payment_method === 'transfer') {
        clearCart()
        router.push(`/checkout/transferencia/${result.order_id}`)
      }
    } catch (error: any) {
      toast.error('Ocurrio un error', { description: error.message })
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 flex flex-col gap-8">
        {/* ... Datos del comprador y Metodo de pago ... */}
        <section className="bg-card rounded-xl border p-6">
          <h2 className="font-serif font-semibold text-lg mb-5">Datos del comprador</h2>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="buyer_email">Email de la cuenta</Label>
            <Input id="buyer_email" type="email" {...register('buyer_email')} disabled />
            <Label htmlFor="buyer_dni" className="mt-3">DNI</Label>
            <Input id="buyer_dni" type="text" placeholder="Ej: 12345678" {...register('buyer_dni')} required />
          </div>
        </section>
        <section className="bg-card rounded-xl border p-6"><h2 className="font-serif font-semibold text-lg mb-5">Metodo de pago</h2><RadioGroup value={paymentMethod} onValueChange={v => setValue('payment_method', v as any)} className="flex flex-col gap-3">{paymentMethods.map(m => (<label key={m.id} htmlFor={m.id} className={cn('flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all', paymentMethod === m.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40')}><RadioGroupItem value={m.id} id={m.id} /><m.icon className="h-5 w-5 text-muted-foreground shrink-0" /><div className="flex-1"><p className="font-medium text-sm">{m.label}</p><p className="text-xs text-muted-foreground">{m.description}</p></div></label>))}</RadioGroup>{paymentMethod === 'transfer' && <div className="mt-4 p-4 bg-muted rounded-lg text-sm text-muted-foreground">Recibirás los datos por email al confirmar. Tu orden quedara reservada por 48 horas.</div>}</section>
      </div>

      <div className="lg:col-span-1"><div className="bg-card rounded-xl border p-6 sticky top-24 flex flex-col gap-4">
        <h2 className="font-serif font-semibold text-lg">Tu orden</h2>
        <Separator />
        <div className="flex flex-col gap-3">{items.map(({ product, quantity }) => (<div key={product.id} className="flex items-center gap-3"><div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-muted"><Image src={product.image_url!} alt={product.name} fill className="object-cover" sizes="48px" /></div><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{product.name}</p><p className="text-xs text-muted-foreground">x{quantity}</p></div><span className="text-sm font-medium tabular-nums">{formatARS(product.price_ars * quantity)}</span></div>))}</div>
        <Separator />
        <div className="flex flex-col gap-2">
          <Label htmlFor="coupon_code" className="text-sm">Cupón de descuento</Label>
          <div className="flex gap-2"><Input id="coupon_code" placeholder="TENGOUNCODIGO" {...register('coupon_code')} disabled={!!manualCoupon} className="uppercase" /><Button type="button" variant="outline" size="sm" onClick={handleApplyCoupon} disabled={!!manualCoupon || !couponCode?.trim()}>Aplicar</Button></div>
          {manualCoupon && <p className="text-xs text-primary/80">Cupón "{manualCoupon.code}" aplicado.</p>}
        </div>
        <Separator />
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatARS(subtotal)}</span></div>
          {manualDiscountAmount > 0 && (
            <div className="flex justify-between text-primary">
              <span>{discountLabel}</span>
              <span className="tabular-nums">-{formatARS(manualDiscountAmount)}</span>
            </div>
          )}
          {isFirstPurchase && (
            <div className="flex justify-between text-primary">
              <span className="flex items-center gap-1.5"><Gift className="h-3.5 w-3.5" /> Desc. Primera Compra (5%)</span>
              <span className="tabular-nums">-{formatARS(firstPurchaseDiscountAmount)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-bold text-base"><span>Total</span><span className="tabular-nums">{formatARS(total)}</span></div>
        </div>
        <Button type="submit" size="lg" className="w-full mt-2" disabled={isSubmitting || isUserLoading}>{isSubmitting || isUserLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</> : 'Finalizar Compra'}</Button>
      </div></div>
    </form>
  )
}
