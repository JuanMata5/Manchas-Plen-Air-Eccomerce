// Script para poblar holder_phone en tickets existentes desde orders.buyer_phone
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateExistingTickets() {
  console.log('Updating existing tickets with holder_phone...')

  // Get tickets without holder_phone
  const { data: tickets, error: fetchError } = await supabase
    .from('tickets')
    .select('id, order_id, holder_phone')
    .is('holder_phone', null)

  if (fetchError) {
    console.error('Error fetching tickets:', fetchError)
    return
  }

  if (!tickets || tickets.length === 0) {
    console.log('No tickets to update')
    return
  }

  console.log(`Found ${tickets.length} tickets to update`)

  // Get unique order_ids
  const orderIds = [...new Set(tickets.map(t => t.order_id))]

  // Get buyer_phone for these orders
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('id, buyer_phone')
    .in('id', orderIds)

  if (orderError) {
    console.error('Error fetching orders:', orderError)
    return
  }

  const orderMap = new Map(orders?.map(o => [o.id, o.buyer_phone]) || [])

  // Update tickets
  for (const ticket of tickets) {
    const phone = orderMap.get(ticket.order_id)
    if (phone) {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ holder_phone: phone })
        .eq('id', ticket.id)

      if (updateError) {
        console.error(`Error updating ticket ${ticket.id}:`, updateError)
      } else {
        console.log(`Updated ticket ${ticket.id} with phone ${phone}`)
      }
    }
  }

  console.log('Update complete')
}

updateExistingTickets().catch(console.error)