-- Add the two Salon competition category tickets to the ecommerce catalog.
-- The Salon homepage can link directly to /tienda/<slug> for each ticket.

INSERT INTO public.categories (name, slug, sort_order)
VALUES ('Tickets de Entrada', 'tickets', 1)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (
  category_id,
  name,
  slug,
  subtitle,
  description,
  price_ars,
  price_usd,
  stock,
  max_per_order,
  image_url,
  is_active,
  is_featured,
  product_type,
  event_date,
  event_location,
  badge,
  features
)
VALUES
  (
    (SELECT id FROM public.categories WHERE slug = 'tickets'),
    'Concurso del Salón · Categoría 1',
    'concurso-salon-categoria-1',
    'Inscripción · Categoría 1',
    'Inscripción para participar en la Categoría 1 del concurso del Salón. Consultá las bases del concurso para conocer requisitos y condiciones.',
    9500,
    NULL,
    100,
    10,
    NULL,
    TRUE,
    FALSE,
    'ticket',
    NULL,
    NULL,
    NULL,
    ARRAY['Inscripción a la Categoría 1']
  ),
  (
    (SELECT id FROM public.categories WHERE slug = 'tickets'),
    'Concurso del Salón · Categoría 2',
    'concurso-salon-categoria-2',
    'Inscripción · Categoría 2',
    'Inscripción para participar en la Categoría 2 del concurso del Salón. Consultá las bases del concurso para conocer requisitos y condiciones.',
    28000,
    NULL,
    100,
    10,
    NULL,
    TRUE,
    FALSE,
    'ticket',
    NULL,
    NULL,
    NULL,
    ARRAY['Inscripción a la Categoría 2']
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  price_ars = EXCLUDED.price_ars,
  product_type = EXCLUDED.product_type,
  is_active = EXCLUDED.is_active,
  features = EXCLUDED.features,
  updated_at = NOW();
