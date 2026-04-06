import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/orders/check-first-purchase
 * First-purchase discount disabled globally.
 */
export async function GET(_request: NextRequest) {
  try {
    return NextResponse.json({ is_first_purchase: false })
  } catch (err) {
    console.error('[API Check First Purchase Error]', err)
    return NextResponse.json({ is_first_purchase: false })
  }
}
