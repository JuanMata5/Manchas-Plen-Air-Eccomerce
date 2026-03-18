# Plen Air E-commerce 🎨

Plataforma de ventas de tickets y merchandising para la convención Plen Air. Checkout seguro, emails automáticos, gestión de stock y admin completo.

## ✨ Features

### 🛍️ Cliente
- Catálogo con filtros y búsqueda
- Carrito persistente
- Checkout seguro (2 métodos de pago)
- Cupones de descuento
- Autenticación con email/contraseña

### 💳 Pagos
- **Mercado Pago**: Checkout integrado, webhooks, validación
- **Transferencia Bancaria**: Referencia única, comprobante, confirmación manual

### 📧 Notificaciones
- Email confirmación al crear orden
- Email + PDF con QR cuando pago confirmado
- Cola de emails con reintentos automáticos
- Templates HTML profesionales

### 🖼️ Imágenes
- Upload a Cloudinary desde admin
- URLs responsivas (srcset automático)
- Transformaciones: compress, format, quality auto
- CDN para performance

### 🔐 Admin
- CRUD completo de productos
- Gestión de stock
- Upload de múltiples imágenes
- Marcar destacados/activos
- Dashboard con métricas
- Gestión de órdenes y tickets

### 🎫 Tickets
- Generación automática con QR
- PDF descargable
- Validación en evento
- Datos del titular

---

## 🚀 Tech Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS
- **Backend**: Next.js API Routes + Supabase Functions
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Emails**: SendGrid
- **Imágenes**: Cloudinary
- **Pagos**: Mercado Pago
- **Validación**: Zod
- **State**: Zustand
- **UI**: shadcn/ui (60+ componentes)

---

## 📦 Instalación

### Requisitos
- Node.js 18+
- npm o pnpm
- Cuenta de Supabase
- Cuenta de SendGrid
- Cuenta de Cloudinary
- Cuenta de Mercado Pago

### Setup

1. **Clonar repo**
```bash
git clone <repo-url>
cd eccomerce
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales
```

4. **Iniciar base de datos**
- Crear proyecto en Supabase
- Ejecutar scripts SQL:
  - `scripts/001_schema.sql`
  - `scripts/002_functions.sql`
  - `scripts/005_email_cloudinary.sql`

5. **Dev server**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 📂 Estructura

```
├── app/
│   ├── api/
│   │   ├── admin/               # Endpoints admin
│   │   ├── orders/              # Crear órdenes
│   │   ├── webhooks/            # Mercado Pago webhook
│   │   ├── emails/              # Enviar emails
│   │   └── cloudinary/          # Upload de imágenes
│   ├── admin/                   # Pages admin protegidas
│   ├── auth/                    # Login/register
│   ├── carrito/                 # Shopping cart
│   ├── checkout/                # Checkout pages
│   └── tienda/                  # Product listings
├── components/
│   ├── ProductForm.tsx          # Form para crear/editar
│   ├── ImageUpload.tsx          # Upload con drag-drop
│   ├── CartView.tsx
│   └── ... (60+ componentes)
├── lib/
│   ├── email/                   # SendGrid client + templates
│   ├── pdf/                     # Generador de tickets con QR
│   ├── cloudinary/              # Cloudinary client
│   ├── supabase/                # Clientes SSR
│   └── types.ts
├── scripts/
│   ├── 001_schema.sql           # Tablas principales
│   ├── 002_functions.sql        # RPCs (stock, cupones)
│   └── 005_email_cloudinary.sql # Nuevas (email_queue, product_images)
└── styles/                      # Tailwind CSS
```

---

## 🔧 API Reference

### Públicos
```
GET    /api/products                   # Listar productos
GET    /api/products/[slug]            # Detalle
POST   /api/coupons/validate           # Validar cupón
POST   /api/orders/create              # Crear orden
POST   /api/webhooks/mercadopago       # MP webhook
```

### Admin (requieren is_admin=true)
```
POST   /api/admin/products/create      # Crear producto
PATCH  /api/admin/products/[id]        # Editar
DELETE /api/admin/products/[id]        # Borrar
POST   /api/admin/products/upload-image # Guardar imagen
```

---

## 📊 Base de Datos

### Tablas principales
- `products` - Catálogo (+ product_images)
- `categories` - Categorías
- `orders` - Órdenes
- `order_items` - Items de orden
- `tickets` - Tickets generados
- `profiles` - Usuarios extendido
- `coupons` - Descuentos
- `email_queue` - Cola de emails
- `webhook_logs` - Logs de MP

### Row Level Security (RLS)
- `profiles`: Usuario ve solo su perfil
- `orders`: Usuario ve sus órdenes
- `products`: Público (activos), admin escribe
- `email_queue`: Solo service_role

---

## 🔐 Seguridad

✅ RLS en Supabase
✅ Validación robusta (Zod)
✅ Admin role check en endpoints
✅ Service role key en backend only
✅ HTTPS en producción
✅ CORS configurado

---

## 📈 Monitorea

- Emails en console (dev) o SendGrid dashboard (prod)
- Logs de webhook en tabla `webhook_logs`
- Errores en console + (opcional) Sentry

---

## 🚀 Deploy

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para guía completa.

**TL;DR:**
1. Configurar variables de entorno en Vercel
2. Push a main
3. Vercel auto-deploya
4. Verificar webhooks apunten a producción

---

## 🤝 Contributing

1. Fork
2. Crea branch (`git checkout -b feature/xyz`)
3. Commit (`git commit -am 'Add feature'`)
4. Push (`git push origin feature/xyz`)
5. PR

---

## 📞 Soporte

- **Documentación**: Ver en `DEPLOYMENT.md`
- **Issues**: GitHub Issues
- **Email**: soporte@plenair.com.ar

---

## 📄 Licencia

MIT (o tu licencia preferida)

---

## 📅 Changelog

### v1.0.0 - 2026-03-12
✅ Fase 1: SendGrid emails
✅ Fase 2: Cloudinary images
✅ Fase 3: Admin CRUD UI
✅ Producción lista

---

**Hecho con ❤️ para Plen Air**

<!-- Gemini was here -->