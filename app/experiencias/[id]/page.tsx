'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, Users, ArrowLeft, Check, X } from 'lucide-react';

interface Plan {
  name: string;
  price_usd: number;
  variants: string[];
  includes: string[];
  not_includes: string[];
}

interface TravelExperience {
  id: string;
  title: string;
  location: string;
  dates: string;
  description: string;
  capacity: number;
  image_url: string;
  gallery: string[];
  plans: Plan[];
  is_active: boolean;
  created_at: string;
}

export default function ExperienceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [experience, setExperience] = useState<TravelExperience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('travel_experiences')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        setExperience(data);
        if (data?.plans && data.plans.length > 0) {
          setSelectedPlan(0);
        }
      } catch (err: any) {
        setError(err.message || 'Error al cargar la experiencia');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExperience();
    }
  }, [id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Cargando experiencia...</div>
      </div>
    );
  }

  if (error || !experience) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="text-slate-600 text-center mb-6">
          {error || 'La experiencia no fue encontrada'}
        </div>
        <Link href="/experiencias">
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">
            <ArrowLeft size={20} />
            Volver a Experiencias
          </button>
        </Link>
      </div>
    );
  }

  const selectedPlanData = selectedPlan !== null ? experience.plans[selectedPlan] : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/experiencias">
            <button className="flex items-center gap-2 text-slate-900 hover:text-slate-600 font-semibold">
              <ArrowLeft size={20} />
              Volver a Experiencias
            </button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Side - Image & Details */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="relative h-96 w-full bg-slate-200 rounded-lg overflow-hidden mb-8">
              {experience.image_url ? (
                <Image
                  src={experience.image_url}
                  alt={experience.title}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-300 to-slate-400" />
              )}
            </div>

            {/* Title & Key Info */}
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              {experience.title}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center gap-3 text-slate-700">
                <MapPin size={24} />
                <div>
                  <p className="text-sm text-slate-600">Ubicación</p>
                  <p className="font-semibold">{experience.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <Calendar size={24} />
                <div>
                  <p className="text-sm text-slate-600">Fechas</p>
                  <p className="font-semibold text-sm">{experience.dates}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <Users size={24} />
                <div>
                  <p className="text-sm text-slate-600">Disponibles</p>
                  <p className="font-semibold">{experience.capacity} cupos</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Descripción</h2>
              <p className="text-slate-700 text-lg leading-relaxed">
                {experience.description}
              </p>
            </div>

            {/* Gallery */}
            {experience.gallery && experience.gallery.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Galería</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {experience.gallery.map((image, idx) => (
                    <div
                      key={idx}
                      className="relative h-48 bg-slate-200 rounded-lg overflow-hidden"
                    >
                      <Image
                        src={image}
                        alt={`Galería ${idx + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Booking Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-8 sticky top-20">
              {/* Plan Selection */}
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Elige tu Plan</h2>

              <div className="space-y-3 mb-8">
                {experience.plans.map((plan, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPlan(idx)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedPlan === idx
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900">{plan.name}</p>
                        {plan.variants.length > 0 && (
                          <p className="text-sm text-slate-600">
                            {plan.variants[0]}
                          </p>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-green-600">
                        ${plan.price_usd}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Plan Details */}
              {selectedPlanData && (
                <div className="mb-8">
                  <div className="mb-6">
                    <h3 className="font-semibold text-slate-900 mb-3">Incluye:</h3>
                    <ul className="space-y-2">
                      {selectedPlanData.includes.map((item, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-slate-700">
                          <Check size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3">No Incluye:</h3>
                    <ul className="space-y-2">
                      {selectedPlanData.not_includes.map((item, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-slate-600">
                          <X size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <Link href={`/app/viajes/reservar/${experience.id}`}>
                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 text-lg">
                  Reservar Ahora
                </button>
              </Link>

              <p className="text-xs text-slate-500 text-center mt-4">
                Serás redirigido al formulario de reserva
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
