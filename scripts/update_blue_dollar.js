require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Dólar Blue conversion rate (April 2026 estimate)
// Using 1100 ARS per USD as a reasonable blue dollar rate
const BLUE_DOLLAR_RATE = 1100;

async function updatePricesToBlueDollar() {
  try {
    console.log('🔵 Actualizando precios a dólar blue...\n');
    console.log(`Tasa de conversión: 1 USD = ${BLUE_DOLLAR_RATE} ARS\n`);

    // Fetch current travel experiences
    const { data: experiences, error: fetchError } = await supabase
      .from('travel_experiences')
      .select('*');

    if (fetchError) throw fetchError;

    // Update each experience's plans with blue dollar prices
    for (const experience of experiences) {
      const updatedPlans = experience.plans.map(plan => ({
        ...plan,
        price_ars_blue: Math.round(plan.price_usd * BLUE_DOLLAR_RATE),
        price_usd: plan.price_usd // Keep original USD price for reference
      }));

      const { error: updateError } = await supabase
        .from('travel_experiences')
        .update({ plans: updatedPlans })
        .eq('id', experience.id);

      if (updateError) throw updateError;

      console.log(`✅ ${experience.title}`);
      updatedPlans.forEach(plan => {
        console.log(`   ${plan.name}: $${plan.price_usd} USD → ${plan.price_ars_blue.toLocaleString('es-AR')} ARS`);
      });
    }

    console.log('\n✅ Todos los precios actualizados a dólar blue');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

updatePricesToBlueDollar();
