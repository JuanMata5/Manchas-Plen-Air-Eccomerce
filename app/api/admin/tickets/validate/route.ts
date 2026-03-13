import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiLimiter, withRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const rateLimited = withRateLimit(request, apiLimiter)
  if (rateLimited) return rateLimited

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const adminDb = createAdminClient()

  const { data: profile } = await adminDb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const { ticket_id } = await request.json()
  if (!ticket_id) return NextResponse.json({ error: 'ticket_id requerido' }, { status: 400 })

  const { data: ticket } = await adminDb
    .from('tickets')
    .select('is_used')
    .eq('id', ticket_id)
    .single()

  if (!ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
  if (ticket.is_used) return NextResponse.json({ error: 'Ticket ya utilizado' }, { status: 409 })

  const { error } = await adminDb
    .from('tickets')
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq('id', ticket_id)

  if (error) return NextResponse.json({ error: 'Error al actualizar ticket' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
