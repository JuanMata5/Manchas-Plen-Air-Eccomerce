'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Leaf } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <Link href="/" className="flex items-center gap-2 font-serif font-bold text-2xl text-primary">
            <Leaf className="h-6 w-6" />
            Plen Air
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Iniciar sesion</h1>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contrasena</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          No tenes cuenta?{' '}
          <Link href="/auth/register" className="text-primary underline underline-offset-2">
            Registrate
          </Link>
        </p>
      </div>
    </div>
  )
}
