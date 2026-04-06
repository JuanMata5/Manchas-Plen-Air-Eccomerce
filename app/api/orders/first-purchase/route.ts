import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ first_purchase: false, discount_percent: 0 })
    }

    return NextResponse.json({
      first_purchase: false,
      discount_percent: 0,
    })
  } catch {
    return NextResponse.json({ first_purchase: false, discount_percent: 0 })
  }
}
