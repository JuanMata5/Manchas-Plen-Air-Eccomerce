'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Check, Download, Share2 } from 'lucide-react';

interface TravelBooking {
  id: string;
  travel_id: string;
  plan_name: string;
  plan_price_usd: number;
  plan_variant: string;
  booking_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  payment_status: string;
  created_at: string;
}

interface TravelExperience {
  id: string;
  title: string;
  location: string;
  dates: string;
}

export default function ConfirmacionPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const experienciaId = params.experienciaId as string;
  const bookingRef = searchParams.get('ref');

  const supabase = createClient();

  const [booking, setBooking] = useState<TravelBooking | null>(null);
  const [experience, setExperience] = useState<TravelExperience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!bookingRef) {
          setError('Referencia de reserva no encontrada');
          setLoading(false);
          return;
        }

        // Fetch booking
        const { data: bookingData, error: bookingError } = await supabase
          .from('travel_bookings')
          .select('*')
          .eq('booking_reference', bookingRef)
          .single();

        if (bookingError) throw bookingError;
        setBooking(bookingData);

        // Fetch experience
        const { data: experienceData, error: experienceError } = await supabase
          .from('travel_experiences')
          .select('*')
          .eq('id', bookingData?.travel_id || experienciaId)
          .single();

        if (experienceError) throw experienceError;
        setExperience(experienceData);

      } catch (err: any) {
        setError(err.message || 'Error al cargar la confirmación');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bookingRef, experienciaId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Cargando confirmación...</div>
      </div>
    );
  }

  if (error || !booking || !experience) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="text-red-600 text-center mb-6">
          {error || 'No se encontró la reserva'}
        </div>
        <Link href="/tienda">
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">
            Volver a Tienda
          </button>
        </Link>
      </div>
    );
  }

  const downloadVoucher = async () => {
    try {
      const response = await fetch(`/api/travel-bookings/${booking.id}/voucher`);
      const html = await response.text();

      // Create blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voucher-${booking.booking_reference}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading voucher:', error);
      alert('Error al descargar el voucher');
    }
  };

  const shareBooking = async () => {
    const text = `Reservé una experiencia en Manchas Plen Air: ${experience.title} - Referencia: ${booking.booking_reference}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mi Reserva en Manchas Plen Air',
          text: text,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text);
      alert('Texto copiado al portapapeles');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-green-100 rounded-full p-4">
              <Check size={48} className="text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-xl text-slate-600">
            Tu experiencia ha sido reservada exitosamente
          </p>
        </div>

        {/* Confirmation Card */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          {/* Booking Reference */}
          <div className="bg-slate-50 rounded-lg p-6 mb-8 border-2 border-slate-200">
            <p className="text-sm text-slate-600 mb-1">Referencia de Reserva</p>
            <p className="text-2xl font-mono font-bold text-slate-900 mb-4">
              {booking.booking_reference}
            </p>
            <p className="text-xs text-slate-600">
              Guarda este número, lo necesitarás para cualquier consulta
            </p>
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-4">Experiencia</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-600">Nombre</p>
                  <p className="font-semibold text-slate-900">{experience.title}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Ubicación</p>
                  <p className="font-semibold text-slate-900">{experience.location}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Fechas</p>
                  <p className="font-semibold text-slate-900">{experience.dates}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-600 mb-4">Tu Reserva</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-600">Plan</p>
                  <p className="font-semibold text-slate-900">{booking.plan_name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Variante</p>
                  <p className="font-semibold text-slate-900">{booking.plan_variant}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Precio</p>
                  <p className="font-semibold text-green-600 text-lg">
                    ${booking.plan_price_usd} USD
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t pt-8 mb-8">
            <h3 className="text-sm font-semibold text-slate-600 mb-4">Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600">Nombre</p>
                <p className="font-semibold text-slate-900">{booking.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Email</p>
                <p className="font-semibold text-slate-900">{booking.customer_email}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Teléfono</p>
                <p className="font-semibold text-slate-900">{booking.customer_phone}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600">Estado de Pago</p>
                <p className="font-semibold text-amber-600 capitalize">
                  {booking.payment_status === 'pending' ? 'Pendiente' : booking.payment_status}
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 mb-3">Próximos Pasos</h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-700 text-sm">
              <li>Recibirás un email de confirmación con todos los detalles</li>
              <li>Próximamente recibirás instrucciones de pago</li>
              <li>Una vez confirmado el pago, accederás a tu voucher digital</li>
              <li>Nuestro equipo se pondrá en contacto para confirmar detalles</li>
            </ol>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={downloadVoucher}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <Download size={20} />
            Descargar Voucher
          </button>

          <button
            onClick={shareBooking}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            <Share2 size={20} />
            Compartir
          </button>

          <Link href="/tienda">
            <button className="w-full flex items-center justify-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-3 px-6 rounded-lg transition-colors">
              Ver Más Experiencias en Tienda
            </button>
          </Link>
        </div>

        {/* Contact Info */}
        <div className="text-center mt-12 pt-8 border-t">
          <p className="text-slate-600 mb-4">¿Tienes preguntas sobre tu reserva?</p>
          <p className="text-slate-900 font-semibold mb-2">contáctanos en:</p>
          <a
            href="https://wa.me/tu-numero"
            className="text-blue-600 hover:text-blue-800 font-semibold inline-block mb-2"
          >
            WhatsApp
          </a>
          <span className="text-slate-600 mx-2">•</span>
          <a
            href="mailto:reservas@manchasplenaircourts.com"
            className="text-blue-600 hover:text-blue-800 font-semibold inline-block"
          >
            Email
          </a>
        </div>
      </div>
    </div>
  );
}
