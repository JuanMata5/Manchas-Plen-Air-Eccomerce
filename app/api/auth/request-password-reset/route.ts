
export const runtime = 'nodejs';

import { sendPasswordResetEmail } from '@/lib/email/actions';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (request.headers.get('x-forwarded-proto') && request.headers.get('host')
      ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('host')}`
      : undefined) ||
    'http://localhost:3000';

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
