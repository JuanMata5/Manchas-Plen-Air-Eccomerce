import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteFile } from '@/lib/cloudinary'
import { z } from 'zod'

const updateProductSchema = z.object({
  name: z.string().min(3).optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().optional(),
  category_id: z.string().uuid().nullable().optional(),
  price_ars: z.number().positive().optional(),
  price_usd: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  max_per_order: z.number().int().min(1).optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  product_type: z.enum(['ticket', 'workshop', 'merchandise']).optional(),
  event_date: z.string().nullable().optional(),
  event_location: z.string().nullable().optional(),
})

/**
 * PATCH /api/admin/products/[id]
 * Update product by ID from dynamic route
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
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

    const adminDb = createAdminClient()

    // Verify product exists
    const { data: product } = await adminDb
      .from('products')
      .select('id')
      .eq('id', id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const body = await request.json()

    // Validate input
    const updateData = updateProductSchema.parse(body)

    // If slug is being updated, check uniqueness
    if (updateData.slug) {
      const { data: existing } = await adminDb
        .from('products')
        .select('id')
        .eq('slug', updateData.slug)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
      }
    }

    // Update product
    const { data: updated, error } = await adminDb
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[ADMIN API] Update product error:', error)
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }

    console.error('[ADMIN API] Update product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/products/[id]
 * Delete product and associated images
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
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

    const adminDb = createAdminClient()

    // Get product images
    const { data: images } = await adminDb
      .from('product_images')
      .select('cloudinary_public_id')
      .eq('product_id', id)

    // Delete from Cloudinary
    if (images && images.length > 0) {
      for (const image of images) {
        try {
          await deleteFile(image.cloudinary_public_id)
        } catch (err) {
          console.warn('[CLOUDINARY] Failed to delete image:', err)
        }
      }
    }

    // Delete product (cascade will delete product_images)
    const { error } = await adminDb.from('products').delete().eq('id', id)

    if (error) {
      console.error('[ADMIN API] Delete product error:', error)
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADMIN API] Delete product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
