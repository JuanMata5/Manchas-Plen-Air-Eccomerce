'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Shield, User, Calendar, MapPin, Download } from 'lucide-react'

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
}

interface Props {
  ticket: TicketInfo
  isAdmin: boolean
}

export function TicketValidationView({ ticket, isAdmin }: Props) {
  const [isUsed, setIsUsed] = useState(ticket.is_used)
  const [usedAt, setUsedAt] = useState(ticket.used_at)
  const [validating, setValidating] = useState(false)
  const [downloading, setDownloading] = useState(false)

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
    <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
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
          <p className="text-xs text-gray-400 uppercase tracking-wide">Manchas Plen Air</p>
          <h2 className="text-xl font-bold text-gray-900 mt-1">{ticket.product_name}</h2>
          <p className="text-sm text-gray-500 font-mono mt-1">{ticket.qr_code}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400">Titular</p>
              <p className="text-sm font-medium">{ticket.holder_name || ticket.buyer_name}</p>
            </div>
          </div>

          {ticket.event_date && (
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Fecha</p>
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
              <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Ubicación</p>
                <p className="text-sm font-medium">{ticket.event_location}</p>
              </div>
            </div>
          )}
        </div>

        {/* Admin section */}
        {isAdmin && !isUsed && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
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
            <div className="bg-red-50 text-red-700 rounded-lg p-3 text-center text-sm font-medium">
              Esta entrada ya fue utilizada
            </div>
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
