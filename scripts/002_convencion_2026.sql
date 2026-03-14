-- 1° Convención Plein Air Buenos Aires - Mayo 2026
-- Ejecutar en Supabase SQL Editor

-- Primero desactivar productos viejos de prueba
UPDATE public.products SET is_active = FALSE, is_featured = FALSE WHERE slug LIKE '%2025%';

-- Insertar los 5 tipos de entrada
INSERT INTO public.products (category_id, name, slug, description, price_ars, stock, max_per_order, is_active, is_featured, product_type, event_date, event_location) VALUES

((SELECT id FROM categories WHERE slug='tickets'),
 'Entrada General por 1 dia',
 'entrada-general-1-dia',
 'Visita nuestros talleres y stand de productos. Acceso por 1 dia a la 1° Convención Plein Air en Buenos Aires + ARG. Del 1 al 3 de mayo en Av. Sarmiento 1875, C.O.M.',
 8000, 200, 10, TRUE, TRUE, 'ticket', '2026-05-01', 'Círculo Oficiales del Mar, Av. Sarmiento 1875, CABA'),

((SELECT id FROM categories WHERE slug='tickets'),
 'Entrada General por 3 dias',
 'entrada-general-3-dias',
 'Visita stand y participa de sorteos y talleres durante los 3 dias de la convencion. Acceso completo del 1 al 3 de mayo.',
 16000, 200, 10, TRUE, TRUE, 'ticket', '2026-05-01', 'Círculo Oficiales del Mar, Av. Sarmiento 1875, CABA'),

((SELECT id FROM categories WHERE slug='tickets'),
 'Streaming',
 'streaming-convencion',
 'Podes participar de streaming, sorteo en vivo y descuento en workshops previos. Acceso a todas las transmisiones del 1 al 3 de mayo.',
 24000, 500, 5, TRUE, TRUE, 'ticket', '2026-05-01', 'Online - Streaming en vivo'),

((SELECT id FROM categories WHERE slug='tickets'),
 'Basica',
 'entrada-basica',
 '12 demos, 2 jornadas plein air, coffee break, 50% en workshop previos y sorteo de cierre. La experiencia completa del 1 al 3 de mayo.',
 135000, 100, 5, TRUE, TRUE, 'ticket', '2026-05-01', 'Círculo Oficiales del Mar, Av. Sarmiento 1875, CABA'),

((SELECT id FROM categories WHERE slug='tickets'),
 'VIP',
 'entrada-vip-convencion',
 'Ademas de los beneficios de la entrada basica tenes coctel de cierre con artistas y merchandising. La experiencia premium de la 1° Convención Plein Air Buenos Aires.',
 157000, 50, 3, TRUE, TRUE, 'ticket', '2026-05-01', 'Círculo Oficiales del Mar, Av. Sarmiento 1875, CABA')

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_ars = EXCLUDED.price_ars,
  stock = EXCLUDED.stock,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  event_date = EXCLUDED.event_date,
  event_location = EXCLUDED.event_location;
