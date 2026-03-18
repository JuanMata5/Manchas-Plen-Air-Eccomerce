import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/orders/check-first-purchase
 * Checks if the current user has any previous orders to determine if they are eligible for a first-purchase discount.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // If there is no user, they are not eligible for a logged-in-user-specific discount.
    if (!user) {
      return NextResponse.json({ is_first_purchase: false })
    }

    // Check if any order exists for this user.
    // We use { count: 'exact', head: true } for performance, as it only counts without returning data.
    const { count, error } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) {
      console.error('[API Check First Purchase] Error querying orders:', error)
      // In case of a database error, it's safer to deny the discount.
      return NextResponse.json({ is_first_purchase: false })
    }

    // If the order count is 0, it is indeed their first purchase.
    return NextResponse.json({ is_first_purchase: count === 0 })

  } catch (err) {
      console.error('[API Check First Purchase Error]', err)
      // In case of a general error, deny the discount to be safe.
      return NextResponse.json({ is_first_purchase: false })
  }
}
