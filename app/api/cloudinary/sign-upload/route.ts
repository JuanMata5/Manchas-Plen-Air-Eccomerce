import { NextRequest, NextResponse } from 'next/server'
import { generateUploadSignature } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { folder = 'plenair/products' } = body

    // LOG: Verificar la carpeta recibida
    console.log('[Sign API] Folder:', folder)

    if (!folder.startsWith('plenair/')) {
      console.error('[Sign API] Invalid folder:', folder)
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
    }

    const signature = generateUploadSignature(folder)
    
    // LOG: Verificar la firma generada
    console.log('[Sign API] Generated Signature:', signature)

    return NextResponse.json(signature)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[SIGN UPLOAD ERROR]', errorMessage)
    return NextResponse.json({ error: 'Failed to generate signature', details: errorMessage }, { status: 500 })
  }
}
