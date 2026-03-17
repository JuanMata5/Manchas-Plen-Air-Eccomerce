
import { NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/email/queue';
import { CRON_SECRET } from '@/lib/config';

// Configuración para Vercel para que se ejecute como una función sin servidor
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('[CRON] Se ha recibido una petición a la ruta del cron.');

  // 1. Proteger la ruta con el secreto que definimos en lib/config.ts
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== CRON_SECRET) {
    console.warn('[CRON] Intento de acceso DENEGADO. El secreto no coincide.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON] Acceso autorizado. Iniciando procesamiento de la cola de emails.');

  try {
    // 2. Llamar a la función que procesa la cola de emails
    await processEmailQueue();
    console.log('[CRON] Procesamiento de la cola finalizado con éxito.');
    return NextResponse.json({ success: true, message: 'Email queue processed successfully.' });
  } catch (error) {
    // Si processEmailQueue lanza un error, lo capturamos aquí.
    console.error('[CRON-FATAL] Ocurrió un error crítico durante el procesamiento de la cola:', error);
    return NextResponse.json({ success: false, message: 'Failed to process email queue.' }, { status: 500 });
  }
}
