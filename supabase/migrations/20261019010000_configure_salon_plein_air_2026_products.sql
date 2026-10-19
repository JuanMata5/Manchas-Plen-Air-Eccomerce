-- Configure the Salon Plein Air 2026 offers and the free Category 2 submission.

INSERT INTO public.categories (name, slug, sort_order)
VALUES ('Tickets de Entrada', 'tickets', 1)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cta_link TEXT;

INSERT INTO public.products (
  category_id, name, slug, subtitle, description, price_ars, price_usd,
  stock, max_per_order, is_active, is_featured, product_type,
  event_date, event_location, badge, features, cta_link
)
VALUES
  (
    (SELECT id FROM public.categories WHERE slug = 'tickets'),
    'Salón Plein Air 2026 · Participación para preinscriptos',
    'concurso-salon-categoria-1',
    'Participación · Categoría 1',
    'Pago exclusivo para artistas preinscriptos en el Salón Plein Air 2026. No realices este pago si no recibiste la preinscripción de la organización. Se aplican las bases y condiciones del concurso. La convocatoria contempla la exhibición oficial del 19 al 21 de junio de 2027 y la participación en actividades de la Convención Plein Air 2027, sujeta a las condiciones de la organización.',
    18000, NULL, 100, 10, TRUE, FALSE, 'ticket',
    '2027-06-19', NULL, 'Solo para preinscriptos',
    '["Pago exclusivo para artistas preinscriptos"]'::jsonb, NULL
  ),
  (
    (SELECT id FROM public.categories WHERE slug = 'tickets'),
    'Salón Plein Air 2026 · Categoría 2 — Pintura de Estudio',
    'concurso-salon-categoria-2',
    'Inscripción gratuita en la web de carga de obras',
    'La inscripción gratuita a la Categoría 2 — Pintura de Estudio es para artistas nacionales y extranjeros. Para presentar tus obras, ingresá a la web de carga desde el botón de esta página. La convocatoria contempla la preselección de hasta 10 obras. Consultá las bases del concurso.',
    0, NULL, 10000, 10, FALSE, FALSE, 'ticket',
    NULL, NULL, NULL,
    '["Presentación gratuita","Artistas nacionales y extranjeros","Preselección de hasta 10 obras"]'::jsonb, NULL
  ),
  (
    (SELECT id FROM public.categories WHERE slug = 'tickets'),
    'Muestra colectiva invitada · Inscripción',
    'muestra-colectiva-invitada-salon-2026',
    'Muestra del 1 al 6 de diciembre de 2026',
    'Inscripción sujeta a selección previa y a las bases de la convocatoria. Incluye espacio de exposición, montaje de las obras, diplomas y difusión de la muestra. Recepción de obras: 27, 28 y 30 de noviembre de 2026. Para postularse, enviá cinco imágenes de tus obras y tu usuario de Instagram por WhatsApp al 11 6754 6892.',
    55000, NULL, 100, 1, TRUE, FALSE, 'ticket',
    '2026-12-01', 'Salón de Arte', NULL,
    '["Espacio de exposición","Montaje de las obras","Diplomas","Difusión de la muestra","Selección previa"]'::jsonb, NULL
  ),
  (
    (SELECT id FROM public.categories WHERE slug = 'tickets'),
    'Jornada Plein Air San Martín',
    'jornada-plein-air-san-martin-2026',
    '6 de diciembre de 2026 · 10:00 a 14:00 h',
    'Inscripción a la jornada presencial de pintura Plein Air San Martín, en Plaza San Martín, Retiro, Ciudad Autónoma de Buenos Aires. Cada participante deberá llevar sus materiales de trabajo. La organización indica que es gratuita para quienes estén inscritos en la muestra colectiva invitada; consultá las condiciones para acceder a esta exención. Contacto: WhatsApp 11 6754 6892.',
    7500, NULL, 100, 10, TRUE, FALSE, 'ticket',
    '2026-12-06', 'Plaza San Martín, Retiro, Ciudad Autónoma de Buenos Aires', NULL,
    '["Jornada presencial de 10:00 a 14:00 h","Llevar materiales propios","Sin cargo para participantes de la muestra colectiva invitada, sujeto a condiciones"]'::jsonb, NULL
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  price_ars = EXCLUDED.price_ars,
  stock = EXCLUDED.stock,
  max_per_order = EXCLUDED.max_per_order,
  is_active = EXCLUDED.is_active,
  product_type = EXCLUDED.product_type,
  event_date = EXCLUDED.event_date,
  event_location = EXCLUDED.event_location,
  badge = EXCLUDED.badge,
  features = EXCLUDED.features,
  cta_link = EXCLUDED.cta_link,
  updated_at = NOW();

-- Category 2 is free: send participants directly to the painting submission site.
UPDATE public.products
SET cta_link = 'https://blog-de-votacion.manchas-pleinair.com.ar/',
    is_active = TRUE,
    updated_at = NOW()
WHERE slug = 'concurso-salon-categoria-2';
