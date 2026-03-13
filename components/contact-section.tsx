'use client'

import { useState } from 'react'
import { Send, Loader2, Phone, Mail, MapPin, Instagram, Facebook } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z" />
    </svg>
  )
}

const socials = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/manchas_plein_air/',
    icon: Instagram,
    handle: '@manchas_plein_air',
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/MPABSAS2/#',
    icon: Facebook,
    handle: 'Manchas -plein air -',
  },
  {
    name: 'Threads',
    href: 'https://www.threads.com/@manchas_plein_air?xmt=AQF0Mrq2OUkRpH63TXUND-RGarRLFgM99h__lSYr6jeqw5g',
    icon: TikTokIcon,
    handle: '@manchas_plein_air',
  },
]

export function ContactSection() {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error('Completa todos los campos')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Mensaje enviado! Te responderemos a la brevedad.')
        setSent(true)
        setForm({ name: '', email: '', message: '' })
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Error al enviar')
      }
    } catch {
      toast.error('Error de conexion')
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="contacto" className="scroll-mt-20 max-w-6xl mx-auto px-4 py-16 md:py-20">
      <div className="text-center mb-12">
        <p className="text-sm uppercase tracking-widest text-muted-foreground font-medium mb-2">Contacto</p>
        <h2 className="font-serif font-bold text-3xl md:text-4xl text-foreground">
          Escribinos
        </h2>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          Tenes alguna duda o consulta? Envianos un mensaje y te respondemos lo antes posible.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Form */}
        <div className="bg-card rounded-xl border border-border p-6 md:p-8">
          {sent ? (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <Send className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="font-serif font-semibold text-xl text-foreground">Mensaje enviado</h3>
              <p className="text-sm text-muted-foreground">Te responderemos a la brevedad a tu email.</p>
              <Button variant="outline" size="sm" onClick={() => setSent(false)}>
                Enviar otro mensaje
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-name">Nombre *</Label>
                  <Input
                    id="contact-name"
                    placeholder="Tu nombre"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="contact-email">Email *</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-message">Mensaje *</Label>
                <Textarea
                  id="contact-message"
                  rows={5}
                  placeholder="Contanos en que podemos ayudarte..."
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" size="lg" disabled={sending} className="w-full sm:w-auto self-end gap-2">
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Enviar mensaje
              </Button>
            </form>
          )}
        </div>

        {/* Info + socials */}
        <div className="flex flex-col gap-6">
          {/* Contact info */}
          <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-5">
            <h3 className="font-serif font-semibold text-lg text-foreground">Informacion de contacto</h3>
            <div className="flex flex-col gap-4">
              <a href="tel:+5491112345678" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Telefono</p>
                  <p>+54 9 11 1234-5678</p>
                </div>
              </a>
              <a href="mailto:contacto@manchasplenair.com" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Email</p>
                  <p>contacto@manchasplenair.com</p>
                </div>
              </a>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Ubicacion</p>
                  <p>Buenos Aires, Argentina</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social media */}
          <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
            <h3 className="font-serif font-semibold text-lg text-foreground">Seguinos en redes</h3>
            <div className="flex flex-col gap-3">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-all group"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <s.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.handle}</p>
                  </div>
                  <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Seguir
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
