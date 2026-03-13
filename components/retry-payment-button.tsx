'use client'

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface RetryPaymentButtonProps {
  orderId: string
}

export function RetryPaymentButton({ orderId }: RetryPaymentButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleRetry = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders/retry-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Error al generar pago')
        return
      }

      if (data.init_point) {
        window.location.href = data.init_point
      }
    } catch {
      toast.error('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" onClick={handleRetry} disabled={loading} className="gap-1.5">
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CreditCard className="h-3.5 w-3.5" />
      )}
      Pagar
    </Button>
  )
}
