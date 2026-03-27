'use client';
import Image from 'next/image';
import { AddToCartSection } from '../../../components/add-to-cart-section';
import { Badge } from '../../../components/ui/badge';
import { Navbar } from '../../../components/navbar';

export default function Page() {
  const isSoldOut = 39 <= 0;
  const isLowStock = 39 > 0 && 39 <= 10;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Imagen */}
          <div className="relative w-full md:w-1/2 aspect-square bg-muted rounded-lg overflow-hidden">
            <Image
              src="https://res.cloudinary.com/dlrsqrghu/image/upload/v1773855170/plenair/products/uh3kabk53i2heq3pjobo.png"
              alt="VIP · 3 Días"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />

            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <Badge className="bg-brand-earth text-white text-xs border-0">
                Destacado
              </Badge>

              {isSoldOut && (
                <Badge variant="secondary" className="text-xs font-semibold">
                  Agotado
                </Badge>
              )}

              {isLowStock && !isSoldOut && (
                <Badge className="bg-amber-500 text-white text-xs font-semibold border-0 animate-pulse">
                  ¡Poco Stock!
                </Badge>
              )}

              <Badge className="bg-primary text-white text-xs border-0">
                Solo 50 lugares
              </Badge>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col gap-4">

            <span className="text-xs text-primary font-semibold uppercase tracking-wider">
              Tickets de Entrada
            </span>

            <p className="text-base text-primary font-semibold mb-1">
              Experiencia 3 días
            </p>

            <h1 className="font-serif font-bold text-2xl md:text-3xl text-foreground leading-tight">
              VIP · 3 Días
            </h1>

            {/* Descripción */}
            <p className="text-base text-muted-foreground leading-relaxed">
              Experiencia 3 días | Incluye 12 demostraciones en vivo, ejercicios de dibujo, introducción a la pintura plein air, 2 jornadas en Plaza Congreso y Lagos de Palermo, coffee breaks y acceso completo a la experiencia. Además: asientos en primeras filas, workshop Cristina Ishikawa incluido, materiales incluidos y beneficios exclusivos.
            </p>

            {/* Features */}
            <ul className="mt-2 mb-2 list-disc pl-5 text-sm text-foreground">
              <li className="mb-1">12 demostraciones en vivo en auditorio</li>
              <li className="mb-1">Ejercicio en demos de dibujo</li>
              <li className="mb-1">Introducción a pintura plein air por artista experto</li>
              <li className="mb-1">2 días plein air en Plaza Congreso y Lagos de Palermo</li>
              <li className="mb-1">Coffee breaks</li>
              <li className="mb-1">Asientos en primeras filas</li>
              <li className="mb-1">Workshop Cristina Ishikawa incluido</li>
              <li className="mb-1">Materiales incluidos (papel de arroz + tinta o workshop elegido)</li>
              <li className="mb-1">Acceso a workshops del foyer</li>
              <li className="mb-1">Regalos exclusivos</li>
              <li className="mb-1">Certificado</li>
              <li className="mb-1">Sorteo de cierre</li>
            </ul>

            {/* CTA externo */}
            <a
              href="https://etickets.com.ar/convencion-plein-air-bs-as/"
              target="_blank"
              rel="noopener"
              className="mt-2 inline-block"
            >
              <Badge className="bg-brand-earth text-white border-0">
                Comprar en etickets
              </Badge>
            </a>

            {/* Add to cart */}
            <div className="mt-4">
              <AddToCartSection
                product={{
                  id: "1a2b3c4d-0004-4567-890a-abcdef123456",
                  slug: "vip-3dias",
                  name: "VIP · 3 Días",
                  subtitle: "Experiencia 3 días",
                  description:
                    "Experiencia 3 días | Incluye 12 demostraciones en vivo, ejercicios de dibujo, introducción a la pintura plein air, 2 jornadas en Plaza Congreso y Lagos de Palermo, coffee breaks. Incluye además: asientos en primeras filas, workshop Cristina Ishikawa incluido, materiales incluidos, regalos exclusivos y certificado.",
                  price_ars: 135000,
                  price_usd: null,
                  stock: 39,
                  max_per_order: 10,
                  image_url:
                    "https://res.cloudinary.com/dlrsqrghu/image/upload/v1773855170/plenair/products/uh3kabk53i2heq3pjobo.png",
                  is_active: true,
                  is_featured: true,
                  product_type: "ticket",
                  badge: "Solo 50 lugares",
                  features: [
                    "12 demostraciones en vivo en auditorio",
                    "Ejercicio en demos de dibujo",
                    "Introducción a pintura plein air por artista experto",
                    "2 días plein air en Plaza Congreso y Lagos de Palermo",
                    "Coffee breaks",
                    "Asientos en primeras filas",
                    "Workshop Cristina Ishikawa incluido",
                    "Materiales incluidos (papel de arroz + tinta o workshop elegido)",
                    "Acceso a workshops del foyer",
                    "Regalos exclusivos",
                    "Certificado",
                    "Sorteo de cierre",
                  ],
                  cta_link:
                    "https://etickets.com.ar/convencion-plein-air-bs-as/",
                  categories: { name: "Tickets de Entrada" },
                }}
              />
            </div>

            {/* Precio */}
            <div className="mt-8 border-t border-border pt-4 flex flex-col gap-2">
              <p className="font-bold text-2xl text-foreground">
                $135000 ARS
              </p>

              <div className="flex gap-3 mt-2">
                <Badge className="bg-[#00B686] text-white border-0">
                  Mercado Pago
                </Badge>
                <Badge className="bg-[#1A237E] text-white border-0">
                  Transferencia
                </Badge>
              </div>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}