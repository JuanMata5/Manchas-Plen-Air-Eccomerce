'use client';
import Image from 'next/image';
import { AddToCartSection } from '../../../components/add-to-cart-section';
import { Badge } from '../../../components/ui/badge';

export default function Page() {
  const isSoldOut = 39 <= 0;
  const isLowStock = 39 > 0 && 39 <= 10;
  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Imagen a la izquierda */}
        <div className="relative w-full md:w-1/2 aspect-square bg-muted rounded-lg overflow-hidden">
          {true ? (
            <Image src="https://res.cloudinary.com/dlrsqrghu/image/upload/v1773855170/plenair/products/uh3kabk53i2heq3pjobo.png" alt="VIP · 3 Días" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <span className="text-muted-foreground text-6xl font-serif">PA</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {true && (
              <Badge className="bg-brand-earth text-white text-xs border-0">Destacado</Badge>
            )}
            {isSoldOut && (
              <Badge variant="secondary" className="text-xs font-semibold">Agotado</Badge>
            )}
            {isLowStock && !isSoldOut && (
              <Badge className="bg-amber-500 text-white text-xs font-semibold border-0 animate-pulse">¡Poco Stock!</Badge>
            )}
            {true && (
              <Badge className="bg-primary text-white text-xs border-0">Solo 50 lugares</Badge>
            )}
          </div>
        </div>
        {/* Info a la derecha */}
        <div className="flex-1 flex flex-col gap-4">
          {true && (
            <span className="text-xs text-primary font-semibold uppercase tracking-wider">Tickets de Entrada</span>
          )}
          {true && (
            <p className="text-base text-primary font-semibold mb-1">Experiencia Premium</p>
          )}
          <h1 className="font-serif font-bold text-2xl md:text-3xl text-foreground leading-tight">VIP · 3 Días</h1>
          {true && (
            <p className="text-base text-muted-foreground leading-relaxed">Experiencia Premium | Incluye todo lo del Pase Básico, más: Asientos en primeras filas, Workshop Cristina Ishikawa incluido, Papel de arroz + tinta incluidos, Cóctel de cierre con docentes, Regalos exclusivos, Merchandising (remera / bolsa / delantal), Certificado premium, Sorteo de cierre</p>
          )}
          {/* Features */}
          {true && (
            <ul className="mt-2 mb-2 list-disc pl-5 text-sm text-foreground"><li className="mb-1">Todo lo del Pase Básico</li><li className="mb-1">Asientos en primeras filas</li><li className="mb-1">Workshop Cristina Ishikawa incluido</li><li className="mb-1">Papel de arroz + tinta incluidos</li><li className="mb-1">Cóctel de cierre con docentes</li><li className="mb-1">Regalos exclusivos</li><li className="mb-1">Merchandising (remera / bolsa / delantal)</li><li className="mb-1">Certificado premium</li><li className="mb-1">Sorteo de cierre</li></ul>
          )}
          {/* CTA Link */}
          {true && (
            <a href="https://etickets.com.ar/convencion-plein-air-bs-as/" target="_blank" rel="noopener" className="mt-2 inline-block">
              <Badge className="bg-brand-earth text-white border-0">Comprar en etickets</Badge>
            </a>
          )}
          {/* Agregar al carrito */}
          <div className="mt-4">
            <AddToCartSection product={{"id":"1a2b3c4d-0004-4567-890a-abcdef123456","slug":"vip-3dias","name":"VIP · 3 Días","description":"Experiencia Premium | Incluye todo lo del Pase Básico, más: Asientos en primeras filas, Workshop Cristina Ishikawa incluido, Papel de arroz + tinta incluidos, Cóctel de cierre con docentes, Regalos exclusivos, Merchandising (remera / bolsa / delantal), Certificado premium, Sorteo de cierre","subtitle":"Experiencia Premium","price_ars":75000,"price_usd":null,"stock":39,"max_per_order":10,"image_url":"https://res.cloudinary.com/dlrsqrghu/image/upload/v1773855170/plenair/products/uh3kabk53i2heq3pjobo.png","is_active":true,"is_featured":true,"product_type":"ticket","badge":"Solo 50 lugares","features":["Todo lo del Pase Básico","Asientos en primeras filas","Workshop Cristina Ishikawa incluido","Papel de arroz + tinta incluidos","Cóctel de cierre con docentes","Regalos exclusivos","Merchandising (remera / bolsa / delantal)","Certificado premium","Sorteo de cierre"],"cta_link":"https://etickets.com.ar/convencion-plein-air-bs-as/","categories":{"name":"Tickets de Entrada"}}} />
          </div>
          {/* Precio y métodos de pago */}
          <div className="mt-8 border-t border-border pt-4 flex flex-col gap-2">
            <p className="font-bold text-2xl text-foreground">$75000 ARS</p>
            
            <div className="flex gap-3 mt-2">
              <Badge className="bg-[#00B686] text-white border-0">Mercado Pago</Badge>
              <Badge className="bg-[#1A237E] text-white border-0">Transferencia</Badge>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}