'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('¿Seguro que quieres eliminar esta orden?')) return
    setDeleting(true)
    try {
      const res = await fetch('/api/orders/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Error al eliminar')
        return
      }
      toast.success('Orden eliminada')
      router.refresh()
    } catch {
      toast.error('Error al eliminar la orden')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={handleDelete}
      disabled={deleting}
    >
      {deleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  )
}
