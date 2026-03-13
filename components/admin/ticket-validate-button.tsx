'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCheck } from 'lucide-react'

export function TicketValidateButton({ ticketId, qrCode }: { ticketId: string; qrCode: string }) {
  const [loading, setLoading] = useState(false)

  const handleValidate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId }),
      })
      if (res.ok) {
        toast.success(`Ticket ${qrCode} validado`)
        window.location.reload()
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Error al validar')
      }
    } catch {
      toast.error('Error de conexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleValidate} disabled={loading} className="gap-1.5">
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
      Validar
    </Button>
  )
}
