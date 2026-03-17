
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

  const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: email,
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
        .select('full_name')
        .eq('id', user.id)
        .single();
    
      if (profile && profile.full_name) {
        userName = profile.full_name;
      }
  }

  if (!userName) {
    userName = email.split('@')[0];
  }


  try {
    await sendPasswordResetEmail(userName, email, resetLink);
    console.log(`[API] Email de reseteo encolado para ${email}`);
    return NextResponse.json({ success: true, message: 'Password reset email enqueued.' });
  } catch (emailError) {
    console.error('[API ERROR] Fallo al encolar el email de reseteo:', emailError);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}
