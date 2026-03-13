import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })

  const { ticket_id } = await request.json()
  if (!ticket_id) return NextResponse.json({ error: 'ticket_id requerido' }, { status: 400 })

  const { data: ticket } = await supabase
    .from('tickets')
    .select('is_used')
    .eq('id', ticket_id)
    .single()

  if (!ticket) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 })
  if (ticket.is_used) return NextResponse.json({ error: 'Ticket ya utilizado' }, { status: 409 })

  const { error } = await supabase
    .from('tickets')
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq('id', ticket_id)

  if (error) return NextResponse.json({ error: 'Error al actualizar ticket' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
