'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Loader, Check, MapPin, Calendar, Users, Star } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface Plan {
  name: string;
  price_usd: number;
  price_ars_blue?: number;
  variants: string[];
  includes: string[];
  not_includes?: string[];
}

interface TravelExperience {
  id: string;
  title: string;
  location: string;
  dates: string;
  description: string;
  capacity: number;
  image_url: string;
  plans: Plan[];
  is_active: boolean;
}

function getARSPrice(plan: Plan) {
  return plan.price_ars_blue ?? Math.round(plan.price_usd * 1100);
}

export default function TravelCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const experienciaId = params.experienciaId as string;
  const supabase = createClient();
  const { addToCart } = useCartStore();
  const { toast } = useToast();

  const [experience, setExperience] = useState<TravelExperience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(0);

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('travel_experiences')
          .select('*')
          .eq('id', experienciaId)
          .single();

        if (fetchError) throw fetchError;
        setExperience(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar la experiencia');
      } finally {
        setLoading(false);
      }
    };

    if (experienciaId) {
      fetchExperience();
    }
  }, [experienciaId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Cargando información...</div>
      </div>
    );
  }

  if (error && !experience) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="text-red-600 text-center mb-6">{error}</div>
        <Link href="/experiencias">
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">
            <ArrowLeft size={20} />
            Volver
          </button>
        </Link>
      </div>
    );
  }

  if (!experience) {
    return null;
  }

  const plan = experience.plans[selectedPlan];
  const planPriceARS = getARSPrice(plan);
  const isTrevelin = experience.location.toLowerCase().includes('trevelin') || experience.title.toLowerCase().includes('trevelin');
  const requiresMinimum = isTrevelin && planPriceARS < 500000;

  const handleAddToCart = async () => {
    if (!plan) return;

    if (requiresMinimum) {
      toast({
        title: 'Reserva Trevelin no permitida',
        description: 'Los viajes a Trevelin se pueden reservar desde $500.000 ARS.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      addToCart({
        type: 'experience',
        id: experience.id,
        name: experience.title,
        price_usd: plan.price_usd,
        price_ars_blue: planPriceARS,
        quantity: 1,
        image_url: experience.image_url,
        metadata: {
          experienceId: experience.id,
          planIndex: selectedPlan,
          planName: plan.name,
          location: experience.location,
          dates: experience.dates,
        },
      });

      toast({
        title: 'Experiencia agregada al carrito',
        description: `${experience.title} - ${plan.name}`,
      });
      router.push('/carrito');
    } catch (err) {
      console.error('Error al agregar al carrito:', err);
      toast({
        title: 'Error',
        description: 'No se pudo agregar la experiencia al carrito.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/tienda">
            <button className="flex items-center gap-2 text-slate-900 hover:text-slate-600">
              <ArrowLeft size={20} />
              Volver a Tienda
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Reserva tu experiencia</h1>
          <p className="text-slate-600 mt-2">Selecciona el plan y agrégalo al carrito para finalizar la reserva.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Experience Details */}
            <div className="bg-white rounded-3xl shadow p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{experience.title}</h2>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    {experience.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    {experience.dates}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    Capacidad: {experience.capacity} personas
                  </div>
                </div>
                <p className="text-slate-700">{experience.description}</p>
              </div>

              {experience.image_url && (
                <div className="mb-6">
                  <img
                    src={experience.image_url}
                    alt={experience.title}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                </div>
              )}
            </div>

            {/* Plan Selection */}
            <div className="bg-white rounded-3xl shadow p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Selecciona tu Plan</h3>
              <div className="space-y-4">
                {experience.plans.map((plan, idx) => (
                  <div
                    key={idx}
                    className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                      selectedPlan === idx
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedPlan(idx)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="plan"
                          checked={selectedPlan === idx}
                          onChange={() => setSelectedPlan(idx)}
                          className="w-4 h-4"
                        />
                        <div>
                          <h4 className="text-lg font-semibold text-slate-900">{plan.name}</h4>
                          {plan.variants.length > 0 && (
                            <p className="text-sm text-slate-600">{plan.variants.join(', ')}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${plan.price_usd} USD
                        </p>
                        <p className="text-sm text-slate-600">
                          ${getARSPrice(plan).toLocaleString('es-AR')} ARS
                        </p>
                      </div>
                    </div>

                    {selectedPlan === idx && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        {plan.includes.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-semibold text-slate-900 mb-2">Incluye:</h5>
                            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                              {plan.includes.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {plan.not_includes && plan.not_includes.length > 0 && (
                          <div>
                            <h5 className="font-semibold text-slate-900 mb-2">No incluye:</h5>
                            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                              {plan.not_includes.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isTrevelin && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex gap-3">
                    <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">Información importante</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        Los viajes a Trevelin tienen un valor mínimo de reserva de $500.000 ARS.
                        {requiresMinimum && (
                          <span className="block mt-1 font-medium">
                            El plan seleccionado no cumple con el mínimo requerido.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow p-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Resumen de Reserva</h3>

              <div className="space-y-4 pb-6 border-b">
                <div>
                  <p className="text-sm text-slate-600">Experiencia</p>
                  <p className="font-semibold text-slate-900">{experience.title}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-600">Ubicación</p>
                  <p className="font-semibold text-slate-900">{experience.location}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-600">Fechas</p>
                  <p className="font-semibold text-slate-900 text-sm">{experience.dates}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-600">Plan Seleccionado</p>
                  <p className="font-semibold text-slate-900">{plan.name}</p>
                </div>
              </div>

              <div className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <p className="font-semibold text-slate-900">Precio USD</p>
                  <p className="text-xl font-bold text-green-600">
                    ${plan.price_usd} USD
                  </p>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <p className="font-semibold text-slate-900">Precio ARS (Dólar Blue)</p>
                  <p className="text-lg font-bold text-blue-600">
                    ${planPriceARS.toLocaleString('es-AR')} ARS
                  </p>
                </div>

                <Button
                  onClick={handleAddToCart}
                  disabled={submitting || requiresMinimum}
                  className="w-full py-4 text-lg font-bold"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader size={20} className="animate-spin mr-2" />
                      Agregando...
                    </>
                  ) : (
                    'Agregar al Carrito'
                  )}
                </Button>

                {requiresMinimum && (
                  <p className="text-sm text-red-600 mt-2 text-center">
                    Plan no disponible - mínimo $500.000 ARS
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

