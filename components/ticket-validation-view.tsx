'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Shield, User, Calendar, MapPin, Download, Camera, X } from 'lucide-react'

interface TicketInfo {
  id: string
  qr_code: string
  holder_name: string
  is_used: boolean
  used_at: string | null
  product_name: string
  event_date: string | null
  event_location: string | null
  order_id: string
  buyer_name: string
  buyer_email: string
  buyer_dni?: string
}

interface Props {
  ticket: TicketInfo
  isAdmin: boolean
}

export function TicketValidationView({ ticket, isAdmin }: Props) {
  const router = useRouter()
  const [isUsed, setIsUsed] = useState(ticket.is_used)
  const [usedAt, setUsedAt] = useState(ticket.used_at)
  const [validating, setValidating] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<any>(null)

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
      } catch {
        // ignore
      }
      html5QrCodeRef.current = null
    }
    setScanning(false)
  }, [])

  const startScanner = useCallback(async () => {
    setScanning(true)

    // Dynamic import to avoid SSR issues
    const { Html5Qrcode } = await import('html5-qrcode')

    // Wait for the DOM element to be ready
    await new Promise((r) => setTimeout(r, 100))

    if (!scannerRef.current) return

    const scannerId = 'qr-scanner'
    scannerRef.current.id = scannerId

    const html5QrCode = new Html5Qrcode(scannerId)
    html5QrCodeRef.current = html5QrCode

    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText: string) => {
          // Extract the ticket code from the URL
          const match = decodedText.match(/\/tickets\/validar\/([A-Za-z0-9_-]+)/)
          if (match) {
            stopScanner()
            router.push(`/tickets/validar/${match[1]}`)
            router.refresh()
          } else if (decodedText.startsWith('http')) {
            // If it's a full URL, just navigate
            stopScanner()
            window.location.href = decodedText
          }
        },
        () => {
          // QR code not detected, keep scanning
        },
      )
    } catch (err) {
      console.error('Error starting scanner:', err)
      setScanning(false)
      alert('No se pudo acceder a la cámara. Verificá los permisos.')
    }
  }, [router, stopScanner])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const handleValidate = async () => {
    setValidating(true)
    try {
      const res = await fetch('/api/admin/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticket.id }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Error al validar')
        return
      }

      setIsUsed(true)
      setUsedAt(new Date().toISOString())
    } catch {
      alert('Error de conexión')
    } finally {
      setValidating(false)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/tickets/qr/${ticket.qr_code}`)
      if (!res.ok) throw new Error('Error')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ticket-${ticket.qr_code}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Error al descargar el PDF')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
      {/* Status header */}
      <div className={`p-6 text-center text-white ${isUsed ? 'bg-red-500' : 'bg-green-500'}`}>
        {isUsed ? (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-3" />
            <h1 className="text-2xl font-bold">Ticket Usado</h1>
            {usedAt && (
              <p className="text-sm opacity-90 mt-1">
                Usado el {new Date(usedAt).toLocaleString('es-AR')}
              </p>
            )}
          </>
        ) : (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-3" />
            <h1 className="text-2xl font-bold">Ticket Válido</h1>
            <p className="text-sm opacity-90 mt-1">Entrada disponible para usar</p>
          </>
        )}
      </div>

      {/* Ticket info */}
      <div className="p-6 space-y-4">
        <div className="text-center border-b pb-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Manchas Plen Air</p>
          <h2 className="text-xl font-bold text-foreground mt-1">{ticket.product_name}</h2>
          <p className="text-sm text-muted-foreground font-mono mt-1">{ticket.qr_code}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Titular</p>
              <p className="text-sm font-medium">{ticket.holder_name || ticket.buyer_name}</p>
              <p className="text-xs text-muted-foreground mt-1">DNI: <span className="font-mono">{ticket.buyer_dni || 'No disponible'}</span></p>
              <p className="text-xs text-muted-foreground mt-1">Email: <span className="font-mono">{ticket.buyer_email}</span></p>
            </div>
          </div>

          {ticket.event_date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Fecha</p>
                <p className="text-sm font-medium">
                  {new Date(ticket.event_date).toLocaleDateString('es-AR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}

          {ticket.event_location && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Ubicación</p>
                <p className="text-sm font-medium">{ticket.event_location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Admin section */}
        {isAdmin && !isUsed && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Shield className="w-4 h-4" />
              <span>Acción de administrador</span>
            </div>
            <Button
              onClick={handleValidate}
              disabled={validating}
              className="w-full bg-green-600 hover:bg-green-700 text-lg py-6"
            >
              {validating ? 'Validando...' : 'Validar Entrada'}
            </Button>
          </div>
        )}

        {isAdmin && isUsed && (
          <div className="border-t pt-4 mt-4">
            <div className="bg-red-500/10 text-red-700 rounded-lg p-3 text-center text-sm font-medium">
              Esta entrada ya fue utilizada
            </div>
          </div>
        )}

        {/* QR Scanner for admin */}
        {isAdmin && (
          <div className="border-t pt-4 mt-4">
            {!scanning ? (
              <Button
                onClick={startScanner}
                variant="outline"
                className="w-full"
              >
                <Camera className="w-4 h-4 mr-2" />
                Escanear otro QR
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Escaneando...</p>
                  <Button
                    onClick={stopScanner}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div
                  ref={scannerRef}
                  className="w-full rounded-lg overflow-hidden"
                />
              </div>
            )}
          </div>
        )}

        {/* Download PDF for customers */}
        {!isAdmin && !isUsed && (
          <div className="border-t pt-4 mt-4">
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              variant="outline"
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Descargando...' : 'Descargar PDF'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
