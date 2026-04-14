'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, Loader, Check } from 'lucide-react';

interface Plan {
  name: string;
  price_usd: number;
  price_ars_blue?: number;
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
  plans: Plan[];
}

interface FormData {
  plan: number | null;
  variant: string;
  fullName: string;
  email: string;
  phone: string;
  agreedToTerms: boolean;
}

export default function TravelCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const experienciaId = params.experienciaId as string;
  const supabase = createClient();

  const [experience, setExperience] = useState<TravelExperience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    plan: null,
    variant: '',
    fullName: '',
    email: '',
    phone: '',
    agreedToTerms: false,
  });

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!experience || formData.plan === null) {
      setError('Por favor selecciona un plan');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const selectedPlan = experience.plans[formData.plan];
      
      // Call API to create booking
      const response = await fetch('/api/travel-bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          travelId: experience.id,
          planName: selectedPlan.name,
          planPrice: selectedPlan.price_usd,
          planVariant: formData.variant || selectedPlan.variants[0],
          customerName: formData.fullName,
          customerEmail: formData.email,
          customerPhone: formData.phone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la reserva');
      }

      const result = await response.json();

      // Redirect to confirmation page
      setSuccess(true);
      setTimeout(() => {
        router.push(`/experiencias/${experience.id}/confirmacion?ref=${result.booking.bookingReference}`);
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Error al crear la reserva');
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {success && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6 flex gap-4">
            <Check size={24} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-green-900">¡Reserva creada!</h3>
              <p className="text-green-800 text-sm mt-1">Redirigiendo a confirmación...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-6 flex gap-4">
            <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900">Error</h3>
              <p className="text-red-800 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-8">
                Reserva tu Experiencia
              </h1>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Plan Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-4">
                    1. Selecciona tu Plan
                  </label>
                  <div className="space-y-3">
                    {experience.plans.map((plan, idx) => (
                      <label
                        key={idx}
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.plan === idx
                            ? 'border-slate-900 bg-slate-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="planSelection"
                            value={idx}
                            checked={formData.plan === idx}
                            onChange={() => setFormData(prev => ({ ...prev, plan: idx }))}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{plan.name}</p>
                            {plan.variants.length > 0 && (
                              <p className="text-sm text-slate-600">{plan.variants[0]}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              ${plan.price_usd}
                            </p>
                            <p className="text-xs text-slate-600 font-medium">
                              ${((plan as any).price_ars_blue || plan.price_usd * 1100).toLocaleString('es-AR')} ARS
                            </p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    2. Datos Personales
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Teléfono / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                        placeholder="Ej: +54 9 11 1234-5678"
                      />
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="agreedToTerms"
                      checked={formData.agreedToTerms}
                      onChange={handleInputChange}
                      className="w-4 h-4 mt-1 flex-shrink-0"
                    />
                    <span className="text-sm text-slate-700">
                      Acepto los términos y condiciones y la política de privacidad
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !formData.agreedToTerms || formData.plan === null}
                  className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                    submitting || !formData.agreedToTerms || formData.plan === null
                      ? 'bg-slate-400 text-slate-600 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader size={20} className="animate-spin" />
                      Procesando...
                    </span>
                  ) : (
                    'Confirmar Reserva'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Resumen</h3>

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
              </div>

              {formData.plan !== null && (
                <div className="pt-6">
                  <div className="mb-4">
                    <p className="text-sm text-slate-600">Plan Seleccionado</p>
                    <p className="font-semibold text-slate-900">
                      {experience.plans[formData.plan].name}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t mb-4">
                    <p className="font-semibold text-slate-900">Precio USD</p>
                    <p className="text-xl font-bold text-green-600">
                      ${experience.plans[formData.plan].price_usd} USD
                    </p>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b">
                    <p className="font-semibold text-slate-900">Precio ARS (Dólar Blue)</p>
                    <p className="text-lg font-bold text-blue-600">
                      ${((experience.plans[formData.plan] as any).price_ars_blue || experience.plans[formData.plan].price_usd * 1100).toLocaleString('es-AR')} ARS
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
