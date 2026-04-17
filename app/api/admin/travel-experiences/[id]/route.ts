import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const updateTravelExperienceSchema = z.object({
  title: z.string().min(3).optional(),
  location: z.string().min(3).optional(),
  dates: z.string().min(3).optional(),
  description: z.string().min(10).optional(),
  capacity: z.number().int().min(1).optional(),
  image_url: z.string().url().optional().nullable(),
  is_active: z.boolean().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminDb = createAdminClient()
    const { data: experience } = await adminDb
      .from('travel_experiences')
      .select('id')
      .eq('id', id)
      .single()

    if (!experience) {
      return NextResponse.json({ error: 'Travel experience not found' }, { status: 404 })
    }

    const body = await request.json()
    const updateData = updateTravelExperienceSchema.parse(body)

    const { data: updated, error } = await adminDb
      .from('travel_experiences')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[ADMIN API] Update travel experience error:', error)
      return NextResponse.json({ error: 'Failed to update travel experience' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('[ADMIN API] Update travel experience error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
