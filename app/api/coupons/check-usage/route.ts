import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/coupons/check-usage
 * Checks if the current user has used a specific coupon code in past orders.
 * @param {string} code - The coupon code to check, passed as a query parameter.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    const { data: { user } } = await supabase.auth.getUser()

    // If there is no user, they can't have used the coupon.
    // We can show the banner.
    if (!user) {
      return NextResponse.json({ used: false })
    }

    // Check for any order from this user that used the specified coupon.
    // We check for `coupon_code` specifically, assuming it's stored on the order.
    const { data: order, error } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .eq('coupon_code', code)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error checking coupon usage:', error)
      // In case of a DB error, default to not hiding the banner.
      return NextResponse.json({ used: false })
    }

    // If an order exists, the coupon has been used.
    return NextResponse.json({ used: !!order })

  } catch (err) {
      console.error('[API Coupon Check Error]', err)
      // Default to not hiding to avoid penalizing the user for a server error.
      return NextResponse.json({ used: false })
  }
}
