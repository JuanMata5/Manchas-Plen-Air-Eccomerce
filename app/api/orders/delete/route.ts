import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { order_id } = await request.json()
    if (!order_id) {
      return NextResponse.json({ error: 'order_id requerido' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    // Verify the order belongs to this user
    const { data: order } = await adminDb
      .from('orders')
      .select('id, user_id, status')
      .eq('id', order_id)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      // Also allow admin to delete any order
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
      }
    }

    // Delete order items first, then order
    await adminDb.from('order_items').delete().eq('order_id', order_id)
    const { error } = await adminDb.from('orders').delete().eq('id', order_id)

    if (error) {
      console.error('[ORDERS] Delete error:', error)
      return NextResponse.json({ error: 'Error al eliminar la orden' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[ORDERS] Delete error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
