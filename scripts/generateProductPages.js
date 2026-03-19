// scripts/generateProductPages.js
const fs = require('fs');
const path = require('path');

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, slug, name, description, subtitle, price_ars, price_usd, stock, max_per_order, image_url, is_active, is_featured, product_type, badge, features, categories(name), cta_link
    `)
    .eq('is_active', true);
  if (error) throw error;
  return data;
}

function escapeJSX(str) {
  if (!str) return '';
  return str.replace(/`/g, '\u0060').replace(/\$/g, '$$$$');
}

async function main() {
  const products = await getAllProducts();
  const baseDir = path.join(__dirname, '../app/products');

  for (const product of products) {
    const dir = path.join(baseDir, product.slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const featuresList = product.features && Array.isArray(product.features)
      ? product.features.map(f => `<li className=\"mb-1\">${escapeJSX(f)}</li>`).join('')
      : '';

    const content = `
'use client';
import Image from 'next/image';
import { AddToCartSection } from '../../../components/add-to-cart-section';
import { Badge } from '../../../components/ui/badge';

export default function Page() {
  const isSoldOut = ${product.stock} <= 0;
  const isLowStock = ${product.stock} > 0 && ${product.stock} <= 10;
  return (
    <main className=\"max-w-4xl mx-auto py-10 px-4\">
      <div className=\"flex flex-col md:flex-row gap-8\">
        {/* Imagen a la izquierda */}
        <div className=\"relative w-full md:w-1/2 aspect-square bg-muted rounded-lg overflow-hidden\">
          {${product.image_url ? 'true' : 'false'} ? (
            <Image src=\"${product.image_url || ''}\" alt=\"${escapeJSX(product.name)}\" fill className=\"object-cover\" sizes=\"(max-width: 768px) 100vw, 50vw\" />
          ) : (
            <div className=\"w-full h-full flex items-center justify-center bg-muted\">
              <span className=\"text-muted-foreground text-6xl font-serif\">PA</span>
            </div>
          )}
          <div className=\"absolute top-3 left-3 flex flex-col gap-1.5\">
            {${product.is_featured ? 'true' : 'false'} && (
              <Badge className=\"bg-brand-earth text-white text-xs border-0\">Destacado</Badge>
            )}
            {isSoldOut && (
              <Badge variant=\"secondary\" className=\"text-xs font-semibold\">Agotado</Badge>
            )}
            {isLowStock && !isSoldOut && (
              <Badge className=\"bg-amber-500 text-white text-xs font-semibold border-0 animate-pulse\">¡Poco Stock!</Badge>
            )}
            {${product.badge ? 'true' : 'false'} && (
              <Badge className=\"bg-primary text-white text-xs border-0\">${escapeJSX(product.badge || '')}</Badge>
            )}
          </div>
        </div>
        {/* Info a la derecha */}
        <div className=\"flex-1 flex flex-col gap-4\">
          {${product.categories && product.categories.name ? 'true' : 'false'} && (
            <span className=\"text-xs text-primary font-semibold uppercase tracking-wider\">${escapeJSX(product.categories?.name || '')}</span>
          )}
          {${product.subtitle ? 'true' : 'false'} && (
            <p className=\"text-base text-primary font-semibold mb-1\">${escapeJSX(product.subtitle || '')}</p>
          )}
          <h1 className=\"font-serif font-bold text-2xl md:text-3xl text-foreground leading-tight\">${escapeJSX(product.name)}</h1>
          {${product.description ? 'true' : 'false'} && (
            <p className=\"text-base text-muted-foreground leading-relaxed\">${escapeJSX(product.description || '')}</p>
          )}
          {/* Features */}
          {${featuresList ? 'true' : 'false'} && (
            <ul className=\"mt-2 mb-2 list-disc pl-5 text-sm text-foreground\">${featuresList}</ul>
          )}
          {/* CTA Link */}
          {${product.cta_link ? 'true' : 'false'} && (
            <a href=\"${product.cta_link || ''}\" target=\"_blank\" rel=\"noopener\" className=\"mt-2 inline-block\">
              <Badge className=\"bg-brand-earth text-white border-0\">Comprar en etickets</Badge>
            </a>
          )}
          {/* Agregar al carrito */}
          <div className=\"mt-4\">
            <AddToCartSection product={${JSON.stringify(product)}} />
          </div>
          {/* Precio y métodos de pago */}
          <div className=\"mt-8 border-t border-border pt-4 flex flex-col gap-2\">
            <p className=\"font-bold text-2xl text-foreground\">${product.price_ars ? `$${product.price_ars} ARS` : ''}</p>
            ${product.price_usd ? `<p className=\"text-xs text-muted-foreground\">USD ${product.price_usd} aprox.</p>` : ''}
            <div className=\"flex gap-3 mt-2\">
              <Badge className=\"bg-[#00B686] text-white border-0\">Mercado Pago</Badge>
              <Badge className=\"bg-[#1A237E] text-white border-0\">Transferencia</Badge>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
`.trim();

    fs.writeFileSync(path.join(dir, 'page.tsx'), content, 'utf8');
    console.log(`Generada: /app/products/${product.slug}/page.tsx`);
  }
}

main();
