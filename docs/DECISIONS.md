# Decisiones Técnicas — Gym Power CDMX

Registro de decisiones relevantes tomadas durante la implementación. Sirve como fuente de verdad para mantener consistencia en fases futuras.

---

## Fase 0 — Inicialización e Infraestructura

### 0.1 Stack base

| Decisión | Valor |
|---|---|
| Framework | Next.js 16.2.3 con App Router |
| Lenguaje | TypeScript estricto |
| Estilos | Tailwind CSS 4 |
| Package manager | pnpm |
| Node target | `node:path`, `node:fs` (prefijo explícito) |

**Motivo:** Next.js 16 + React 19 provee la API más reciente de Server Components y el middleware en `src/middleware.ts` para auth y rutas protegidas. Se usa el prefijo `node:` para imports de módulos built-in como convención explícita.

---

### 0.2 Dependencias de producción clave

```
@supabase/ssr          → clientes SSR/RSC oficiales de Supabase
@supabase/supabase-js  → cliente base
react-hook-form        → manejo de formularios
@hookform/resolvers    → integración con Zod (aunque en login se usa safeParse manual)
zod                    → validación de esquemas
shadcn/ui              → sistema de componentes (base: New York, CSS variables)
lucide-react           → iconografía
@tremor/react          → charts y componentes de dashboard
recharts               → gráficas (requerida por Tremor)
date-fns               → manipulación de fechas
react-day-picker       → picker de calendario
html5-qrcode           → lectura de QR (escáner)
react-qr-code          → generación de QR
@serwist/next          → PWA / service worker
```

**Nota sobre `zodResolver`:** Al usar `react-hook-form` + `zod` en Server Components o cuando el compilador no infiere correctamente el tipo del resolver, se optó por **validación manual con `loginSchema.safeParse(values)` + `form.setError`** para evitar errores de tipo en `pnpm build`. No usar `zodResolver` directamente en este proyecto hasta que la incompatibilidad de tipos se resuelva upstream.

---

### 0.3 Supabase CLI y migraciones

- **CLI vía `pnpm dlx`:** No se instaló `supabase` como global del sistema; se ejecuta con `pnpm --package=supabase dlx supabase <cmd>` para reproducibilidad.
- **Un único archivo de migración inicial** (`20260410132330_create_initial_schema.sql`) generado desde `docs/SCHEMA.md`.
- **Limpieza del SQL de migración:** Se eliminaron fragmentos no ejecutables que eran notas de diseño (expresiones `CASE … AS status` sueltas y `max_capacity - COUNT(...) AS available_spots` sin contexto de SELECT). Las migraciones deben contener solo SQL ejecutable.
- **`supabase db reset`** se usa como comando canónico para resetear y re-aplicar todas las migraciones en local.
- **Tipos TypeScript** generados en `src/types/database.types.ts` con `supabase gen types typescript`.

---

### 0.4 Supabase MCP en Cursor

- Se detectó configuración MCP global existente (`~/.cursor/mcp.json`) con el servidor de Supabase ya configurado.
- **No se creó un `mcp.json` a nivel proyecto** para evitar comprometer el PAT en el repositorio.
- El acceso a herramientas MCP de Supabase queda disponible globalmente en Cursor sin configuración adicional por proyecto.

---

### 0.5 Variables de entorno

| Variable | Scope | Descripción |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Público (client + server) | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Público (client + server) | Anon key para operaciones públicas/auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo server | Service role para operaciones privilegiadas (seed, admin) |

- Todas las variables viven en `.env.local` (excluido de git).
- **Nunca** exponer `SUPABASE_SERVICE_ROLE_KEY` en el cliente. Solo en scripts de servidor o Node puro.

---

### 0.6 Testing

**Vitest** (unit/integration):

```ts
// vitest.config.ts — decisiones clave
{
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } }, // necesario para resolver @/* en tests
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "scripts/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"], // evita que Vitest descubra specs de Playwright
  }
}
```

**Playwright** (E2E):

```ts
// playwright.config.ts — decisiones clave
{
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3010" },
  webServer: {
    // `--webpack` alinea el dev server con `pnpm build --webpack` (Serwist / PWA)
    command: "PORT=3010 pnpm exec next dev --webpack",
    url: "http://localhost:3010",
    reuseExistingServer: true, // no falla si ya hay un dev server corriendo
  }
}
```

**Separación de comandos:**

| Comando | Runner | Alcance |
|---|---|---|
| `pnpm test` | Vitest | `src/**` + `scripts/**` |
| `pnpm test:watch` | Vitest (watch) | Mismo scope |
| `pnpm test:e2e` | Playwright | `e2e/**` |

**Regla de oro:** `pnpm test` + `pnpm build` deben pasar antes de cualquier commit.

---

### 0.8 Script de seed

- Ubicación: `scripts/seed.ts`, ejecutado con `tsx` (`pnpm seed`).
- `tsx` no carga `.env.local` automáticamente. Se implementó un **loader manual de `.env.local`** al inicio de `runSeed()` usando `node:fs` + `node:path`, sin dependencias extra.
- La función `runSeed` y `buildSeedBlueprint` se exportan para ser testeable en Vitest.
- El bloque `runSeed().catch(process.exit)` está protegido con `if (!process.env.VITEST)` para evitar que el test runner aborte al importar el módulo.
- **Credenciales de prueba generadas por el seed:**

| Email | Contraseña | Rol |
|---|---|---|
| `admin@gympower.demo` | `Admin1234!` | admin |
| `member.demo@gympower.demo` | `Member1234!` | member |
| `member01..10@gympower.demo` | `Member1234!` | member |

---

## Fase 1 — Autenticación y Routing basado en Roles

### Estructura de archivos de autenticación

```
src/
├── middleware.ts               ← punto de entrada del middleware (App Router)
├── lib/
│   ├── auth/
│   │   ├── routing.ts          ← lógica pura de decisión de rutas (testeable sin Next.js)
│   │   └── login.ts            ← lógica pura de resultado de login (testeable sin Next.js)
│   └── supabase/
│       ├── client.ts           ← createBrowserClient (uso en Client Components)
│       ├── server.ts           ← createServerClient con cookies (RSC / Server Actions)
│       └── middleware.ts       ← createServerClient adaptado para NextRequest/NextResponse
```

**Principio de separación:** La lógica de negocio (`routing.ts`, `login.ts`) es pura y no depende de Next.js ni de Supabase. Se puede testear con Vitest sin ningún mock de framework.

---

### Middleware — `src/middleware.ts`

**Ubicación actual:** El middleware vive en **`src/middleware.ts`** (convención estándar del App Router). La función default export se llama `proxy` por legibilidad; Next.js la invoca como middleware.

**Regla de export:** **default export** obligatorio (`export default async function proxy(...)`).

**Restricción de config:** El objeto `config` con `matcher` **no puede ser reexportado** desde otro módulo. Debe definirse literalmente en el mismo archivo.

```ts
// src/middleware.ts
export default async function proxy(request: NextRequest) { ... }
export const config = { matcher: ["/admin/:path*", "/member/:path*", "/login"] };
```

**Nota Next.js 16:** El framework puede mostrar avisos de deprecación del nombre `middleware`; si en el futuro se migra a `proxy.ts` en la raíz, mantener la misma lógica y `matcher` aquí documentados.

**Flujo de ejecución:**
1. `supabase.auth.getUser()` — obtiene usuario autenticado de la sesión SSR
2. Si hay usuario → consulta `profiles.role` para determinar rol
3. `resolveProtectedRoute(pathname, role)` — devuelve decisión sin side effects
4. Si no se permite → redirect inmediato
5. Si usuario autenticado llega a `/login` → redirect a su dashboard

**Rutas bajo el mismo matcher:** Cualquier ruta nueva bajo `/admin/*` o `/member/*` queda protegida automáticamente (p. ej. `/admin/scan`, `/member/qr` en Fase 8).

**Por qué `getUser()` y no `getSession()`:** `getUser()` valida el token contra el servidor de Supabase en cada request, lo que garantiza que sesiones revocadas se detecten. `getSession()` solo lee la cookie local sin validar.

---

### Lógica de routing — `src/lib/auth/routing.ts`

Protección **bidireccional estricta**:

| Rol | Acceso a `/admin/*` | Acceso a `/member/*` |
|---|---|---|
| No autenticado | → `/login` | → `/login` |
| `admin` | ✓ | → `/admin/dashboard` |
| `member` | → `/member/dashboard` | ✓ |

**Motivo de bidireccionalidad:** Sin proteger también el camino inverso (admin → member), un admin con acceso a cookies podría navegar a rutas de miembro sin restricción.

---

### Fix: Cookies en RSC (`server.ts`)

El `setAll` de `@supabase/ssr` en `createClient` del servidor intenta escribir cookies cuando refresca el token. Los RSC solo pueden leer cookies — escribir lanza `Cookies can only be modified in a Server Action or Route Handler`. El fix es envolver el `cookieStore.set` en `try/catch` en `src/lib/supabase/server.ts`. El refresco real lo maneja `src/middleware.ts`, que sí tiene acceso de escritura a las cookies en cada request.

---

### Fix: `<link rel="stylesheet">` fuera de `<head>` (Material Symbols)

El tag `<link rel="stylesheet">` de Material Symbols se colocó como hijo directo de `<html>`, lo que React marcaba como error de hidratación y sobrecargas de HMR. El fix es envolverlo en `<head>` explícito dentro del `RootLayout`:

```tsx
// src/app/layout.tsx
<html lang="es" className={...}>
  <head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined..." />
  </head>
  <body>{children}</body>
</html>
```

En Next.js App Router, poner `<head>` explícito dentro del layout raíz es válido y es el lugar correcto para recursos externos que no son gestionados por `next/font`.

---

### Clientes Supabase por contexto

| Archivo | Cuándo usar |
|---|---|
| `lib/supabase/client.ts` | `"use client"` components, event handlers en el browser |
| `lib/supabase/server.ts` | RSC (React Server Components), Server Actions, `route.ts` |
| `lib/supabase/middleware.ts` | Exclusivo de `src/middleware.ts` — maneja cookies de request/response |

**Regla:** Nunca usar `client.ts` en un contexto de servidor. Nunca usar `server.ts` directamente en el middleware (no tiene acceso a `NextRequest`).

---

### Página de Login — `src/app/(auth)/login/page.tsx`

- Diseño calco del prototipo HTML de Google Stitch (`docs/stitch/02-login-access-portal.html`).
- Fuentes: `Inter` (body/labels) + `Space Grotesk` (título de marca) vía `next/font/google`.
- Validación manual: `loginSchema.safeParse(values)` + `form.setError` (no `zodResolver` — ver decisión en 0.2).
- **UI adicional (Fase 9):** íconos Material Symbols en email (`alternate_email`) y contraseña (`lock`), botón de visibilidad de contraseña, flecha del submit con `arrow_forward_ios`, año de copyright actualizado en el footer.
- **Flujo post-login:**
  1. `supabase.auth.signInWithPassword`
  2. Query a `profiles` para obtener `role`
  3. `getLoginResult({ ok: true, role })` → `redirectTo`
  4. `router.push(redirectTo)`
- Ruta protegida en el middleware: si llega autenticado a `/login`, se redirige automáticamente a su dashboard.

---

### Cobertura de tests — Fase 1

| Archivo | Tipo | Qué prueba |
|---|---|---|
| `src/tests/middleware.test.ts` | Unit (Vitest) | `resolveProtectedRoute` — 8 casos |
| `src/tests/auth.test.ts` | Unit (Vitest) | `getLoginResult` — credenciales inválidas y redirección por rol |
| `e2e/auth-guards.spec.ts` | E2E (Playwright) | Acceso sin auth, cross-role, y rutas `/admin/scan` y `/member/qr` (Fase 8) |

---

## Fase 2 — Módulo de Miembros (CRM)

### Flujo de creación de miembro

**Decisión:** El admin crea la cuenta Auth con contraseña temporal; el miembro la cambia en su primer login.

**Implementación:**
1. `auth.admin.createUser` con `email_confirm: true` y `user_metadata: { full_name, role: 'member' }` — el trigger `handle_new_user` de Postgres crea el perfil automáticamente.
2. Si se proveyó `phone`, se actualiza `profiles.phone` con el admin client en un segundo paso (el trigger no incluye `phone`).
3. Se consulta `membership_plans.duration_days` para calcular `end_date = start_date + duration_days`.
4. Se inserta en `member_memberships`.

**Nota:** Los pasos 1–4 se ejecutan desde una Server Action con el admin client (service role) que bypasea RLS. Sin él, el trigger crearía el perfil pero las inserciones de membresía fallarían por RLS.

---

### Acceso a datos — RSC + Server Actions

**Decisión:** RSC para lectura, Server Actions solo para mutaciones.

- Las páginas de lista y detalle de miembros son React Server Components que leen directamente de Supabase sin estado de cliente.
- Las mutaciones (crear, editar, eliminar, avatar) se implementan como Server Actions en `src/app/actions/members.ts`.
- Las acciones privilegiadas (crear/borrar usuario Auth) usan `createAdminClient()` (service role). Las no privilegiadas (editar perfil, avatar) usan `createClient()` (session).

---

### Cliente admin — `src/lib/supabase/admin.ts`

```ts
export function createAdminClient() {
  return createClient<Database>(url, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
```

- `autoRefreshToken: false` y `persistSession: false` porque es un cliente de servidor de vida corta, no necesita mantener sesión.
- Solo se usa en Server Actions / scripts de servidor. **Nunca** importar en Client Components.

---

### Fix: detalle de miembro 200→404 intermitente

**Causa:** La página `admin/members/[id]/page.tsx` usaba `createClient()` (sesión del usuario logueado) para leer el perfil del miembro. En dev con Turbopack, variaciones en el contexto de sesión al compilar producían respuestas vacías que disparaban `notFound()`.

**Fix:** La página de detalle usa `createAdminClient()` para la lectura del perfil, igual que las mutaciones. Las páginas de admin siempre leen con service role para evitar dependencias del contexto de sesión SSR.

---

### Fix: relación ambigua `profiles → payments`

**Causa:** La tabla `payments` tiene dos foreign keys apuntando a `profiles`: `member_id` y `created_by`. PostgREST no puede resolver el embed automáticamente y lanza `Could not embed because more than one relationship was found for 'profiles' and 'payments'`.

**Fix:** Especificar la FK explícitamente en el select con la sintaxis `!<nombre_fk>`:

```ts
// ❌ Ambiguo
.select(`payments ( id, amount, ... )`)

// ✅ Explícito
.select(`payments!payments_member_id_fkey ( id, amount, ... )`)
```

**Regla general:** Toda vez que una tabla tenga múltiples FKs hacia la misma tabla, usar la notación `!fkey` en el embed de PostgREST para evitar ambigüedad.

---

### Estructura de archivos — Fase 2

```
src/
├── middleware.ts                      ← (ver Fase 1)
├── lib/
│   ├── members/
│   │   └── status.ts                  ← getMemberStatus (pura, testeable)
│   ├── validations/
│   │   └── member.schema.ts           ← createMemberSchema + updateMemberSchema (Zod)
│   └── supabase/
│       └── admin.ts                   ← createAdminClient (service role)
├── app/
│   ├── actions/
│   │   └── members.ts                 ← Server Actions CRUD
│   └── (admin)/
│       ├── layout.tsx                 ← Sidebar + TopBar + Mobile nav
│       └── admin/members/
│           ├── page.tsx               ← Lista RSC
│           ├── new/
│           │   ├── page.tsx           ← Página de creación RSC
│           │   └── NewMemberForm.tsx  ← Formulario client
│           └── [id]/
│               ├── page.tsx           ← Detalle RSC
│               ├── EditMemberForm.tsx ← Formulario edición client
│               └── AvatarUpload.tsx   ← Upload avatar client
└── components/
    ├── admin/
    │   └── AdminNav.tsx               ← Nav con active state (client)
    └── members/
        └── MemberStatusBadge.tsx      ← Badge de estado (server-safe)
```

---

### Cobertura de tests — Fase 2

| Archivo | Tipo | Qué prueba |
|---|---|---|
| `src/tests/members.test.ts` | Unit (Vitest) | `getMemberStatus` — 5 casos de fecha |
| `src/tests/members.test.ts` | Unit (Vitest) | `createMemberSchema` — valid + 5 casos de error |
| `src/tests/members.test.ts` | Unit (Vitest) | Query detalle usa `!payments_member_id_fkey` |

---

## Fase 3 — Portal del Miembro

### Alcance y stack

- **Rutas:** `(member)/member/dashboard`, `profile`, `payments` — layout con top bar fija y **bottom nav** (`MemberNav`, client) para móvil.
- **Lectura:** RSC con `createClient()` del servidor; RLS de Supabase acota datos al `member_id` del usuario autenticado.
- **Patrón:** Misma línea que Fase 2 — formularios y acciones mutantes en Server Actions donde aplique; páginas de solo lectura como RSC.

### Identidad visual

- Paleta y tipografía alineadas al stitch del portal miembro (fondo oscuro, acento `#CCFF00` / lime en nav activo).

---

## Fase 4 — Módulo de Entrenadores

- **Admin:** `/admin/trainers`, `/new`, `/[id]` — CRUD de entrenadores, disponibilidad semanal, desactivación.
- **Datos:** Server Actions en `src/app/actions/trainers.ts` (o equivalente); lecturas en RSC con cliente según rol.
- **Tests:** Lógica de disponibilidad y validaciones cubiertas en Vitest según `src/tests/trainers.test.ts` (si existe en el repo).

---

## Fase 5 — Módulo de Clases Grupales

### Reglas de negocio

- **Cupos:** inscripción rechazada si no hay plazas (`max_capacity` vs inscripciones activas).
- **Cancelación:** ventana de **24 horas** antes de `scheduled_at` — fuera de plazo no se permite cancelar desde el portal.
- **Re-inscripción:** si existe inscripción previa en estado cancelado, el flujo puede reactivar/actualizar en lugar de duplicar filas activas (ver implementación en `src/app/actions/classes.ts`).

### Superficies

- **Admin:** agenda/listado, alta/edición de clase, asignación de entrenador acorde a disponibilidad.
- **Miembro:** `/member/classes` — listado/reserva; componentes client para día seleccionado y botón de inscripción (`EnrollButton`).

---

## Fase 6 — Módulo de Finanzas

### Utilidades compartidas

- **`src/lib/payments/utils.ts`:** `getMemberBalance`, `getMonthlyRevenue`, `formatMrrDisplay` — usadas en admin payments, dashboard y (Fase 8) validación QR.

### Superficies

- **`/admin/payments`:** métricas (MRR, ticket, adeudos), lista reciente de transacciones, formulario de registro de pago; mutaciones con admin client donde el plan lo exige.
- **Indicadores de saldo** en vistas de miembro y admin según el esquema de `payments` (`pending` / `paid`).

---

## Fase 7 — Dashboard analítico (retención)

- **`/admin/dashboard`:** KPIs y gráfica de retención; selector de rango de fechas (componentes client + datos desde RSC/acciones).
- **Stack de charts:** Tremor y/o Recharts según componentes existentes (`RetentionChart`, `RangeSelector`).
- **Tests:** Cálculos de retención y casos límite (p. ej. división por cero) en Vitest.

---

## Fase 8 — Check-in QR

### Modelo de datos en el QR

- El valor codificado es el **UUID del perfil** (`profiles.id`), no un slug ni email. Así el escáner puede validar de forma estable contra la base.

### Lógica de acceso (pura, testeable)

- **`src/lib/qr/access.ts` — `getAccessStatus`:** decide `granted` vs `denied` con prioridad: sin membresía → vencida (`end_date` vs “hoy” en zona `America/Mexico_City`) → adeudo pendiente (`pendingBalance > 0`).
- **Tests:** `src/tests/qr-checkin.test.ts` (Vitest).

### Validación en servidor

- **`src/app/actions/qr.ts` — `validateMemberByUUID`:** Zod valida UUID; `createAdminClient()` lee perfil con `role = member`, última `member_memberships` por `end_date`, pagos `pending`; reutiliza **`getMemberBalance`** de `@/lib/payments/utils`.

### UI

- **Miembro:** `/member/qr` — RSC + `QRDisplay` (`react-qr-code`, valor = id del perfil de sesión).
- **Admin:** `/admin/scan` — cliente con `html5-qrcode`, panel de resultado, entrada manual de UUID; botones **DENY / GRANT** solo visuales (sin mutación de negocio).
- **Navegación:** pestaña **QR** en `MemberNav` entre Payments y Profile (`qr_code_2`).
- **Estilos:** marcos y línea animada del escáner en `globals.css` alineados a `docs/stitch/01-admin-scan-unified.html`.

### E2E

- `e2e/auth-guards.spec.ts` incluye redirección de rol incorrecto para `/admin/scan` y `/member/qr`.

---

## Fase 9 — PWA y polish responsivo

### Serwist + Next.js 16

- **`@serwist/next`:** `withSerwistInit({ swSrc: "src/sw.ts", swDest: "public/sw.js", disable: NODE_ENV === "development" })` en `next.config.ts` — el SW no se inyecta en dev para evitar ruido en HMR.
- **`src/sw.ts`:** `Serwist` + `defaultCache` desde `@serwist/next/worker` (`skipWaiting`, `clientsClaim`, `navigationPreload`).
- **Conflicto Turbopack vs Webpack:** el plugin de Serwist es **webpack**. El build por defecto de Next 16 usa Turbopack y **no** genera `public/sw.js`. **Decisión:** script de build `next build --webpack` en `package.json` para producción y coherencia con CI.
- **TypeScript:** `lib` incluye `"webworker"`; `compilerOptions.types` incluye `"@serwist/next/typings"`; `exclude` incluye `public/sw.js` generado.
- **Git:** `.gitignore` ignora `public/sw.js`, mapas y `workbox-*` generados.

### Manifiesto e instalación

- **`public/manifest.json`:** `name`, `short_name`, `start_url`, `display: standalone`, colores `#0e0e0e`, íconos `/icon-192.png` y `/icon-512.png` (placeholders de marca: fondo oscuro + rayo lime).
- **`src/app/layout.tsx`:** `metadata.manifest`, `appleWebApp`, `export const viewport` con `themeColor` — Next emite `<link rel="manifest">` y meta de tema sin duplicar en `<head>` manual.

### Login (detalle Fase 9)

- Ver sección **Página de Login** en Fase 1: iconos en campos, toggle de contraseña, `arrow_forward_ios`, año del footer.

### Responsividad

- **MemberNav (5 ítems):** menos padding horizontal y etiqueta `text-[9px]` en pantallas estrechas.
- **Admin / member:** `min-w-0`, `truncate`, `overflow-x-auto` / `overflow-x-hidden` donde filas largas o grids podían desbordar (members, payments, classes, dashboard, `QRDisplay`).

---

## Convenciones generales

### Commits

Se usa Conventional Commits:
- `chore:` — setup, config, tooling
- `feat:` — nuevas funcionalidades
- `fix:` — corrección de bugs
- `test:` — solo tests
- `docs:` — documentación (p. ej. planes en `docs/plans/`, actualización de `DECISIONS.md`)

### Branches

Formato: `feat/<fase>-<descripcion-corta>` — ej: `feat/fase-2-members-crm`

### Ciclo de desarrollo

```
RED (test falla) → GREEN (implementación mínima) → REFACTOR → pnpm test + pnpm build → commit
```

Nunca commitear con tests o build fallando.
