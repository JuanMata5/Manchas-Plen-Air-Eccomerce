const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    // Create travel_experiences table
    const { error: table1Error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.travel_experiences (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          location TEXT NOT NULL,
          dates TEXT NOT NULL,
          description TEXT NOT NULL,
          capacity INTEGER NOT NULL,
          image_url TEXT,
          gallery JSONB DEFAULT '[]'::jsonb,
          plans JSONB NOT NULL DEFAULT '[]'::jsonb,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (table1Error) {
      console.error('Error creating travel_experiences table:', table1Error);
    } else {
      console.log('Created travel_experiences table');
    }

    // Create travel_bookings table
    const { error: table2Error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.travel_bookings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          travel_id TEXT NOT NULL,
          user_id UUID,
          plan_name TEXT NOT NULL,
          plan_price_usd INTEGER NOT NULL,
          plan_variant TEXT,
          booking_reference TEXT UNIQUE NOT NULL,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          status TEXT DEFAULT 'confirmed',
          payment_status TEXT DEFAULT 'paid',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (table2Error) {
      console.error('Error creating travel_bookings table:', table2Error);
    } else {
      console.log('Created travel_bookings table');
    }

    console.log('Tables created successfully!');
  } catch (err) {
    console.error('Error:', err);
  }
}

createTables();