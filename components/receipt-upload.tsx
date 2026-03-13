'use client'

import { useState, useRef } from 'react'
import { Upload, Check, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function ReceiptUpload({ orderId, existingUrl }: { orderId: string; existingUrl?: string | null }) {
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(!!existingUrl)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes (JPG, PNG, etc.)')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo no puede superar los 10MB')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('order_id', orderId)

      const res = await fetch('/api/orders/upload-receipt', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Error al subir comprobante')
        return
      }

      setUploaded(true)
      toast.success('Comprobante subido correctamente')
    } catch {
      toast.error('Error al subir comprobante')
    } finally {
      setUploading(false)
    }
  }

  if (uploaded) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
        <Check className="h-4 w-4 shrink-0" />
        <span>Comprobante enviado. Lo revisaremos y te notificaremos por email.</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Subir comprobante de transferencia
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Subi una captura o foto del comprobante de pago (JPG, PNG, max 10MB)
      </p>
    </div>
  )
}
