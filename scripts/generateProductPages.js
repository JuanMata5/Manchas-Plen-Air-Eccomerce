// scripts/generateProductPages.js
const fs = require('fs');
const path = require('path');

// Simula tu función real de base de datos
async function getAllProducts({ is_active }) {
  // Reemplaza esto por tu consulta real a la base de datos
  return [
    { slug: 'producto-1', name: 'Producto 1', description: 'Descripción 1', price_ars: 1000 },
    { slug: 'producto-2', name: 'Producto 2', description: 'Descripción 2', price_ars: 2000 },
    // ...más productos
  ].filter(p => is_active);
}

async function main() {
  const products = await getAllProducts({ is_active: true });
  const baseDir = path.join(__dirname, '../app/products');

  products.forEach(product => {
    const dir = path.join(baseDir, product.slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const content = `
export default function Page() {
  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4">${product.name}</h1>
      <p className="mb-2">${product.description}</p>
      <p className="mb-2 font-semibold">Precio: $${product.price_ars}</p>
    </main>
  );
}
`.trim();

    fs.writeFileSync(path.join(dir, 'page.tsx'), content, 'utf8');
    console.log(`Generada: /app/products/${product.slug}/page.tsx`);
  });
}

main();
