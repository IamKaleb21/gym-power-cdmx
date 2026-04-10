# Gym Power CDMX — Plan de Implementación

## Metodología

- **TDD:** Por cada módulo funcional, se escriben las pruebas primero (Vitest para Server Actions y lógica, Playwright para flujos E2E críticos). Luego se implementa hasta que las pruebas pasen.
- **Build check obligatorio:** Al final de cada fase se ejecuta `pnpm build`. Si el build falla, no se avanza a la siguiente fase.
- **Commits convencionales:** `feat:`, `fix:`, `test:`, `chore:`. Mínimo 15 commits funcionales.
- **Herramientas de DB:** Supabase CLI para migraciones versionadas en Git + Supabase MCP en Cursor para consultas interactivas durante desarrollo.
- **UI Prototyping:** Google Stitch genera las pantallas base; el código HTML/Tailwind exportado se adapta a JSX con shadcn/ui.

---

## Fase 0 — Setup & Infraestructura

**Objetivo:** Proyecto funcional con todas las herramientas configuradas antes de escribir una línea de negocio.

### Pasos

**0.1 — Inicialización del proyecto**

> El repositorio ya está creado y enlazado a GitHub. Solo inicializar Next.js dentro del directorio existente.

```bash
pnpm create next-app@latest . \
  --typescript --tailwind --app --src-dir --import-alias "@/*"
git add . && git commit -m "chore: init Next.js project with TypeScript and Tailwind"
```

**0.2 — Instalación de dependencias**
```bash
# UI
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button card input label table tabs dialog form calendar badge avatar

# Supabase
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add -D supabase

# Formularios y validación
pnpm add react-hook-form zod @hookform/resolvers

# Dashboard
pnpm add @tremor/react recharts

# QR
pnpm add react-qr-code html5-qrcode

# PWA
pnpm add @serwist/next serwist

# Testing + utilidades de scripts
pnpm add -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
pnpm add -D @playwright/test tsx
pnpm exec playwright install
```
```bash
git commit -m "chore: install all project dependencies"
```

**0.3 — Supabase CLI: init y migraciones**
```bash
pnpm exec supabase init
pnpm exec supabase login
pnpm exec supabase link --project-ref <PROJECT_REF>

# Crear la migración inicial con el schema completo de docs/SCHEMA.md
pnpm exec supabase migration new create_initial_schema
# → copiar todo el SQL de docs/SCHEMA.md al archivo generado en supabase/migrations/
pnpm exec supabase db reset   # aplica migraciones + seed localmente
pnpm exec supabase gen types typescript --project-id <PROJECT_ID> --schema public \
  > src/types/database.types.ts
```
```bash
git commit -m "chore: add supabase migrations and generated TypeScript types"
```

**0.4 — Supabase MCP en Cursor**

Agregar al archivo `.cursor/mcp.json` del proyecto:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y", "@supabase/mcp-server-supabase@latest",
        "--access-token", "<SUPABASE_PAT>",
        "--project-ref", "<PROJECT_REF>"
      ]
    }
  }
}
```
> Usar exclusivamente con el proyecto de **desarrollo**. Verificar punto verde en Cursor Settings → Tools & MCP.

**0.5 — Variables de entorno**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>  # solo para scripts de seed
```

**0.6 — Configurar Vitest y Playwright**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    globals: true,
  },
})
```

`package.json` (scripts):
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "build": "next build",
    "seed": "tsx scripts/seed.ts"
  }
}
```
```bash
git commit -m "chore: configure Vitest and Playwright testing setup"
```

**0.7 — Google Stitch: Prototipado de UI**

1. Ir a [stitch.withgoogle.com](https://stitch.withgoogle.com) → Modo Experimental
2. Prompt base para todas las pantallas:
   ```
   Sistema de gestión para gimnasio "Gym Power CDMX".
   Stack: Next.js + Tailwind CSS + shadcn/ui. Mobile-first.
   Paleta: colores oscuros/deportivos (negro, gris antracita, verde lima o naranja como acento).
   ```
3. Generar por grupo de pantallas (máximo 5 por sesión):
   - Sesión 1: Login + Admin Dashboard + Members List
   - Sesión 2: Member Detail + Classes Agenda + Trainer Profile
   - Sesión 3: Payments + Retention Dashboard + QR screens
4. Exportar HTML/Tailwind → adaptar a JSX con shadcn/ui antes de cada fase

```bash
git commit -m "chore: add stitch UI prototypes as reference in /docs/stitch/"
```

**0.8 — Seed data script**

Crear `scripts/seed.ts` con `@supabase/supabase-js` usando `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS:
- 3 planes de membresía
- 1 admin + 1 miembro demo + 10 miembros adicionales
- 4 entrenadores con disponibilidad
- 8 clases grupales
- 20 pagos (mezcla de pagados y pendientes)
- Inscripciones variadas (activas y canceladas)

```bash
pnpm seed   # ejecutar contra DB local primero
git commit -m "chore: add database seed script with demo data"
```

**✅ Build check Fase 0:**
```bash
pnpm build
```

---

## Fase 1 — Autenticación y Routing por Rol

**Objetivo:** Login funcional con redirección automática según rol (admin/member). Rutas protegidas.

### Tests primero (TDD)

`src/tests/middleware.test.ts`:
```ts
// Verificar que rutas /admin/* redirigen si no hay sesión
// Verificar que un member no puede acceder a /admin/*
// Verificar que un admin puede acceder a /admin/* y /member/*
```

`src/tests/auth.test.ts`:
```ts
// Verificar que login con credenciales inválidas retorna error
// Verificar que login con rol 'admin' redirige a /admin/dashboard
// Verificar que login con rol 'member' redirige a /member/dashboard
```

### Implementación

1. **Cliente Supabase** (`src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`)
2. **Middleware** (`middleware.ts` en raíz): intercepta todas las rutas, verifica sesión y rol
3. **Login page** (`src/app/(auth)/login/page.tsx`): formulario con React Hook Form + Zod
4. **Layout de auth** para separar rutas públicas de protegidas
5. **Estructura de rutas:**
   ```
   src/app/
   ├── (auth)/login/
   ├── (admin)/admin/
   └── (member)/member/
   ```

### Commits
```bash
git commit -m "feat: add supabase auth client and server helpers"
git commit -m "feat: implement middleware for role-based route protection"
git commit -m "feat: build login page with React Hook Form and Zod validation"
```

**✅ Build check Fase 1:** `pnpm build`

---

## Fase 2 — Módulo de Miembros (CRM)

**Objetivo:** CRUD completo de miembros con estado de membresía visual.

### Tests primero (TDD)

`src/tests/members.test.ts`:
```ts
// createMember: valida campos requeridos (full_name, email, plan)
// createMember: rechaza email duplicado
// updateMember: solo admin puede actualizar
// getMemberStatus: retorna 'active' si end_date > hoy
// getMemberStatus: retorna 'expiring_soon' si end_date <= hoy + 7 días
// getMemberStatus: retorna 'expired' si end_date < hoy
```

### Implementación

1. **Server Actions** (`src/app/actions/members.ts`): `createMember`, `updateMember`, `deleteMember`, `getMembers`, `getMemberById`
2. **Zod schemas** (`src/lib/validations/member.schema.ts`)
3. **Páginas admin:**
   - `/admin/members` — tabla con shadcn DataTable, filtro por estado, búsqueda por nombre/email
   - `/admin/members/new` — formulario de creación con selector de plan y fechas (shadcn Calendar)
   - `/admin/members/[id]` — detalle + edición + historial de pagos + QR del miembro
4. **Componente `MemberStatusBadge`** — badge de color según estado (activo/por vencer/vencido)
5. **Upload de avatar** a Supabase Storage

### Commits
```bash
git commit -m "test: add unit tests for member Server Actions"
git commit -m "feat: implement member CRUD Server Actions with Zod validation"
git commit -m "feat: build admin members list with status badges and search"
git commit -m "feat: build member create and edit forms with plan assignment"
```

**✅ Build check Fase 2:** `pnpm build`

---

## Fase 3 — Portal del Miembro

**Objetivo:** Vista propia del miembro: perfil, plan activo, clases inscritas y pagos.

### Tests primero (TDD)

`src/tests/member-portal.test.ts`:
```ts
// getMemberProfile: retorna solo el perfil del usuario autenticado
// getMemberClasses: retorna solo inscripciones activas del miembro
// getMemberPayments: retorna solo pagos del miembro autenticado
// Un miembro no puede ver el perfil de otro miembro (RLS)
```

### Implementación

1. **Server Actions** (`src/app/actions/member-portal.ts`): `getMemberProfile`, `updateMemberProfile`, `getMemberUpcomingClasses`, `getMemberPaymentHistory`
2. **Páginas miembro:**
   - `/member/dashboard` — resumen: plan activo con días restantes, próximas 3 clases, último pago
   - `/member/profile` — edición de nombre, teléfono y foto
   - `/member/payments` — historial completo de pagos con estado

### Commits
```bash
git commit -m "test: add unit tests for member portal Server Actions"
git commit -m "feat: build member dashboard with plan status and upcoming classes"
git commit -m "feat: build member profile edit and payment history pages"
```

**✅ Build check Fase 3:** `pnpm build`

---

## Fase 4 — Módulo de Entrenadores

**Objetivo:** CRUD de entrenadores con disponibilidad semanal y perfil público.

### Tests primero (TDD)

`src/tests/trainers.test.ts`:
```ts
// createTrainer: valida full_name y specialty como requeridos
// setTrainerAvailability: rechaza end_time <= start_time
// getAvailableTrainers: filtra por day_of_week y rango horario
// getTrainerClasses: retorna clases futuras del entrenador
```

### Implementación

1. **Server Actions** (`src/app/actions/trainers.ts`): `createTrainer`, `updateTrainer`, `setAvailability`, `getTrainers`, `getTrainerById`
2. **Páginas admin:**
   - `/admin/trainers` — lista con especialidad y estado activo/inactivo
   - `/admin/trainers/new` — formulario con disponibilidad semanal (grid de días × horarios)
   - `/admin/trainers/[id]` — perfil, edición y lista de clases asignadas
3. **Componente `WeeklyScheduleGrid`** — selección visual de disponibilidad por día y bloque horario

### Commits
```bash
git commit -m "test: add unit tests for trainer Server Actions and availability logic"
git commit -m "feat: implement trainer CRUD with weekly availability management"
git commit -m "feat: build trainer list and profile pages with schedule grid"
```

**✅ Build check Fase 4:** `pnpm build`

---

## Fase 5 — Módulo de Clases Grupales

**Objetivo:** Agenda visual, inscripciones y cancelaciones con regla de 24 horas.

### Tests primero (TDD)

`src/tests/classes.test.ts`:
```ts
// createClass: valida max_capacity > 0 y scheduled_at en el futuro
// enrollMember: falla si cupos disponibles === 0
// enrollMember: falla si el miembro ya tiene inscripción activa en esa clase
// enrollMember: permite re-inscripción si inscripción previa está cancelada
// cancelEnrollment: permite cancelar si faltan > 24 horas
// cancelEnrollment: rechaza cancelación si faltan <= 24 horas
// getAvailableSpots: retorna max_capacity - count(active enrollments)
```

### Implementación

1. **Server Actions** (`src/app/actions/classes.ts`): `createClass`, `updateClass`, `deleteClass`, `enrollMember`, `cancelEnrollment`, `getClasses`, `getClassById`
2. **Lógica de re-inscripción:** el action verifica si existe una fila `cancelled` y hace `UPDATE` en lugar de `INSERT`
3. **Páginas admin:**
   - `/admin/classes` — agenda visual con cupos restantes por clase
   - `/admin/classes/new` — formulario con selector de entrenador filtrado por disponibilidad
   - `/admin/classes/[id]` — detalle, roster de inscritos, edición
4. **Páginas miembro:**
   - `/member/classes` — agenda de clases disponibles con botón de reserva
   - `/member/classes/[id]` — detalle con botón de reserva o cancelación (con mensaje si está fuera del plazo)

### Commits
```bash
git commit -m "test: add unit tests for class enrollment and 24h cancellation rule"
git commit -m "feat: implement class CRUD and enrollment Server Actions"
git commit -m "feat: build admin class agenda with trainer availability filter"
git commit -m "feat: build member class booking and cancellation flow"
```

**✅ Build check Fase 5:** `pnpm build`

---

## Fase 6 — Módulo de Finanzas

**Objetivo:** Registro manual de pagos y adeudos, historial por miembro.

### Tests primero (TDD)

`src/tests/payments.test.ts`:
```ts
// registerPayment: solo admin puede crear pagos
// registerPayment: valida amount > 0 y concept requerido
// registerPayment: status 'pending' requiere due_date
// getMemberBalance: suma correctamente adeudos pendientes
// getPaymentHistory: filtra por member_id correctamente (RLS)
```

### Implementación

1. **Server Actions** (`src/app/actions/payments.ts`): `registerPayment`, `updatePaymentStatus`, `getPaymentsByMember`, `getAllPayments`
2. **Páginas admin:**
   - `/admin/payments` — lista global con filtro por miembro, estado y fecha
   - `/admin/payments/new` — formulario: seleccionar miembro, concepto, monto, estado, fecha de vencimiento
3. **Indicador de saldo** en `/admin/members/[id]` y en `/member/dashboard`

### Commits
```bash
git commit -m "test: add unit tests for payment registration Server Actions"
git commit -m "feat: implement payment CRUD and balance calculation"
git commit -m "feat: build admin payments list and registration form"
```

**✅ Build check Fase 6:** `pnpm build`

---

## Fase 7 — Dashboard Analítico (Retención)

**Objetivo:** Panel con métricas clave y gráfico de retención con selector de fechas.

### Tests primero (TDD)

`src/tests/retention.test.ts`:
```ts
// calculateRetentionRate: ((members_end - new_members) / members_start) * 100
// calculateRetentionRate: retorna 0 si members_start === 0 (evitar división por cero)
// getRetentionMetrics: filtra por rango de fechas correctamente
// getRetentionMetrics: cuenta nuevas altas dentro del período
```

### Implementación

1. **Server Action** (`src/app/actions/analytics.ts`): `getRetentionMetrics(startDate, endDate)` — consulta `member_memberships` agrupada por mes
2. **Componentes Tremor:**
   - `KpiCard` para: total activos, nuevas altas, bajas, tasa de retención
   - `LineChart` de Tremor (o Recharts) para el comportamiento mensual
3. **Página** `/admin/dashboard`:
   - Date range picker con shadcn Calendar (dos calendarios: inicio y fin)
   - KPIs actualizados al aplicar el filtro vía Server Action
   - Gráfico de línea con la serie temporal

### Commits
```bash
git commit -m "test: add unit tests for retention rate calculation"
git commit -m "feat: implement retention analytics Server Action with date filtering"
git commit -m "feat: build admin dashboard with Tremor KPI cards and retention chart"
```

**✅ Build check Fase 7:** `pnpm build`

---

## Fase 8 — Aportación Extra: Check-in QR

**Objetivo:** QR por miembro en portal mobile + scanner de validación en recepción.

### Tests primero (TDD)

`src/tests/qr-checkin.test.ts`:
```ts
// validateMemberQR: retorna perfil del miembro dado su UUID válido
// validateMemberQR: retorna error 'not_found' si UUID no existe
// validateMemberQR: incluye estado de membresía y saldo pendiente en respuesta
// validateMemberQR: marca como 'access_denied' si membresía vencida o adeudo > 0
```

### Implementación

1. **Server Action** (`src/app/actions/qr.ts`): `validateMemberByUUID(memberId)` — consulta `profiles` + `member_memberships` + `payments` pendientes
2. **Página miembro** `/member/qr`:
   - Componente Client: `react-qr-code` renderiza SVG con el UUID del miembro
   - Botón de descarga del QR como imagen PNG
   - Pantalla optimizada para móvil (QR grande, fondo oscuro)
3. **Página admin** `/admin/scan`:
   - Componente Client: inicializa `html5-qrcode` en `useEffect`
   - Al escanear: llama `validateMemberByUUID` → muestra card con foto, nombre, estado de membresía
   - Estado verde (acceso OK) o rojo (membresía vencida / adeudo pendiente)

### Commits
```bash
git commit -m "test: add unit tests for QR member validation Server Action"
git commit -m "feat: implement QR generation page for member mobile view"
git commit -m "feat: implement QR scanner reception page with access validation"
```

**✅ Build check Fase 8:** `pnpm build`

---

## Fase 9 — PWA + Polish Responsivo

**Objetivo:** App instalable, soporte offline básico, revisión de responsividad completa.

### Implementación

**9.1 — Configurar `@serwist/next`**

`next.config.ts`:
```ts
import withSerwist from "@serwist/next"

const withSerwistConfig = withSerwist({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
})

export default withSerwistConfig({ /* next config */ })
```

`src/sw.ts` — Service Worker con caching de rutas estáticas y runtime caching para assets.

`public/manifest.json`:
```json
{
  "name": "Gym Power CDMX",
  "short_name": "GymPower",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "icons": [{ "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" }]
}
```

**9.2 — Revisión de responsividad**
- [ ] Mobile (< 768px): navegación por drawer/bottom-nav, tablas colapsadas a cards
- [ ] Tablet (≥ 768px): sidebar colapsable, formularios en 2 columnas
- [ ] Desktop (≥ 1200px): sidebar fijo, dashboard en grid completo
- [ ] Touch targets ≥ 44×44px verificados en todos los botones de acción
- [ ] Sin funcionalidad bloqueada por `hover` en móvil

### Commits
```bash
git commit -m "feat: configure @serwist/next PWA with service worker and manifest"
git commit -m "fix: responsive layout adjustments for mobile and tablet breakpoints"
```

**✅ Build check Fase 9:** `pnpm build`

---

## Fase 10 — Despliegue

**Objetivo:** Sistema público y estable antes de las 6:00 PM del día de entrega.

### Pasos

**10.1 — Supabase producción**
```bash
# Aplicar schema a producción
pnpm exec supabase db push --linked

# Ejecutar seed en producción (usar service role key de prod)
SUPABASE_URL=<prod-url> SUPABASE_SERVICE_ROLE_KEY=<prod-key> pnpm seed
```

**10.2 — Docker**

`Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["pnpm", "start"]
```

**10.3 — Dokploy en VPS**
- Crear nueva aplicación en Dokploy → conectar repositorio Git
- Configurar variables de entorno de producción (Supabase URL, anon key)
- Habilitar auto-deploy en rama `main`
- Verificar dominio/URL pública accesible

**10.4 — Verificación final**
- [ ] Login con `demo@gympowercdmx.mx` / `DemoPower2026!` → panel admin con datos
- [ ] Login con `miembro@gympowercdmx.mx` / `MiembroPower2026!` → portal miembro
- [ ] Flujo reserva de clase en móvil
- [ ] QR generado y escaneable
- [ ] Dashboard de retención con datos del seed
- [ ] PWA instalable desde Chrome móvil

### Commits
```bash
git commit -m "chore: add Dockerfile for production deployment"
git commit -m "chore: add deployment configuration for Dokploy"
git commit -m "feat: deploy to production — system live at <url>"
```

---

## Resumen de Fases y Commits

| Fase | Descripción | Commits mín. |
|---|---|---|
| 0 | Setup + infraestructura + Stitch | 5 |
| 1 | Auth + middleware por rol | 3 |
| 2 | Módulo Miembros (CRM) | 4 |
| 3 | Portal del Miembro | 3 |
| 4 | Módulo Entrenadores | 3 |
| 5 | Clases Grupales + inscripciones | 4 |
| 6 | Finanzas (pagos) | 3 |
| 7 | Dashboard retención | 3 |
| 8 | Check-in QR | 3 |
| 9 | PWA + polish responsivo | 2 |
| 10 | Despliegue | 3 |
| **Total** | | **36 commits** |

---

## Estructura de Carpetas Final

```
gym-power-cdmx/
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (admin)/admin/
│   │   │   ├── dashboard/
│   │   │   ├── members/[id]/
│   │   │   ├── classes/[id]/
│   │   │   ├── trainers/[id]/
│   │   │   ├── payments/
│   │   │   └── scan/
│   │   └── (member)/member/
│   │       ├── dashboard/
│   │       ├── profile/
│   │       ├── classes/[id]/
│   │       ├── payments/
│   │       └── qr/
│   │   └── actions/          ← Server Actions por módulo
│   ├── components/           ← Componentes reutilizables + shadcn/ui
│   ├── lib/
│   │   ├── supabase/         ← client.ts, server.ts
│   │   └── validations/      ← Zod schemas por módulo
│   ├── types/
│   │   └── database.types.ts ← Auto-generado por supabase gen types
│   ├── tests/                ← Vitest unit tests
│   └── sw.ts                 ← Service Worker (serwist)
├── supabase/
│   ├── migrations/           ← SQL versionado en Git
│   └── seed.sql
├── scripts/
│   └── seed.ts               ← Script de seed con datos demo
├── docs/
│   ├── PRD.md
│   ├── SCHEMA.md
│   ├── PLAN.md
│   └── stitch/               ← Capturas de pantallas generadas con Stitch
├── public/
│   ├── manifest.json
│   └── sw.js                 ← Generado por @serwist/next en build
├── Dockerfile
├── middleware.ts
└── next.config.ts
```
