import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/admin/products/upload-image
 * Save Cloudinary image reference to database
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

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminDb = createAdminClient()

    const {
      product_id,
      cloudinary_public_id,
      url,
      width,
      height,
      is_primary = false,
      display_order = 0,
    } = await request.json()

    if (!product_id || !cloudinary_public_id || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify product exists
    const { data: product } = await adminDb
      .from('products')
      .select('id')
      .eq('id', product_id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // If this is primary, remove primary flag from other images
    if (is_primary) {
      await adminDb.from('product_images').update({ is_primary: false }).eq('product_id', product_id)
    }

    // Insert image
    const { data: image, error } = await adminDb
      .from('product_images')
      .insert({
        product_id,
        cloudinary_public_id,
        url,
        width,
        height,
        is_primary,
        display_order,
      })
      .select()
      .single()

    if (error) {
      console.error('[ADMIN API] Image upload error:', error)
      return NextResponse.json({ error: 'Failed to save image' }, { status: 500 })
    }

    // If this is the primary image, update the main product image_url
    if (is_primary) {
      await adminDb
        .from('products')
        .update({ image_url: url })
        .eq('id', product_id)
    }

    return NextResponse.json(image)
  } catch (error) {
    console.error('[ADMIN API] Upload image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
