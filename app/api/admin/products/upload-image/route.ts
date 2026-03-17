import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/admin/products/upload-image
 * Save Cloudinary image reference to the database using a robust transaction.
 */
export async function POST(request: NextRequest) {
  const adminDb = createAdminClient()

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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

    // 🔥 CORRECCIÓN: Usar una transacción (RPC call) para asegurar la consistencia de los datos
    const { data, error } = await adminDb.rpc('add_product_image_and_update_primary', {
      p_product_id: product_id,
      p_cloudinary_public_id: cloudinary_public_id,
      p_url: url,
      p_width: width,
      p_height: height,
      p_is_primary: is_primary,
      p_display_order: display_order
    });

    if (error) {
      console.error('[ADMIN API] RPC add_product_image_and_update_primary error:', error)
      return NextResponse.json({ error: 'Failed to save image transactionally.', details: error.message }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ADMIN API] Upload image unhandled error:', error, { originalError: error })
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 })
  }
}
