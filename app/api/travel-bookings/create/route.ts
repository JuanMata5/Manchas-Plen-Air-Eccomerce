import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { sendWhatsAppMessage } from '@/lib/contact';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      travelId,
      planName,
      planPrice,
      planVariant,
      customerName,
      customerEmail,
      customerPhone,
    } = body;

    // Validate required fields
    if (!travelId || !planName || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const supabase = await createAdminClient();

    // Get travel experience details
    const { data: travel, error: travelError } = await supabase
      .from('travel_experiences')
      .select('*')
      .eq('id', travelId)
      .single();

    if (travelError || !travel) {
      return NextResponse.json(
        { error: 'Experiencia no encontrada' },
        { status: 404 }
      );
    }

    // Generate unique booking reference
    const bookingReference = `TRV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('travel_bookings')
      .insert({
        travel_id: travelId,
        plan_name: planName,
        plan_price_usd: planPrice,
        plan_variant: planVariant,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        booking_reference: bookingReference,
        status: 'confirmed',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json(
        { error: 'Error al crear la reserva' },
        { status: 500 }
      );
    }

    // Send confirmation email
    try {
      await resend.emails.send({
        from: 'reservas@manchasplenaircourts.com',
        to: customerEmail,
        subject: `Reserva Confirmada - ${travel.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1e293b; border-bottom: 3px solid #1e293b; padding-bottom: 10px;">
              ¡Reserva Confirmada!
            </h1>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Hola <strong>${customerName}</strong>,
            </p>

            <p style="color: #475569; font-size: 16px; line-height: 1.6;">
              Tu reserva para ${travel.title} ha sido confirmada con éxito.
            </p>

            <div style="background: #f1f5f9; border-left: 4px solid #1e293b; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1e293b; margin-top: 0;">Detalles de tu Reserva</h3>
              <p style="margin: 8px 0;"><strong>Referencia:</strong> ${bookingReference}</p>
              <p style="margin: 8px 0;"><strong>Experiencia:</strong> ${travel.title}</p>
              <p style="margin: 8px 0;"><strong>Ubicación:</strong> ${travel.location}</p>
              <p style="margin: 8px 0;"><strong>Fechas:</strong> ${travel.dates}</p>
              <p style="margin: 8px 0;"><strong>Plan:</strong> ${planName}</p>
              <p style="margin: 8px 0;"><strong>Variante:</strong> ${planVariant}</p>
              <p style="margin: 8px 0;"><strong>Precio:</strong> $${planPrice} USD</p>
            </div>

            <h3 style="color: #1e293b;">Próximos Pasos</h3>
            <ol style="color: #475569; font-size: 14px; line-height: 1.8;">
              <li>Recibirás las instrucciones de pago en los próximos minutos</li>
              <li>Una vez confirmado el pago, accederás a tu voucher de viaje</li>
              <li>Nuestro equipo se pondrá en contacto contigo para confirmar detalles</li>
            </ol>

            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              Si tienes preguntas, no dudes en contactarnos.
            </p>

            <p style="color: #1e293b; font-weight: bold;">
              Equipo Manchas Plen Air
            </p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request, just log it
    }

    // Send WhatsApp notification
    try {
      await sendWhatsAppMessage(
        customerPhone,
        `¡Hola ${customerName}! 🎉\n\nTu reserva para "${travel.title}" ha sido confirmada.\n\nReferencia: ${bookingReference}\nPrecio: $${planPrice} USD\n\nProximos pasos: recibirás instrucciones de pago en tu email.\n\n¡Estamos emocionados de verte en Trevelin!`
      );
    } catch (whatsappError) {
      console.error('WhatsApp sending error:', whatsappError);
      // Don't fail the request, just log it
    }

    return NextResponse.json(
      {
        success: true,
        booking: {
          id: booking.id,
          bookingReference: booking.booking_reference,
          status: booking.status
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Booking creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la reserva' },
      { status: 500 }
    );
  }
}
