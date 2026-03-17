
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

  // NO consultamos la tabla de usuarios. No es necesario y es un punto de fallo.
  // Generamos el enlace directamente. Si el email no existe, Supabase no 
  // devolverá un error por seguridad, pero tampoco enviará nada, lo cual es el 
  // comportamiento deseado.

  // 1. Generar el enlace de reseteo usando el cliente Admin de Supabase
  const { data, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email: email,
  });

  if (linkError) {
    // Este error SÍ es crítico. Si ocurre, es un problema de configuración.
    console.error('[API ERROR] No se pudo generar el enlace de reseteo:', linkError);
    // Aún así, devolvemos una respuesta genérica al usuario por seguridad.
    return NextResponse.json({ success: true, message: 'If an account with this email exists, a reset link has been sent.' });
  }

  // Si llegamos aquí, Supabase confirma que el usuario existe y generó el enlace.
  const resetLink = data.properties.action_link;

  try {
    // 2. Enviar el email usando nuestro sistema con Resend
    // Usamos un saludo genérico porque ya no consultamos el nombre.
    await sendPasswordResetEmail('Hola', email, resetLink);
    console.log(`[API] Email de reseteo encolado para ${email}`);
    return NextResponse.json({ success: true, message: 'Password reset email enqueued.' });
  } catch (emailError) {
    console.error('[API ERROR] Fallo al encolar el email de reseteo:', emailError);
    // Si falla el encolado, es un problema interno.
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}
