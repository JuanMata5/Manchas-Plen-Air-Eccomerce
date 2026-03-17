
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

  // IMPORTANTE: Para usar auth.admin, necesitamos un cliente con Service Role Key.
  // No podemos usar el cliente de servidor estándar que depende de las cookies.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email: email,
  });

  if (linkError) {
    // Si el usuario no existe, Supabase devuelve un error aquí. 
    // Es seguro registrarlo en el log del servidor, pero no se lo mostramos al usuario.
    console.error('[API ERROR] No se pudo generar el enlace de reseteo:', linkError.message);
    // Devolvemos una respuesta genérica para no revelar si el email existe o no.
    return NextResponse.json({ success: true, message: 'If an account with this email exists, a reset link has been sent.' });
  }

  const resetLink = data.properties.action_link;

  try {
    await sendPasswordResetEmail('Hola', email, resetLink);
    console.log(`[API] Email de reseteo encolado para ${email}`);
    return NextResponse.json({ success: true, message: 'Password reset email enqueued.' });
  } catch (emailError) {
    console.error('[API ERROR] Fallo al encolar el email de reseteo:', emailError);
    return NextResponse.json({ error: 'Failed to send reset email' }, { status: 500 });
  }
}
