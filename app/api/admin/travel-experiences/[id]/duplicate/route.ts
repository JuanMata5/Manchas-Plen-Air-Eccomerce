import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateUniqueTravelSlug } from '@/lib/travel-admin'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  return { user }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) return adminCheck.error

    const { id } = await params
    const adminDb = createAdminClient()

    const { data: original } = await adminDb
      .from('travel_experiences')
      .select('*')
      .eq('id', id)
      .single()

    if (!original) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
    }

    const slug = await generateUniqueTravelSlug(`${original.slug || original.id}-copia`, adminDb)
    const copyable = { ...original }
    delete copyable.created_at
    delete copyable.updated_at
    const duplicate = {
      ...copyable,
      id: slug,
      slug,
      title: `${original.title} (copia)`,
      is_active: false,
    }

    const { data: created, error } = await adminDb
      .from('travel_experiences')
      .insert(duplicate)
      .select()
      .single()

    if (error) {
      console.error('[ADMIN API] Duplicate travel experience error:', error)
      return NextResponse.json({ error: 'No se pudo duplicar el viaje' }, { status: 500 })
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('[ADMIN API] Duplicate travel experience fatal:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
