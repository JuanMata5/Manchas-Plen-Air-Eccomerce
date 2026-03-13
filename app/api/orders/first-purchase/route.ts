import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ first_purchase: false })
    }

    const adminDb = createAdminClient()

    // Check if user has any paid/completed orders
    const { data: orders } = await adminDb
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .in('status', ['paid', 'refunded'])
      .limit(1)

    const isFirstPurchase = !orders || orders.length === 0

    return NextResponse.json({
      first_purchase: isFirstPurchase,
      discount_percent: isFirstPurchase ? 5 : 0,
    })
  } catch {
    return NextResponse.json({ first_purchase: false, discount_percent: 0 })
  }
}
