import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildTravelPayload,
  buildTravelUpdatePayload,
  generateUniqueTravelSlug,
  travelExperienceSchema,
} from '@/lib/travel-admin'

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) return adminCheck.error

    const { id } = await params
    const body = await request.json()
    const adminDb = createAdminClient()

    const { data: existing } = await adminDb
      .from('travel_experiences')
      .select('*')
      .eq('id', id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
    }

    const isPartialToggle = Object.keys(body).length === 1 && typeof body.is_active === 'boolean'
    if (isPartialToggle) {
      const { data: updated, error } = await adminDb
        .from('travel_experiences')
        .update({ is_active: body.is_active })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('[ADMIN API] Toggle travel experience error:', error)
        return NextResponse.json({ error: 'No se pudo actualizar el estado' }, { status: 500 })
      }

      return NextResponse.json(updated)
    }

    const data = travelExperienceSchema.parse({ ...existing, ...body })

    const slug = await generateUniqueTravelSlug(data.slug || data.seo_slug || data.title, adminDb, id)
    const payload = buildTravelPayload(data, slug)
    const updateData = buildTravelUpdatePayload(payload)

    const { data: updated, error } = await adminDb
      .from('travel_experiences')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[ADMIN API] Update travel experience error:', error)
      return NextResponse.json({ error: 'No se pudo actualizar el viaje' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('[ADMIN API] Update travel experience fatal:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) return adminCheck.error

    const { id } = await params
    const adminDb = createAdminClient()

    const { error } = await adminDb
      .from('travel_experiences')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[ADMIN API] Delete travel experience error:', error)
      return NextResponse.json({ error: 'No se pudo eliminar el viaje' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[ADMIN API] Delete travel experience fatal:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
