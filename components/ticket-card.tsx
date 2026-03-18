'use client'

import { useState, useEffect } from 'react'
import { Download, QrCode, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface TicketCardProps {
  ticket: {
    id: string
    qr_code: string
    holder_name: string
    holder_email: string
    is_used: boolean
    used_at: string | null
    created_at: string
    product_id: string
    order_id: string
    products: { name: string; image_url: string | null } | null
    orders: { id: string; buyer_name: string; created_at: string } | null
  }
}

export function TicketCard({ ticket }: TicketCardProps) {
  const [qrSrc, setQrSrc] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function generateQR() {
      try {
        const module = await import('qrcode')

        if (!module) {
          console.error('[QR] module is null')
          return
        }

        const QRCode: any = module.default ?? module

        if (!QRCode || typeof QRCode.toDataURL !== 'function') {
          console.error('[QR] invalid module:', module)
          return
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || window.location.origin

        const qrUrl = `${baseUrl}/tickets/validar/${ticket.qr_code}`

        const url = await QRCode.toDataURL(qrUrl, {
          errorCorrectionLevel: 'H',
          width: 200,
          margin: 1,
        })

        if (isMounted) {
          setQrSrc(url)
        }
      } catch (err) {
        console.error('[QR ERROR]', err)
      }
    }

    generateQR()

    return () => {
      isMounted = false
    }
  }, [ticket.qr_code])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/tickets/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticket.id }),
      })

      if (!res.ok) {
        toast.error('Error al descargar ticket')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `ticket-${ticket.qr_code}.pdf`
      a.click()

      URL.revokeObjectURL(url)

      toast.success('Ticket descargado')
    } catch (err) {
      console.error(err)
      toast.error('Error al descargar')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 py-3 flex items-center justify-between">
        <span className="font-serif font-semibold text-sm">
          Manchas Plen Air
        </span>

        {ticket.is_used ? (
          <Badge className="bg-primary-foreground/20 text-primary-foreground border-0 text-xs">
            Usado
          </Badge>
        ) : (
          <Badge className="bg-green-500 text-white border-0 text-xs">
            Válido
          </Badge>
        )}
      </div>

      <div className="p-5 flex flex-col gap-4">

        {/* Nombre */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Entrada
          </p>
          <p className="font-semibold text-foreground">
            {ticket.products?.name ?? 'Ticket'}
          </p>
        </div>

        {/* QR */}
        <div className="flex justify-center py-2">
          {qrSrc ? (
            <div
              className={`p-3 bg-white rounded-xl border border-border ${
                ticket.is_used ? 'opacity-40' : ''
              }`}
            >
              <img
                src={qrSrc}
                alt={`QR ${ticket.qr_code}`}
                className="w-40 h-40"
              />
            </div>
          ) : (
            <div className="w-40 h-40 bg-muted rounded-xl flex items-center justify-center">
              <QrCode className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Código */}
        <div className="text-center">
          <p className="font-mono text-sm font-bold text-foreground tracking-wider">
            {ticket.qr_code}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Presenta este código en la entrada
          </p>
        </div>

        {/* Detalles */}
        <div className="border-t border-border pt-3 flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Titular</span>
            <span className="text-foreground font-medium">
              {ticket.holder_name}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha compra</span>
            <span className="text-foreground">
              {new Date(ticket.created_at).toLocaleDateString('es-AR')}
            </span>
          </div>
        </div>

        {/* Descargar */}
        <Button
          onClick={handleDownload}
          disabled={downloading}
          variant="outline"
          size="sm"
          className="w-full gap-2"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Descargar PDF
        </Button>
      </div>
    </div>
  )
}