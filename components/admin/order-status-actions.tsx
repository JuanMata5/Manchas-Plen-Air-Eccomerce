'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

import { Loader2 } from 'lucide-react'

interface OrderStatusActionsProps {
  orderId: string
  currentStatus: string
}

const transitions: Record<string, { value: string; label: string }[]> = {
  pending: [
    { value: 'paid', label: 'Marcar como pagado' },
    { value: 'cancelled', label: 'Cancelar' },
  ],
  payment_pending: [
    { value: 'paid', label: 'Confirmar pago' },
    { value: 'cancelled', label: 'Cancelar' },
  ],
  paid: [
    { value: 'refunded', label: 'Reembolsar' },
  ],
  cancelled: [],
  refunded: [],
}

export function OrderStatusActions({ orderId, currentStatus }: OrderStatusActionsProps) {
  const [loading, setLoading] = useState(false)

  const options = transitions[currentStatus] ?? []
  if (options.length === 0) return null

  const handleUpdate = async (newStatus: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.warning) {
          toast.warning(data.warning)
        } else if (data.tickets_created) {
          toast.success(`Estado actualizado — ${data.tickets_created} ticket(s) creados`)
        } else {
          toast.success('Estado actualizado')
        }
        // Reload to refresh server-side data
        window.location.reload()
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Error al actualizar')
      }
    } catch {
      toast.error('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant="outline"
          size="sm"
          disabled={loading}
          className="w-full justify-start"
          onClick={() => handleUpdate(opt.value)}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
          {opt.label}
        </Button>
      ))}
    </div>
  )
}
