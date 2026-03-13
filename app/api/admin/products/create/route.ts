import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'Slug debe tener al menos 3 caracteres').regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  category_id: z.string().uuid().nullable(),
  price_ars: z.number().positive('Precio ARS debe ser positivo'),
  price_usd: z.number().positive('Precio USD debe ser positivo').optional().nullable(),
  stock: z.number().int().min(0),
  max_per_order: z.number().int().min(1),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  product_type: z.enum(['ticket', 'workshop', 'merchandise']).default('merchandise'),
  event_date: z.string().nullable().optional(),
  event_location: z.string().optional().nullable(),
})

/**
 * POST /api/admin/products/create
 * Create new product
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin
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

    const body = await request.json()

    // Validate input
    const validData = createProductSchema.parse(body)

    // Check slug uniqueness
    const adminDb = createAdminClient()
    const { data: existing } = await adminDb
      .from('products')
      .select('id')
      .eq('slug', validData.slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    // Create product (using service role to bypass RLS)
    const { data: product, error } = await adminDb
      .from('products')
      .insert({
        name: validData.name,
        slug: validData.slug,
        description: validData.description || null,
        category_id: validData.category_id,
        price_ars: validData.price_ars,
        price_usd: validData.price_usd || null,
        stock: validData.stock,
        max_per_order: validData.max_per_order,
        is_active: validData.is_active,
        is_featured: validData.is_featured,
        product_type: validData.product_type,
        event_date: validData.event_date || null,
        event_location: validData.event_location || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[ADMIN API] Create product error:', error)
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('[ADMIN API] Create product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
