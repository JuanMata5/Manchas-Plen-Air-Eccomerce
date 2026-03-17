'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
        const response = await fetch('/api/auth/request-password-reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Algo salió mal');
        }

        setSent(true)
        toast.success('Si tu email está registrado, recibirás un correo para restablecer tu contraseña.')

    } catch (error) {
        toast.error((error as Error).message);
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Link href="/" className="flex items-center gap-2 font-serif font-bold text-2xl text-primary">
            <Leaf className="h-6 w-6" />
            Manchas Plen Air
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Restablecer contraseña</h1>
        </div>

        {sent ? (
            <div className="text-center bg-green-100 p-4 rounded-md border border-green-200">
                <h2 className="font-semibold text-green-800">Correo enviado</h2>
                <p className="text-sm text-green-700 mt-2">Revisá tu bandeja de entrada (y la carpeta de spam) y seguí las instrucciones para crear una nueva contraseña.</p>
            </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground text-center">Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Recordaste tu contraseña?{' '}
          <Link href="/auth/login" className="text-primary underline underline-offset-2">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
    return (
        <Suspense>
            <ForgotPasswordForm />
        </Suspense>
    )
}
