
import { NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/email/queue';

export async function GET(request: Request) {
  // 1. Proteger la ruta con un secreto
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    console.warn('[CRON] Intento de acceso no autorizado');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON] Iniciando procesamiento de la cola de emails...');

  try {
    // 2. Llamar al procesador de la cola
    await processEmailQueue();
    console.log('[CRON] Procesamiento de la cola finalizado exitosamente.');
    return NextResponse.json({ success: true, message: 'Email queue processed.' });
  } catch (error) {
    console.error('[CRON ERROR] Fallo el procesamiento de la cola:', error);
    return NextResponse.json({ success: false, error: 'Failed to process email queue' }, { status: 500 });
  }
}
