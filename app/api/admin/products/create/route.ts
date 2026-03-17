import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(3, 'Nombre debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'Slug debe tener al menos 3 caracteres').regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  category_id: z.string().uuid().nullable(),
  price_ars: z.number().positive('Precio ARS debe ser positivo'),
  price_usd: z.number().positive('Precio USD debe ser positivo').optional().nullable(),
  stock: z.number().int().min(0),
  max_per_order: z.number().int().min(1),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  product_type: z.enum(['ticket', 'workshop', 'merchandise']).default('merchandise'),
  event_date: z.string().nullable().optional(),
  event_location: z.string().optional().nullable(),
})

// Función para generar un slug único de forma robusta
async function generateUniqueSlug(slug: string, adminDb: any): Promise<string> {
  let newSlug = slug;
  let counter = 1;
  while (true) {
    const { data: existing, error } = await adminDb
      .from('products')
      .select('id')
      .eq('slug', newSlug)
      .maybeSingle() // Use maybeSingle para no lanzar error si no se encuentra

    if (error) {
      console.error('Error checking slug uniqueness:', error)
      throw new Error('Error al verificar el slug') // Lanzar error si la consulta a la BD falla
    }

    if (!existing) {
      return newSlug; // Slug es único
    }

    // Si existe, intentar con un nuevo sufijo
    newSlug = `${slug}-${counter}`;
    counter++;
  }
}

/**
 * POST /api/admin/products/create
 * Create new product with unique slug generation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Validate input
    const body = await request.json()
    const validData = createProductSchema.parse(body)

    const adminDb = createAdminClient()
    
    // 3. 🔥 CORRECCIÓN: Generar un slug único
    const uniqueSlug = await generateUniqueSlug(validData.slug, adminDb);

    // 4. Create product
    const { data: product, error } = await adminDb
      .from('products')
      .insert({
        ...validData,
        slug: uniqueSlug, // Usar el slug garantizado como único
      })
      .select()
      .single()

    if (error) {
      console.error('[ADMIN API] Create product DB error:', error)
      return NextResponse.json({ error: 'Failed to create product in database.' }, { status: 500 })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('[ADMIN API] Create product unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
