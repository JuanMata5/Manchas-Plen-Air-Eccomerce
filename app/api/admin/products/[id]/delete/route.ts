import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { deleteFile } from '@/lib/cloudinary'

/**
 * DELETE /api/admin/products/[id]
 * Delete product and associated images by ID from dynamic route
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
          // Continue with DB deletion even if Cloudinary fails
        }
      }
    }

    // Delete product (cascade will delete product_images and order_items)
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
