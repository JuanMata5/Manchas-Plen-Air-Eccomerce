
export const runtime = 'nodejs';

import { sendPasswordResetEmail } from '@/lib/email/actions';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function computeBaseUrl(request: Request) {
  const proto =
    request.headers.get('x-forwarded-proto') ||
    request.headers.get('x-forwarded-protocol') ||
    'https';

  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host');

  const inferred = host ? `${proto}://${host}` : undefined;

  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    inferred ||
    'http://localhost:3000';

  // Normaliza para evitar double slashes en redirectTo
  return raw.replace(/\/+$/, '');
}

export async function GET(request: Request) {
  const baseUrl = computeBaseUrl(request);
  const redirectTo = `${baseUrl}/auth/reset-password`;

  return NextResponse.json({
    ok: true,
    baseUrl,
    redirectTo,
    env: {
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ? 'set' : 'missing',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'set' : 'missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'missing',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'set' : 'missing',
    },
    headers: {
      host: request.headers.get('host'),
      'x-forwarded-host': request.headers.get('x-forwarded-host'),
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    },
  });
}

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  console.log(`[API] Solicitud de reseteo de contraseña para: ${email}`);

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const baseUrl = computeBaseUrl(request);
  const redirectTo = `${baseUrl}/auth/reset-password`;

  const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: email,
    options: {
      redirectTo,
    },
  });

  if (linkError) {
    console.error('[API ERROR] No se pudo generar el enlace de reseteo:', linkError.message);
    return NextResponse.json({ success: true, message: 'If an account with this email exists, a reset link has been sent.' });
  }

  const resetLink = data.properties.action_link;
  const user = data.user;
  
  let userName = '';

  if (user) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
    
      if (profile) {
        userName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
      }
  }

  if (!userName) {
    userName = email.split('@')[0];
  }


  try {
    await sendPasswordResetEmail(userName, email, resetLink);
    console.log(`[API] Email de reseteo enviado para ${email}`);
    return NextResponse.json({ success: true, message: 'Password reset email sent.' });
  } catch (emailError) {
    console.error('[API ERROR] Fallo al enviar el email de reseteo:', emailError);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}
