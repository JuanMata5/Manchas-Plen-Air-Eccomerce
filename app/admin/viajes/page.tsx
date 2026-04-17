'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Download, Eye, EyeOff, CheckCircle, XCircle, Clock } from 'lucide-react';

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

export default function AdminViajosPage() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<TravelBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        let query = supabase
          .from('travel_bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (filterStatus !== 'all') {
          query = query.eq('status', filterStatus);
        }

        if (filterPayment !== 'all') {
          query = query.eq('payment_status', filterPayment);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        let filtered = data || [];

        if (searchTerm) {
          filtered = filtered.filter(
            b =>
              b.booking_reference.includes(searchTerm.toUpperCase()) ||
              b.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              b.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setBookings(filtered);
      } catch (err: any) {
        setError(err.message || 'Error al cargar reservas');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [filterStatus, filterPayment, searchTerm, supabase]);

  const getStatusBadge = (status: string) => {
    const badgeClass =
      status === 'confirmed'
        ? 'bg-green-100 text-green-800'
        : status === 'pending'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800';

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
        {status === 'confirmed' && '✓ Confirmada'}
        {status === 'pending' && '⏳ Pendiente'}
        {status === 'cancelled' && '✗ Cancelada'}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    const badgeClass =
      status === 'paid'
        ? 'bg-green-100 text-green-800'
        : status === 'pending'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800';

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
        {status === 'paid' && '✓ Pagado'}
        {status === 'pending' && '⏳ Pendiente'}
        {status === 'failed' && '✗ Fallido'}
      </span>
    );
  };

  const downloadVoucher = async (bookingId: string, reference: string) => {
    try {
      const response = await fetch(`/api/travel-bookings/${bookingId}/voucher`);
      const html = await response.text();

      // Create blob and download
      const blob = new Blob([html], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voucher-${reference}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading voucher:', err);
      alert('Error al descargar el voucher');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">Cargando reservas de viajes...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Reservas de Viajes</h1>
              <p className="text-sm text-slate-600 mt-1">Ver y administrar las reservas registradas.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/viajes/experiencias">
                  <MapPin className="mr-2 h-4 w-4" />
                  Gestionar viajes
                </Link>
              </Button>
              <Button asChild size="sm" variant="secondary">
                <Link href="/admin">
                  <ArrowLeft size={18} /> Volver
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded p-4">
              <p className="text-sm text-slate-600">Total Reservas</p>
              <p className="text-2xl font-bold text-slate-900">{bookings.length}</p>
            </div>
            <div className="bg-blue-50 rounded p-4">
              <p className="text-sm text-slate-600">Confirmadas</p>
              <p className="text-2xl font-bold text-blue-600">
                {bookings.filter(b => b.status === 'confirmed').length}
              </p>
            </div>
            <div className="bg-yellow-50 rounded p-4">
              <p className="text-sm text-slate-600">Pagos Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {bookings.filter(b => b.payment_status === 'pending').length}
              </p>
            </div>
            <div className="bg-green-50 rounded p-4">
              <p className="text-sm text-slate-600">Pagadas</p>
              <p className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.payment_status === 'paid').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Búsqueda
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Referencia, nombre, email..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estado Reserva
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">Todos</option>
                <option value="confirmed">Confirmadas</option>
                <option value="pending">Pendientes</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estado Pago
              </label>
              <select
                value={filterPayment}
                onChange={e => setFilterPayment(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="paid">Pagado</option>
                <option value="failed">Fallido</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterPayment('all');
                  setSearchTerm('');
                }}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          {bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-slate-600 text-lg">No hay reservas de viajes</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Referencia
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Plan / Precio
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Teléfono
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Pago
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bookings.map(booking => (
                      <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-slate-900">
                            {booking.booking_reference}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {booking.customer_name}
                            </p>
                            <p className="text-xs text-slate-600">{booking.customer_email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {booking.plan_name}
                            </p>
                            <p className="text-xs text-slate-600">
                              {booking.plan_variant}
                            </p>
                            <p className="text-sm font-bold text-green-600 mt-1">
                              ${booking.plan_price_usd} USD
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a
                            href={`https://wa.me/${booking.customer_phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {booking.customer_phone}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(booking.status)}
                        </td>
                        <td className="px-6 py-4">
                          {getPaymentBadge(booking.payment_status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(booking.created_at).toLocaleDateString('es-AR')}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              downloadVoucher(booking.id, booking.booking_reference)
                            }
                            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm"
                            title="Descargar voucher"
                          >
                            <Download size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
