import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildTravelPayload, generateUniqueTravelSlug, travelExperienceSchema } from '@/lib/travel-admin'

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

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()
    if ('error' in adminCheck) return adminCheck.error

    const body = await request.json()
    const data = travelExperienceSchema.parse(body)
    const adminDb = createAdminClient()
    const slug = await generateUniqueTravelSlug(data.slug || data.seo_slug || data.title, adminDb)
    const payload = buildTravelPayload(data, slug)

    const { data: created, error } = await adminDb
      .from('travel_experiences')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('[ADMIN API] Create travel experience error:', error)
      return NextResponse.json({ error: 'No se pudo crear el viaje' }, { status: 500 })
    }

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('[ADMIN API] Create travel experience fatal:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
