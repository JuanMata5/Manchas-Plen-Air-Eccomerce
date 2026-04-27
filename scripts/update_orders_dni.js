// Script para poblar buyer_dni en orders existentes desde user_metadata
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateExistingOrders() {
  console.log('Updating existing orders with buyer_dni...')

  // Get orders without buyer_dni
  const { data: orders, error: fetchError } = await supabase
    .from('orders')
    .select('id, user_id, buyer_dni')
    .is('buyer_dni', null)
    .not('user_id', 'is', null)

  if (fetchError) {
    console.error('Error fetching orders:', fetchError)
    return
  }

  if (!orders || orders.length === 0) {
    console.log('No orders to update')
    return
  }

  console.log(`Found ${orders.length} orders to update`)

  // Get unique user_ids
  const userIds = [...new Set(orders.map(o => o.user_id))]

  // Get dni for these users
  const { data: users, error: userError } = await supabase.auth.admin.listUsers()

  if (userError) {
    console.error('Error fetching users:', userError)
    return
  }

  const userMap = new Map(users.users.map(u => [u.id, u.user_metadata?.dni]))

  // Update orders
  for (const order of orders) {
    const dni = userMap.get(order.user_id)
    if (dni) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ buyer_dni: dni })
        .eq('id', order.id)

      if (updateError) {
        console.error(`Error updating order ${order.id}:`, updateError)
      } else {
        console.log(`Updated order ${order.id} with dni ${dni}`)
      }
    }
  }

  console.log('Update complete')
}

updateExistingOrders().catch(console.error)