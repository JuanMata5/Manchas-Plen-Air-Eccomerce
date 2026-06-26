'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Copy, Edit3, Eye, EyeOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

type Props = {
  id: string
  isActive: boolean
}

export function TravelExperienceActions({ id, isActive }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const request = async (action: string, url: string, init: RequestInit) => {
    setLoading(action)
    try {
      const res = await fetch(url, init)
      const result = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(result.error || 'No se pudo completar la acción')
      toast.success('Acción completada')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'No se pudo completar la acción')
    } finally {
      setLoading(null)
    }
  }

  const toggleActive = () => {
    request('toggle', `/api/admin/travel-experiences/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !isActive }),
    })
  }

  const duplicate = () => {
    request('duplicate', `/api/admin/travel-experiences/${id}/duplicate`, {
      method: 'POST',
    })
  }

  const remove = () => {
    if (!window.confirm('¿Eliminar este viaje? Esta acción no se puede deshacer.')) return
    request('delete', `/api/admin/travel-experiences/${id}`, {
      method: 'DELETE',
    })
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="ghost" size="icon" title="Editar">
        <Link href={`/admin/viajes/experiencias/${id}`}>
          <Edit3 className="h-4 w-4" />
        </Link>
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={duplicate} disabled={loading === 'duplicate'} title="Duplicar">
        <Copy className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={toggleActive} disabled={loading === 'toggle'} title={isActive ? 'Desactivar' : 'Activar'}>
        {isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={remove} disabled={loading === 'delete'} title="Eliminar">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}
