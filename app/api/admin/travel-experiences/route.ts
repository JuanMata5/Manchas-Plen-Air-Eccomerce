import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  buildTravelPayload,
  generateUniqueTravelSlug,
  travelExperienceSchema,
} from '@/lib/travel-admin'

async function requireAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      ),
    }
  }

  return { user }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin()

    if ('error' in adminCheck) {
      return adminCheck.error
    }

    const body = await request.json()

    console.log('===== BODY =====')
    console.log(JSON.stringify(body, null, 2))

    const data = travelExperienceSchema.parse(body)

    const adminDb = createAdminClient()

    const slug = await generateUniqueTravelSlug(
      data.slug || data.seo_slug || data.title,
      adminDb
    )

    const payload = buildTravelPayload(data, slug)

    console.log('===== PAYLOAD =====')
    console.log(JSON.stringify(payload, null, 2))

    const { data: created, error } = await adminDb
      .from('travel_experiences')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('===== SUPABASE ERROR =====')
      console.error(JSON.stringify(error, null, 2))

      return NextResponse.json(
        {
          message: 'Supabase insert error',
          supabaseError: error,
        },
        { status: 500 }
      )
    }

    console.log('===== CREATED =====')
    console.log(JSON.stringify(created, null, 2))

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('===== ZOD ERROR =====')
      console.error(JSON.stringify(error.issues, null, 2))

      return NextResponse.json(
        {
          message: 'Validation failed',
          issues: error.issues,
        },
        { status: 400 }
      )
    }

    console.error('===== FATAL ERROR =====')
    console.error(error)

    return NextResponse.json(
      {
        message: 'Internal server error',
        error: String(error),
      },
      { status: 500 }
    )
  }
}