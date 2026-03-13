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

    // If this is the primary image (or the first image), update products.image_url
    if (is_primary) {
      await adminDb
        .from('products')
        .update({ image_url: url })
        .eq('id', product_id)
    } else {
      // If the product has no image_url yet, set it to this image
      const { data: currentProduct } = await adminDb
        .from('products')
        .select('image_url')
        .eq('id', product_id)
        .single()

      if (!currentProduct?.image_url) {
        await adminDb
          .from('products')
          .update({ image_url: url })
          .eq('id', product_id)
      }
    }

    return NextResponse.json(image)
  } catch (error) {
    console.error('[ADMIN API] Upload image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/products/[id]/images/[imageId]
 * Delete product image
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const adminDb = createAdminClient()

    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('image_id')

    if (!imageId) {
      return NextResponse.json({ error: 'Missing image_id' }, { status: 400 })
    }

    // Verify product and image exist
    const { data: image } = await adminDb
      .from('product_images')
      .select('id, product_id, cloudinary_public_id, is_primary')
      .eq('id', imageId)
      .eq('product_id', params.id)
      .single()

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Delete from Cloudinary
    try {
      import('cloudinary').then(({ v2: cloudinary }) => {
        cloudinary.v2.uploader.destroy(image.cloudinary_public_id).catch((err: any) => {
          console.warn('[CLOUDINARY] Failed to delete:', err)
        })
      })
    } catch (cloudinaryErr) {
      console.warn('[CLOUDINARY] Delete failed:', cloudinaryErr)
      // Don't fail if Cloudinary delete fails
    }

    // Delete from DB
    const { error } = await adminDb.from('product_images').delete().eq('id', imageId)

    if (error) {
      console.error('[ADMIN API] Image delete error:', error)
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
    }

    // If deleted image was primary, update products.image_url with next available image or null
    if (image.is_primary) {
      const { data: nextImage } = await adminDb
        .from('product_images')
        .select('url')
        .eq('product_id', image.product_id)
        .order('display_order', { ascending: true })
        .limit(1)
        .single()

      await adminDb
        .from('products')
        .update({ image_url: nextImage?.url ?? null })
        .eq('id', image.product_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADMIN API] Delete image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
