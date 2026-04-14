require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedTravelProducts() {
  const travels = [
    {
      id: 'plan-completo-trevelin-sin-avion',
      title: 'Plan Completo Trevelin (Sin Avión)',
      location: 'Trevelin, Chubut',
      dates: 'Del 15 al 22 de noviembre 2026',
      description: 'Experiencia completa en Trevelin con alojamiento, comidas y actividades artísticas. Incluye traslado terrestre desde Buenos Aires.',
      capacity: 20,
      image_url: '/images/trevelin-sin-avion.jpg',
      gallery: ['/images/trevelin-1.jpg', '/images/trevelin-2.jpg', '/images/trevelin-3.jpg'],
      plans: JSON.stringify([
        {
          name: 'Plan Compartido',
          price_usd: 1280,
          variants: ['Habitación compartida'],
          includes: [
            'Traslado terrestre desde Buenos Aires',
            '7 noches de alojamiento en cabañas',
            'Pensión completa',
            'Actividades artísticas diarias',
            'Materiales incluidos',
            'Guía especializado',
            'Seguro de viaje'
          ],
          not_includes: [
            'Vuelos internacionales',
            'Gastos personales',
            'Propinas'
          ]
        },
        {
          name: 'Habitación Individual',
          price_usd: 1430,
          variants: ['Habitación individual'],
          includes: [
            'Traslado terrestre desde Buenos Aires',
            '7 noches de alojamiento en cabañas (individual)',
            'Pensión completa',
            'Actividades artísticas diarias',
            'Materiales incluidos',
            'Guía especializado',
            'Seguro de viaje'
          ],
          not_includes: [
            'Vuelos internacionales',
            'Gastos personales',
            'Propinas'
          ]
        }
      ]),
      is_active: true
    },
    {
      id: 'plan-completo-trevelin-con-avion',
      title: 'Plan Completo Trevelin (Con Avión)',
      location: 'Trevelin, Chubut',
      dates: 'Del 15 al 22 de noviembre 2026',
      description: 'Experiencia premium en Trevelin con vuelos incluidos. Alojamiento, comidas y actividades artísticas completas.',
      capacity: 15,
      image_url: '/images/trevelin-con-avion.jpg',
      gallery: ['/images/trevelin-1.jpg', '/images/trevelin-2.jpg', '/images/trevelin-3.jpg'],
      plans: JSON.stringify([
        {
          name: 'Plan Compartido',
          price_usd: 1470,
          variants: ['Habitación compartida'],
          includes: [
            'Vuelos Buenos Aires - Esquel ida y vuelta',
            'Traslado aeropuerto - Trevelin',
            '7 noches de alojamiento en cabañas',
            'Pensión completa',
            'Actividades artísticas diarias',
            'Materiales incluidos',
            'Guía especializado',
            'Seguro de viaje'
          ],
          not_includes: [
            'Gastos personales',
            'Propinas'
          ]
        },
        {
          name: 'Habitación Individual',
          price_usd: 1610,
          variants: ['Habitación individual'],
          includes: [
            'Vuelos Buenos Aires - Esquel ida y vuelta',
            'Traslado aeropuerto - Trevelin',
            '7 noches de alojamiento en cabañas (individual)',
            'Pensión completa',
            'Actividades artísticas diarias',
            'Materiales incluidos',
            'Guía especializado',
            'Seguro de viaje'
          ],
          not_includes: [
            'Gastos personales',
            'Propinas'
          ]
        }
      ]),
      is_active: true
    },
    {
      id: 'solo-experiencias-artisticas',
      title: 'Solo Experiencias Artísticas',
      location: 'Trevelin, Chubut',
      dates: 'Del 15 al 22 de noviembre 2026',
      description: 'Enfoque exclusivo en las experiencias artísticas. Incluye talleres intensivos, materiales premium y mentoría personalizada.',
      capacity: 12,
      image_url: '/images/experiencias-artisticas.jpg',
      gallery: ['/images/art-1.jpg', '/images/art-2.jpg', '/images/art-3.jpg'],
      plans: JSON.stringify([
        {
          name: 'Experiencia Artística Completa',
          price_usd: 650,
          variants: ['Sin alojamiento'],
          includes: [
            'Talleres artísticos intensivos (8 horas diarias)',
            'Materiales premium incluidos',
            'Mentoría personalizada',
            'Acceso a estudio privado',
            'Certificado de participación',
            'Sesiones de networking'
          ],
          not_includes: [
            'Alojamiento',
            'Comidas',
            'Traslados',
            'Vuelos',
            'Seguro de viaje'
          ]
        }
      ]),
      is_active: true
    }
  ];

  try {
    console.log('Inserting travel experiences...');
    const { data, error } = await supabase
      .from('travel_experiences')
      .upsert(travels, { onConflict: 'id' });

    if (error) {
      console.error('Error inserting travels:', error);
      process.exit(1);
    }

    console.table(travels.map(t => ({ id: t.id, title: t.title, capacity: t.capacity })));
    console.log('\n✅ All travel products created successfully!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seedTravelProducts();
