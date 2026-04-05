'use client';
import Image from 'next/image';
import { AddToCartSection } from '../../../components/add-to-cart-section';
import { Badge } from '../../../components/ui/badge';
import { Navbar } from '../../../components/navbar';

export default function Page() {
  const isSoldOut = 10 <= 0;
  const isLowStock = 10 > 0 && 10 <= 10;
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Imagen a la izquierda */}
          <div className="relative w-full md:w-1/2 aspect-square bg-muted rounded-lg overflow-hidden">
            {false ? (
              <Image src="" alt="Marianela Art Deco · Pátinas" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
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
                <Badge className="bg-primary text-white text-xs border-0">Últimas 10 entradas</Badge>
              )}
            </div>
          </div>
          {/* Info a la derecha */}
          <div className="flex-1 flex flex-col gap-4">
            {true && (
              <span className="text-xs text-primary font-semibold uppercase tracking-wider">Talleres</span>
            )}
            {true && (
              <p className="text-base text-primary font-semibold mb-1">Workshop de pátinas</p>
            )}
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-foreground leading-tight">Marianela Art Deco · Pátinas</h1>
            {true && (
              <p className="text-base text-muted-foreground leading-relaxed">Actividad de pátinas. Mi workshop incluye materiales.</p>
            )}
            {/* Features */}
            {true && (
              <ul className="mt-2 mb-2 list-disc pl-5 text-sm text-foreground"><li className="mb-1">Incluye materiales</li><li className="mb-1">Actividad de pátinas</li></ul>
            )}
            {/* CTA Link */}
            {false && (
              <a href="" target="_blank" rel="noopener" className="mt-2 inline-block">
                <Badge className="bg-brand-earth text-white border-0">Comprar en etickets</Badge>
              </a>
            )}
            {/* Agregar al carrito */}
            <div className="mt-4">
              <AddToCartSection product={{"id":"8e1f938d-f753-4f26-9f0e-55231d8cfd6d","slug":"marianela-art-deco-patinas","name":"Marianela Art Deco · Pátinas","description":"Actividad de pátinas. Mi workshop incluye materiales.","subtitle":"Workshop de pátinas","price_ars":8000,"price_usd":null,"stock":10,"max_per_order":4,"image_url":null,"is_active":true,"is_featured":false,"product_type":"workshop","badge":"Últimas 10 entradas","features":["Incluye materiales","Actividad de pátinas"],"cta_link":null,"categories":{"name":"Talleres"}}} />
            </div>
            {/* Precio y métodos de pago */}
            <div className="mt-8 border-t border-border pt-4 flex flex-col gap-2">
              <p className="font-bold text-2xl text-foreground">$8000 ARS</p>
              
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