'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Send, Loader2, Image as ImageIcon, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface AdminOrderEmailProps {
  orderId: string
  buyerName: string
  buyerEmail: string
  receiptUrl?: string | null
  currentStatus: string
}

export function AdminOrderEmail({ orderId, buyerName, buyerEmail, receiptUrl, currentStatus }: AdminOrderEmailProps) {
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [subject, setSubject] = useState(`Plen Air - Orden #${orderId.slice(0, 8).toUpperCase()}`)
  const [message, setMessage] = useState('')
  const [markAsPaid, setMarkAsPaid] = useState(false)
  const router = useRouter()

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Escribi un mensaje')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/admin/orders/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          subject,
          message,
          update_status: markAsPaid ? 'paid' : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Error al enviar')
        return
      }
      const data = await res.json()
      if (data.email_sent) {
        toast.success('Email enviado y estado actualizado')
      } else if (data.status_updated) {
        toast.success('Estado actualizado', {
          description: data.email_error
            ? `Email no enviado: ${data.email_error}`
            : 'Email no enviado (verificar configuracion Resend)',
        })
      } else {
        toast.info('Procesado (email no pudo enviarse)')
      }
      setOpen(false)
      setMessage('')
      router.refresh()
    } catch {
      toast.error('Error al enviar email')
    } finally {
      setSending(false)
    }
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        {receiptUrl && (
          <a
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
            title="Ver comprobante"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Comp.
          </a>
        )}
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)} title="Enviar email">
          <Mail className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="bg-card rounded-xl border border-border p-6 w-full max-w-lg flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-semibold text-foreground">
          Enviar email a {buyerName}
        </h3>
        <p className="text-xs text-muted-foreground">{buyerEmail}</p>

        {receiptUrl && (
          <a
            href={receiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm hover:bg-blue-100"
          >
            <ImageIcon className="h-4 w-4 shrink-0" />
            Ver comprobante de pago
            <ExternalLink className="h-3.5 w-3.5 ml-auto" />
          </a>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email-subject">Asunto</Label>
          <Input
            id="email-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email-message">Mensaje</Label>
          <Textarea
            id="email-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Ej: Tu pago fue confirmado. Te enviamos tus entradas a este email..."
          />
        </div>

        {currentStatus !== 'paid' && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={markAsPaid}
              onChange={(e) => setMarkAsPaid(e.target.checked)}
              className="rounded border-border"
            />
            Marcar orden como pagada al enviar
          </label>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSend} disabled={sending}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar email
          </Button>
        </div>
      </div>
    </div>
  )
}
