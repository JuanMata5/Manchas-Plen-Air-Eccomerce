// Script para poblar holder_dni en tickets existentes desde orders.buyer_dni
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateExistingTickets() {
  console.log('Updating existing tickets with holder_dni...')

  // Get tickets without holder_dni
  const { data: tickets, error: fetchError } = await supabase
    .from('tickets')
    .select('id, order_id, holder_dni')
    .is('holder_dni', null)

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

  // Get buyer_dni for these orders
  const { data: orders, error: orderError } = await supabase
    .from('orders')
    .select('id, buyer_dni')
    .in('id', orderIds)

  if (orderError) {
    console.error('Error fetching orders:', orderError)
    return
  }

  const orderMap = new Map(orders?.map(o => [o.id, o.buyer_dni]) || [])

  // Update tickets
  for (const ticket of tickets) {
    const dni = orderMap.get(ticket.order_id)
    if (dni) {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ holder_dni: dni })
        .eq('id', ticket.id)

      if (updateError) {
        console.error(`Error updating ticket ${ticket.id}:`, updateError)
      } else {
        console.log(`Updated ticket ${ticket.id} with dni ${dni}`)
      }
    }
  }

  console.log('Update complete')
}

updateExistingTickets().catch(console.error)