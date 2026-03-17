
import { createClient } from '@/lib/supabase/server';
import { sendPasswordResetEmail } from '@/lib/email/actions';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  console.log(`[API] Solicitud de reseteo de contraseña para: ${email}`);

  const supabase = await createClient();

  // 1. Obtener los datos del usuario de forma segura
  const { data: user, error: userError } = await supabase
    .from('users') // Asumo que tienes una tabla 'users' o puedes consultarla
    .select('id, raw_user_meta_data')
    .eq('email', email)
    .single();

  // Es importante no revelar si el email existe o no por seguridad
  // Pero si no existe, no podemos hacer nada.
  if (userError || !user) {
    console.warn(`[API] Intento de reseteo para email no existente: ${email}`);
    // Devolvemos una respuesta exitosa genérica para no dar pistas a atacantes
    return NextResponse.json({ success: true, message: 'If your email is registered, you will receive a password reset link.' });
  }

  // 2. Generar el enlace de reseteo usando el cliente Admin de Supabase
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: email,
  });

  if (linkError) {
    console.error('[API ERROR] No se pudo generar el enlace de reseteo:', linkError);
    return NextResponse.json({ error: 'Failed to generate reset link' }, { status: 500 });
  }

  const resetLink = linkData.properties.action_link;
  const userName = user.raw_user_meta_data?.name || 'usuario';

  try {
    // 3. Enviar el email usando nuestro sistema con Resend
    await sendPasswordResetEmail(userName, email, resetLink);
    console.log(`[API] Email de reseteo encolado para ${email}`);
    return NextResponse.json({ success: true, message: 'Password reset email enqueued.' });
  } catch (emailError) {
    console.error('[API ERROR] Fallo al encolar el email de reseteo:', emailError);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}
