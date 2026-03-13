import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiLimiter, withRateLimit } from '@/lib/rate-limit'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const rateLimited = withRateLimit(request, apiLimiter)
    if (rateLimited) return rateLimited

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const orderId = formData.get('order_id') as string | null

    if (!file || !orderId) {
      return NextResponse.json({ error: 'Archivo y order_id requeridos' }, { status: 400 })
    }

    const supabase = await createClient()
    const adminDb = createAdminClient()

    // Auth check - verify user owns this order
    const { data: { user } } = await supabase.auth.getUser()

    const { data: order } = await adminDb
      .from('orders')
      .select('id, payment_method, user_id, buyer_email')
      .eq('id', orderId)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // IDOR protection: only the order owner can upload a receipt
    if (user && order.user_id && user.id !== order.user_id) {
      return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
    }

    // Upload to Cloudinary
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'plenair/receipts',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        },
      )
      stream.end(buffer)
    })

    // Save receipt URL to order
    await adminDb
      .from('orders')
      .update({ receipt_url: result.secure_url })
      .eq('id', orderId)

    return NextResponse.json({ receipt_url: result.secure_url })
  } catch (err) {
    console.error('[RECEIPT] Upload error:', err)
    return NextResponse.json({ error: 'Error al subir comprobante' }, { status: 500 })
  }
}
