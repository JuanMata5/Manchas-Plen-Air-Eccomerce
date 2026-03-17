import { NextResponse } from 'next/server';
import { CRON_SECRET } from '@/lib/config';
import { processEmailQueue } from '@/lib/email/queue';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON] Procesando cola de emails...');
  
  try {
    const result = await processEmailQueue();
    console.log(`[CRON] Resultado: ${result.sentCount} emails enviados, ${result.failedCount} fallaron.`);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[CRON] Error procesando la cola:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
