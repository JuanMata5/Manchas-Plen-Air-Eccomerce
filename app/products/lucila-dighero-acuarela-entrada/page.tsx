'use client';
import Image from 'next/image';
import { AddToCartSection } from '../../../components/add-to-cart-section';
import { Badge } from '../../../components/ui/badge';
import { Navbar } from '../../../components/navbar';

export default function Page() {
  const isSoldOut = 12 <= 0;
  const isLowStock = 12 > 0 && 12 <= 10;
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Imagen a la izquierda */}
          <div className="relative w-full md:w-1/2 aspect-square bg-muted rounded-lg overflow-hidden">
            {false ? (
              <Image src="" alt="Lucila Dighero · Acuarela" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
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
                <Badge className="bg-primary text-white text-xs border-0">Últimas 12 entradas</Badge>
              )}
            </div>
          </div>
          {/* Info a la derecha */}
          <div className="flex-1 flex flex-col gap-4">
            {true && (
              <span className="text-xs text-primary font-semibold uppercase tracking-wider">Tickets de Entrada</span>
            )}
            {true && (
              <p className="text-base text-primary font-semibold mb-1">Entrada con sorteo</p>
            )}
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-foreground leading-tight">Lucila Dighero · Acuarela</h1>
            {true && (
              <p className="text-base text-muted-foreground leading-relaxed">Con mi entrada participás de un sorteo después del workshop.</p>
            )}
            {/* Features */}
            {true && (
              <ul className="mt-2 mb-2 list-disc pl-5 text-sm text-foreground"><li className="mb-1">Participás de un sorteo post-workshop</li></ul>
            )}
            {/* CTA Link */}
            {false && (
              <a href="" target="_blank" rel="noopener" className="mt-2 inline-block">
                <Badge className="bg-brand-earth text-white border-0">Comprar en etickets</Badge>
              </a>
            )}
            {/* Agregar al carrito */}
            <div className="mt-4">
              <AddToCartSection product={{"id":"809f1904-fcbc-4477-9216-1c27156f8961","slug":"lucila-dighero-acuarela-entrada","name":"Lucila Dighero · Acuarela","description":"Con mi entrada participás de un sorteo después del workshop.","subtitle":"Entrada con sorteo","price_ars":8000,"price_usd":null,"stock":12,"max_per_order":10,"image_url":null,"is_active":true,"is_featured":false,"product_type":"ticket","badge":"Últimas 12 entradas","features":["Participás de un sorteo post-workshop"],"cta_link":null,"categories":{"name":"Tickets de Entrada"}}} />
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