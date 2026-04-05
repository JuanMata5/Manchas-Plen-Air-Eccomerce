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

    const content = `
import { ProductPageView } from '../../../components/product-page-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return <ProductPageView slug="${product.slug}" />;
}
`.trim();

    fs.writeFileSync(path.join(dir, 'page.tsx'), content, 'utf8');
    console.log(`Generada: /app/products/${product.slug}/page.tsx`);
  }
}

main();
