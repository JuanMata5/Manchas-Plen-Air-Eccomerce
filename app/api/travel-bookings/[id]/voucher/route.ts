import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const supabase = await createAdminClient();

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('travel_bookings')
      .select('*, travel_experiences(title, location, dates)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Reserva no encontrada' },
        { status: 404 }
      );
    }

    const travel = booking.travel_experiences;

    // Generate HTML voucher
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Voucher - ${booking.booking_reference}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            padding: 20px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #1e293b;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header h1 {
            color: #1e293b;
            font-size: 28px;
            margin-bottom: 5px;
          }
          
          .header p {
            color: #64748b;
            font-size: 14px;
          }
          
          .reference-box {
            background: #f1f5f9;
            border-left: 4px solid #1e293b;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 4px;
          }
          
          .reference-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          
          .reference-code {
            font-size: 24px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            color: #1e293b;
            letter-spacing: 2px;
          }
          
          .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
          }
          
          .section h2 {
            color: #1e293b;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
          }
          
          .section p {
            margin-bottom: 12px;
            font-size: 13px;
          }
          
          .section .label {
            color: #64748b;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
          }
          
          .section .value {
            color: #1e293b;
            font-weight: 600;
            font-size: 14px;
          }
          
          .full-width {
            grid-column: 1 / -1;
          }
          
          .includes-list {
            background: #f0f9ff;
            padding: 20px;
            border-radius: 4px;
            margin-bottom: 30px;
          }
          
          .includes-list h3 {
            color: #1e293b;
            font-size: 14px;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .includes-list ul {
            list-style: none;
          }
          
          .includes-list li {
            padding: 8px 0;
            padding-left: 20px;
            position: relative;
            font-size: 13px;
            color: #475569;
          }
          
          .includes-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #16a34a;
            font-weight: bold;
          }
          
          .price-section {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 4px;
            text-align: center;
            margin-bottom: 30px;
          }
          
          .price-label {
            color: #64748b;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          
          .price {
            font-size: 32px;
            font-weight: bold;
            color: #16a34a;
            margin-bottom: 5px;
          }
          
          .footer {
            border-top: 2px solid #e2e8f0;
            padding-top: 20px;
            margin-top: 30px;
            text-align: center;
            color: #64748b;
            font-size: 12px;
          }
          
          .footer p {
            margin-bottom: 8px;
          }
          
          .qr-placeholder {
            text-align: center;
            padding: 20px;
            background: #f8fafc;
            border: 2px dashed #cbd5e1;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          
          .qr-placeholder p {
            color: #64748b;
            font-size: 12px;
          }
          
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .container {
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>VOUCHER DE VIAJE</h1>
            <p>Manchas Plen Air Experiences</p>
          </div>
          
          <div class="reference-box">
            <div class="reference-label">Tu Referencia de Reserva</div>
            <div class="reference-code">${booking.booking_reference}</div>
          </div>
          
          <div class="two-column">
            <div class="section">
              <h2>Experiencia</h2>
              <p>
                <div class="label">Título</div>
                <div class="value">${travel.title}</div>
              </p>
              <p>
                <div class="label">Ubicación</div>
                <div class="value">${travel.location}</div>
              </p>
              <p>
                <div class="label">Fechas</div>
                <div class="value">${travel.dates}</div>
              </p>
            </div>
            
            <div class="section">
              <h2>Participante</h2>
              <p>
                <div class="label">Nombre</div>
                <div class="value">${booking.customer_name}</div>
              </p>
              <p>
                <div class="label">Email</div>
                <div class="value" style="word-break: break-all;">${booking.customer_email}</div>
              </p>
              <p>
                <div class="label">Teléfono</div>
                <div class="value">${booking.customer_phone}</div>
              </p>
            </div>
          </div>
          
          <div class="two-column">
            <div class="section">
              <h2>Plan Seleccionado</h2>
              <p>
                <div class="label">Plan</div>
                <div class="value">${booking.plan_name}</div>
              </p>
              <p>
                <div class="label">Variante</div>
                <div class="value">${booking.plan_variant}</div>
              </p>
            </div>
            
            <div class="price-section">
              <div class="price-label">Precio Total</div>
              <div class="price">${booking.plan_price_usd || 'N/A'} USD</div>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Este voucher es válido presentarlo el día de la experiencia</strong></p>
            <p>Para consultas: reservas@manchasplenaircourts.com</p>
            <p>Emitido: ${new Date(booking.created_at).toLocaleDateString('es-AR')}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Convert HTML to PDF using a simple approach
    // For production, you might want to use a library like puppeteer or html-pdf
    // For now, we'll return the HTML and let the client handle PDF generation
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="voucher-${booking.booking_reference}.html"`,
      },
    });

  } catch (error: any) {
    console.error('Voucher generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Error al generar voucher' },
      { status: 500 }
    );
  }
}
