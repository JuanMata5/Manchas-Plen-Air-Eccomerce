'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Leaf } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function getHashParams() {
  const hash = typeof window !== 'undefined' ? window.location.hash : ''
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  const params = new URLSearchParams(raw)
  return {
    access_token: params.get('access_token') || undefined,
    refresh_token: params.get('refresh_token') || undefined,
    type: params.get('type') || undefined,
  }
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  useEffect(() => {
    ;(async () => {
      const { access_token, refresh_token, type } = getHashParams()

      if (type !== 'recovery' || !access_token || !refresh_token) {
        setReady(true)
        return
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      })

      // Limpia el hash para no dejar tokens en el navegador
      window.history.replaceState(null, '', window.location.pathname)

      if (error) {
        toast.error('El enlace de recuperación es inválido o expiró.')
      }

      setReady(true)
    })()
  }, [supabase])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Contraseña actualizada. Ya podés iniciar sesión.')
      router.push('/auth/login')
      router.refresh()
    } catch (err) {
      toast.error((err as Error).message || 'No se pudo actualizar la contraseña.')
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
          <h1 className="text-xl font-semibold text-foreground">Crear nueva contraseña</h1>
        </div>

        {!ready ? (
          <div className="text-center text-sm text-muted-foreground">Cargando…</div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm">Repetir contraseña</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repetí tu contraseña"
                minLength={6}
                required
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/auth/login" className="text-primary underline underline-offset-2">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

