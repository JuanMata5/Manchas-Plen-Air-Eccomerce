import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Users, DollarSign } from 'lucide-react';

export const metadata = {
  title: 'Experiencias y Viajes Premium | Manchas Plen Air',
  description: 'Descubre nuestras experiencias de viaje exclusivas a Trevelin'
};

interface TravelExperience {
  id: string;
  title: string;
  location: string;
  dates: string;
  description: string;
  capacity: number;
  image_url: string;
  plans: Array<{
    name: string;
    price_usd: number;
  }>;
  is_active: boolean;
}

export default async function ExperienciasPage() {
  const supabase = await createClient();

  const { data: experiences, error } = await supabase
    .from('travel_experiences')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching experiences:', error);
  }

  const travelExperiences: TravelExperience[] = experiences || [];

  const getMinPrice = (experience: TravelExperience) => {
    if (!experience.plans || experience.plans.length === 0) return 0;
    return Math.min(...experience.plans.map(p => p.price_usd));
  };

  const getMinPriceARS = (experience: TravelExperience) => {
    if (!experience.plans || experience.plans.length === 0) return 0;
    return Math.min(...experience.plans.map(p => (p as any).price_ars_blue || p.price_usd * 1100));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Experiencias Premium
          </h1>
          <p className="text-xl text-slate-200 max-w-2xl">
            Descubre viajes exclusivos diseñados para enriquecer tu alma y expandir tu creatividad
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {travelExperiences.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-600 text-lg">No hay experiencias disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {travelExperiences.map((experience) => (
                <div
                  key={experience.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  {/* Image */}
                  <div className="relative h-64 w-full bg-slate-200">
                    {experience.image_url ? (
                      <Image
                        src={experience.image_url}
                        alt={experience.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                        <span className="text-slate-500">Sin imagen</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {experience.title}
                    </h3>

                    {/* Location */}
                    <div className="flex items-center text-slate-600 mb-3">
                      <MapPin size={18} className="mr-2 flex-shrink-0" />
                      <span className="text-sm">{experience.location}</span>
                    </div>

                    {/* Dates */}
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      📅 {experience.dates}
                    </p>

                    {/* Description */}
                    <p className="text-slate-700 text-sm mb-4 line-clamp-3">
                      {experience.description}
                    </p>

                    {/* Capacity */}
                    <div className="flex items-center text-slate-600 mb-4">
                      <Users size={18} className="mr-2" />
                      <span className="text-sm">{experience.capacity} cupos disponibles</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign size={18} className="text-green-600" />
                          <span className="text-lg font-bold text-green-600">
                            {getMinPrice(experience)} USD
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 font-medium">
                          Desde ${getMinPriceARS(experience).toLocaleString('es-AR')} ARS
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Link href={`/experiencias/${experience.id}`}>
                      <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200">
                        Ver Detalles
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            ¿Preguntas sobre alguna experiencia?
          </h2>
          <p className="text-slate-600 mb-6">
            Contacta con nuestro equipo para obtener más información personalizada
          </p>
          <Link href="/contact">
            <button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200">
              Contactar
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}
