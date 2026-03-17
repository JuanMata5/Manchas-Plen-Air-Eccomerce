'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { CreditCard, Building2, ShoppingBag, Loader2, Gift, Ticket } from 'lucide-react'
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
  coupon_code: z.string().optional(),
  payment_method: z.enum(['mercadopago', 'transfer']),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

const paymentMethods = [
  {
    id: 'mercadopago' as const,
    label: 'Mercado Pago',
    description: 'Tarjeta de credito, debito, dinero en cuenta',
    icon: CreditCard,
  },
  {
    id: 'transfer' as const,
    label: 'Transferencia bancaria',
    description: 'CBU / Alias. Te enviamos los datos por email.',
    icon: Building2,
  },
]

export function CheckoutForm() {
  const router = useRouter()
  const { user, isLoading: isUserLoading } = useUser()
  const { items, totalARS, clearCart } = useCartStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [couponApplied, setCouponApplied] = useState<{
    code: string
    discount: number
    type: 'percentage' | 'fixed_ars'
    value: number
  } | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      buyer_email: '',
      coupon_code: '',
      payment_method: 'mercadopago',
    },
  })

  // Rellenar email del usuario logueado
  useEffect(() => {
    if (user?.email) {
      setValue('buyer_email', user.email)
    }
  }, [user, setValue])

  const paymentMethod = watch('payment_method')
  const couponCode = watch('coupon_code')

  if (items.length === 0 && !isSubmitting) {
    return (
      <Empty
        title="Tu carrito esta vacio"
        description="Agrega productos antes de continuar al checkout."
        action={
          <Button asChild>
            <Link href="/tienda">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Ir a la tienda
            </Link>
          </Button>
        }
      />
    )
  }

  const subtotal = totalARS()
  const discountAmount = couponApplied
    ? couponApplied.type === 'percentage'
      ? Math.round((subtotal * couponApplied.value) / 100)
      : couponApplied.value
    : 0
  const total = subtotal - discountAmount

  const handleApplyCoupon = async () => {
    if (!couponCode?.trim()) return
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setCouponApplied({
          code: couponCode,
          discount: data.discount_amount,
          type: data.discount_type,
          value: data.discount_value,
        })
        toast.success(`Cupon aplicado: ${data.description}`)
      } else {
        toast.error(data.error ?? 'Cupon invalido')
      }
    } catch {
      toast.error('Error al validar el cupon')
    }
  }

  const onSubmit = async (data: CheckoutFormData) => {
    if (!user) {
      toast.error('Debes iniciar sesion para comprar.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        buyer_name: user.user_metadata.full_name || user.email,
        buyer_email: user.email,
        buyer_dni: user.user_metadata.dni || '00000000',
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price_ars: i.product.price_ars,
        })),
        coupon_code: couponApplied?.code ?? null,
        subtotal_ars: subtotal,
        discount_ars: discountAmount,
        total_ars: total,
      }

      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error ?? 'Error al crear la orden')
        setIsSubmitting(false)
        return
      }

      if (data.payment_method === 'mercadopago' && result.init_point) {
        window.location.href = result.init_point
      } else if (data.payment_method === 'transfer') {
        clearCart()
        router.push(`/checkout/transferencia/${result.order_id}`)
      }
    } catch {
      toast.error('Ocurrio un error. Intenta nuevamente.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 flex flex-col gap-8">
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-serif font-semibold text-lg text-foreground mb-5">Datos del comprador</h2>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="buyer_email">Email de la cuenta</Label>
            <Input
              id="buyer_email"
              type="email"
              {...register('buyer_email')}
              disabled
            />
            {isUserLoading && <p className="text-xs text-muted-foreground">Cargando tu información...</p>}
          </div>
        </section>

        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-serif font-semibold text-lg text-foreground mb-5">
            Metodo de pago
          </h2>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(v) => setValue('payment_method', v as 'mercadopago' | 'transfer')}
            className="flex flex-col gap-3"
          >
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                htmlFor={method.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all',
                  paymentMethod === method.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40',
                )}
              >
                <RadioGroupItem value={method.id} id={method.id} />
                <method.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{method.label}</p>
                  <p className="text-xs text-muted-foreground">{method.description}</p>
                </div>
              </label>
            ))}
          </RadioGroup>

          {paymentMethod === 'transfer' && (
            <div className="mt-4 p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              Recibirás los datos bancarios por email al confirmar la compra. Tu orden quedara
              reservada por 48 horas.
            </div>
          )}
        </section>
      </div>

      <div className="lg:col-span-1">
        <div className="bg-card rounded-xl border border-border p-6 sticky top-24 flex flex-col gap-4">
          <h2 className="font-serif font-semibold text-lg text-foreground">Tu orden</h2>
          <Separator />

          {/* --- AVISO CUPÓN BIENVENIDA --- */}
          {!couponApplied && (
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-200 rounded-lg text-amber-800 text-sm">
              <Gift className="h-4 w-4 shrink-0" />
              <span>¿Primera compra? Usa el cupón <strong>BIENVENIDO10</strong> y obtén 10% OFF.</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 rounded-md overflow-hidden bg-muted">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-serif text-muted-foreground">
                      PA
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">x{quantity}</p>
                </div>
                <span className="text-sm font-medium tabular-nums shrink-0">
                  {formatARS(product.price_ars * quantity)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label htmlFor="coupon_code" className="text-sm">Cupon de descuento</Label>
            <div className="flex gap-2">
              <Input
                id="coupon_code"
                placeholder="BIENVENIDO10"
                className="uppercase"
                {...register('coupon_code')}
                disabled={!!couponApplied}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyCoupon}
                disabled={!!couponApplied || !couponCode?.trim()}
              >
                Aplicar
              </Button>
            </div>
            {couponApplied && (
              <p className="text-xs text-primary">Descuento aplicado: {couponApplied.code}</p>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatARS(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-primary">
                <span>Descuento</span>
                <span className="tabular-nums">-{formatARS(discountAmount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-foreground text-base">
              <span>Total</span>
              <span className="tabular-nums">{formatARS(total)}</span>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full mt-2" disabled={isSubmitting || isUserLoading}>
            {isSubmitting || isUserLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Finalizar Compra'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
