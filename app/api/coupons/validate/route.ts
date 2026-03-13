import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json()

    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json({ error: 'Datos invalidos' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single()

    if (error || !coupon) {
      return NextResponse.json({ valid: false, error: 'Cupon no valido' }, { status: 400 })
    }

    const now = new Date().toISOString()

    if (coupon.valid_from && now < coupon.valid_from) {
      return NextResponse.json({ valid: false, error: 'El cupon aun no esta vigente' }, { status: 400 })
    }

    if (coupon.valid_until && now > coupon.valid_until) {
      return NextResponse.json({ valid: false, error: 'El cupon expiro' }, { status: 400 })
    }

    if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
      return NextResponse.json({ valid: false, error: 'El cupon alcanzo su limite de usos' }, { status: 400 })
    }

    if (coupon.min_order_ars !== null && subtotal < coupon.min_order_ars) {
      return NextResponse.json(
        {
          valid: false,
          error: `El cupon requiere un minimo de $${coupon.min_order_ars.toLocaleString('es-AR')}`,
        },
        { status: 400 },
      )
    }

    const discountAmount =
      coupon.discount_type === 'percentage'
        ? Math.round((subtotal * coupon.discount_value) / 100)
        : coupon.discount_value

    return NextResponse.json({
      valid: true,
      discount_amount: discountAmount,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      description: coupon.description ?? `Descuento ${coupon.code}`,
      coupon_id: coupon.id,
    })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
