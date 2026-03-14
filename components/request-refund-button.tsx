'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'

export function RequestRefundButton({
  orderId,
  disabled = false,
}: {
  orderId: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState('')
  const router = useRouter()

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/orders/request-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, reason }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        toast.error(data.error || 'No se pudo solicitar el reembolso')
        return
      }

      toast.success('Solicitud de reembolso enviada')
      setOpen(false)
      setReason('')
      router.refresh()
    } catch {
      toast.error('Error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="gap-1.5">
          <RotateCcw className="h-4 w-4" />
          Solicitar reembolso
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Solicitar reembolso</AlertDialogTitle>
          <AlertDialogDescription>
            Vamos a registrar tu pedido para revision manual. Si queres, agrega un motivo para que el equipo pueda revisarlo mas rapido.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Textarea
          placeholder="Motivo opcional de la solicitud"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          disabled={loading}
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <Button onClick={handleSubmit} disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            Enviar solicitud
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}