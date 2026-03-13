# 🚀 Plen Air E-commerce - Guía de Deployment

## Estado: Listo para Producción

### ✅ Componentes Implementados

#### 1. **Sistema de Emails (SendGrid)**
- Confirmación automática al crear orden
- Email + PDF de ticket cuando pago es aprobado
- Templates HTML profesionales
- Cola de emails con retry automático

#### 2. **Gestión de Imágenes (Cloudinary)**
- Upload de imágenes desde admin (drag-drop)
- Imágenes responsivas con srcset automático
- Almacenamiento seguro en CDN
- Transformaciones: quality auto, format auto, responsive widths

#### 3. **Admin CRUD Completo**
- Crear productos: `/admin/productos/nuevo`
- Editar productos: `/admin/productos/[id]`
- Eliminar productos con confirmación
- Validación robusta (Zod)
- Upload de múltiples imágenes por producto

---

## 🔧 Configuración Requerida

### 1. Variables de Entorno (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@plenair.com.ar
ADMIN_EMAIL=admin@plenair.com.ar

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# Mercado Pago
MP_ACCESS_TOKEN=your-mp-token
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com

# Banco (para transferencias)
BANK_NAME=Tu Banco
BANK_CBU=0000000000000000000000
BANK_ALIAS=tu.alias
BANK_HOLDER=Tu Empresa S.A.
BANK_CUIT=20-12345678-9

# Environment
NODE_ENV=production
```

### 2. Configurar Cloudinary Unsigned Upload

En tu tablero de Cloudinary:
1. Ir a Settings → Upload
2. Crear Upload Preset (unsigned)
3. Copiar el nombre en `CLOUDINARY_UPLOAD_PRESET`

### 3. Ejecutar Migraciones SQL

En Supabase SQL Editor, ejecutar:
- `scripts/001_schema.sql` (si no existe)
- `scripts/002_functions.sql` (si no existe)
- `scripts/005_email_cloudinary.sql` (NUEVA - email_queue + product_images)

---

## 📋 Pre-Deploy Checklist

- [ ] Variables de entorno configuradas en Vercel
- [ ] Webhook MP apunta a producción: `https://tu-dominio.com/api/webhooks/mercadopago`
- [ ] SENDGRID_API_KEY válida (test: `npm run test:email`)
- [ ] CLOUDINARY credenciales válidas
- [ ] Supabase RLS habilitado en tablas sensibles
- [ ] Base de datos migrada (scripts 001, 002, 005)
- [ ] Admin user creado (es_admin = true en profiles)

---

## 🚀 Deploy en Vercel

### 1. Conectar Repo
```bash
vercel git connect
# O si es nueva app:
vercel --prod
```

### 2. Configurar Variables de Entorno
En Vercel Dashboard → Settings → Environment Variables
```
SENDGRID_API_KEY=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
MP_ACCESS_TOKEN=...
... (todas las vars del .env.local)
```

### 3. Deploy
```bash
git push origin main
# Vercel auto-deploya
```

---

## ✨ Features Principales

### Admin Panel
- ✅ Crear productos con múltiples imágenes
- ✅ Editar todos los campos
- ✅ Eliminar con confirmación
- ✅ Stock management
- ✅ Marcar destacados
- ✅ Campos condicionales (evento para tickets)

### Compra Customer
- ✅ Carrito persistente
- ✅ Checkout en 2 métodos: MP o Transferencia
- ✅ Validación de stock en tiempo real
- ✅ Aplicar cupones

### Backend Automático
- ✅ Email confirmación al crear orden
- ✅ Email + PDF ticket cuando pago aprobado
- ✅ Webhook MP con validación
- ✅ Generación de tickets con QR
- ✅ RLS en Supabase

---

## 🔐 Seguridad

- ✅ Admin role check en todos los endpoints
- ✅ RLS policies en BD
- ✅ Validación Zod en inputs
- ✅ Service role key solo en backend
- ✅ Cloudinary signed uploads para restricción

---

## 📞 Soporte

### Endpoints Principales
```
GET /api/products                              # Listar productos
POST /api/orders/create                        # Crear orden
POST /api/webhooks/mercadopago                 # Webhook MP
GET /admin/productos                           # Lista admin
POST /admin/productos/nuevo                    # Crear
POST /admin/productos/[id]                     # Editar
DELETE /admin/productos/[id]                   # Borrar
```

### Troubleshooting

**Email no se envía:**
- Verificar SENDGRID_API_KEY en console.log
- Revisar tabla email_queue en Supabase
- En dev, los emails se loguean en console

**Imágenes no suben:**
- Verificar CLOUDINARY_API_KEY
- Comprobar que upload preset existe
- Revisar CORS en Cloudinary settings

**Webhook MP no funciona:**
- Verificar que URL es accesible: `curl https://tu-dominio.com/api/webhooks/mercadopago`
- Revisar tabla webhook_logs en Supabase
- MP envia headers X-Signature (validar en código)

---

## 📊 Monitoreo Recomendado

Agregar (opcional):
- Sentry para error tracking
- Uptime monitoring
- Analytics de pageviews

---

## 🎯 Próximos Pasos (Fase 4+)

1. **Refinements:**
   - Validación HMAC en webhook MP
   - Rate limiting en checkout
   - Caching de productos

2. **Tests:**
   - Unit: validaciones, templates
   - Integration: flujo compra E2E
   - Load: simular picos de venta

3. **Performance:**
   - SEO: meta tags dinámicos, sitemap
   - Image optimization automática (Cloudinary optimiza)
   - Code splitting

---

**Generated:** 2026-03-12
**Status:** ✅ Pronto a producción
**Tiempo estimado deploy:** 10 minutos
