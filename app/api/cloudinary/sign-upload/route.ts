import { NextRequest, NextResponse } from 'next/server'
import { generateUploadSignature } from '@/lib/cloudinary'

/**
 * POST /api/cloudinary/sign-upload
 * Generate signed upload parameters for client-side upload
 */
export async function POST(request: NextRequest) {
  try {
    const { folder = 'plenair/products', maxFileSize = 10485760 } = await request.json()

    // Validate folder starts with allowed prefix
    if (!folder.startsWith('plenair/')) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
    }

    const signature = generateUploadSignature(folder, maxFileSize)

    return NextResponse.json(signature)
  } catch (error) {
    console.error('[SIGN UPLOAD ERROR]', error)
    return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 })
  }
}
