'use client';
import Image from 'next/image';
import { AddToCartSection } from '../../../components/add-to-cart-section';
import { Badge } from '../../../components/ui/badge';
import { Navbar } from '../../../components/navbar';

export default function Page() {
  const isSoldOut = 5 <= 0;
  const isLowStock = 5 > 0 && 5 <= 10;
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Imagen a la izquierda */}
          <div className="relative w-full md:w-1/2 aspect-square bg-muted rounded-lg overflow-hidden">
            {false ? (
              <Image src="" alt="Art Studio 21 · Workshop El perro de tus sueños" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-muted-foreground text-6xl font-serif">PA</span>
              </div>
            )}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {false && (
                <Badge className="bg-brand-earth text-white text-xs border-0">Destacado</Badge>
              )}
              {isSoldOut && (
                <Badge variant="secondary" className="text-xs font-semibold">Agotado</Badge>
              )}
              {isLowStock && !isSoldOut && (
                <Badge className="bg-amber-500 text-white text-xs font-semibold border-0 animate-pulse">¡Poco Stock!</Badge>
              )}
              {true && (
                <Badge className="bg-primary text-white text-xs border-0">Últimas 5 entradas</Badge>
              )}
            </div>
          </div>
          {/* Info a la derecha */}
          <div className="flex-1 flex flex-col gap-4">
            {true && (
              <span className="text-xs text-primary font-semibold uppercase tracking-wider">Talleres</span>
            )}
            {true && (
              <p className="text-base text-primary font-semibold mb-1">Sábado de 14:00 a 15:30 hs</p>
            )}
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-foreground leading-tight">Art Studio 21 · Workshop El perro de tus sueños</h1>
            {true && (
              <p className="text-base text-muted-foreground leading-relaxed">La entrada incluye un niño con un adulto.</p>
            )}
            {/* Features */}
            {true && (
              <ul className="mt-2 mb-2 list-disc pl-5 text-sm text-foreground"><li className="mb-1">Incluye 1 niño con 1 adulto</li><li className="mb-1">Sábado de 14:00 a 15:30 hs</li></ul>
            )}
            {/* CTA Link */}
            {false && (
              <a href="" target="_blank" rel="noopener" className="mt-2 inline-block">
                <Badge className="bg-brand-earth text-white border-0">Comprar en etickets</Badge>
              </a>
            )}
            {/* Agregar al carrito */}
            <div className="mt-4">
              <AddToCartSection product={{"id":"15a5b329-e119-4b53-b90d-a195d2a5761c","slug":"art-studio-21-workshop-el-perro-de-tus-suenos-sabado","name":"Art Studio 21 · Workshop El perro de tus sueños","description":"La entrada incluye un niño con un adulto.","subtitle":"Sábado de 14:00 a 15:30 hs","price_ars":30000,"price_usd":null,"stock":5,"max_per_order":4,"image_url":null,"is_active":true,"is_featured":false,"product_type":"workshop","badge":"Últimas 5 entradas","features":["Incluye 1 niño con 1 adulto","Sábado de 14:00 a 15:30 hs"],"cta_link":null,"categories":{"name":"Talleres"}}} />
            </div>
            {/* Precio y métodos de pago */}
            <div className="mt-8 border-t border-border pt-4 flex flex-col gap-2">
              <p className="font-bold text-2xl text-foreground">$30000 ARS</p>
              
              <div className="flex gap-3 mt-2">
                <Badge className="bg-[#00B686] text-white border-0">Mercado Pago</Badge>
                <Badge className="bg-[#1A237E] text-white border-0">Transferencia</Badge>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}