// LOG: Renderizando página producto-1
console.log('Renderizando producto-1');

export default function Page() {
  return (
    <main className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-4">Producto 1</h1>
      <p className="mb-2">Descripción 1</p>
      <p className="mb-2 font-semibold">Precio: $1000</p>
    </main>
  );
}