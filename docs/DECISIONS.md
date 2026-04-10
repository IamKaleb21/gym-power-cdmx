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

**Motivo:** Next.js 16 + React 19 provee la API más reciente de Server Components y el nuevo `src/proxy.ts` como punto de entrada del middleware. Se usa el prefijo `node:` para imports de módulos built-in como convención explícita.

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
    command: "PORT=3010 pnpm dev",
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
├── proxy.ts                    ← punto de entrada del middleware Next.js 16
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

### Middleware — `proxy.ts` (raíz del proyecto)

**Decisión crítica — ubicación:** En Next.js 16 con Turbopack en dev, el archivo `proxy.ts` debe residir en la **raíz del proyecto**, no en `src/`. Turbopack resuelve `[project]/proxy.ts` y si solo existe `src/proxy.ts`, el runtime alterna entre encontrarlo y no encontrarlo, produciendo el error `Could not parse module '[project]/proxy.ts', file not found` seguido de `adapterFn is not a function`.

**Solución:** Se eliminó `src/proxy.ts` y se creó `proxy.ts` en la raíz con la implementación completa.

**Regla de export:** La función debe ser **default export** (`export default async function proxy`). Un named export funciona en build de producción (Webpack) pero falla en dev con Turbopack.

**Restricción de config:** El objeto `config` con `matcher` **no puede ser reexportado** desde otro módulo. Debe definirse literalmente en el mismo archivo `proxy.ts`.

```ts
// proxy.ts (raíz del proyecto)
export default async function proxy(request: NextRequest) { ... }
export const config = { matcher: ["/admin/:path*", "/member/:path*", "/login"] };
```

**Flujo de ejecución:**
1. `supabase.auth.getUser()` — obtiene usuario autenticado de la sesión SSR
2. Si hay usuario → consulta `profiles.role` para determinar rol
3. `resolveProtectedRoute(pathname, role)` — devuelve decisión sin side effects
4. Si no se permite → redirect inmediato
5. Si usuario autenticado llega a `/login` → redirect a su dashboard

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

El `setAll` de `@supabase/ssr` en `createClient` del servidor intenta escribir cookies cuando refresca el token. Los RSC solo pueden leer cookies — escribir lanza `Cookies can only be modified in a Server Action or Route Handler`. El fix es envolver el `cookieStore.set` en `try/catch` en `src/lib/supabase/server.ts`. El refresco real lo maneja `proxy.ts` (middleware), que sí tiene acceso de escritura a las cookies en cada request.

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
| `lib/supabase/middleware.ts` | Exclusivo de `src/proxy.ts` — maneja cookies de request/response |

**Regla:** Nunca usar `client.ts` en un contexto de servidor. Nunca usar `server.ts` directamente en el middleware (no tiene acceso a `NextRequest`).

---

### Página de Login — `src/app/(auth)/login/page.tsx`

- Diseño calco del prototipo HTML de Google Stitch (`docs/stitch/02-login-access-portal.html`).
- Fuentes: `Inter` (body/labels) + `Space Grotesk` (título de marca) vía `next/font/google`.
- Validación manual: `loginSchema.safeParse(values)` + `form.setError` (no `zodResolver` — ver decisión en 0.2).
- **Flujo post-login:**
  1. `supabase.auth.signInWithPassword`
  2. Query a `profiles` para obtener `role`
  3. `getLoginResult({ ok: true, role })` → `redirectTo`
  4. `router.push(redirectTo)`
- Ruta protegida en el proxy: si llega autenticado a `/login`, se redirige automáticamente a su dashboard.

---

### Cobertura de tests — Fase 1

| Archivo | Tipo | Qué prueba |
|---|---|---|
| `src/tests/middleware.test.ts` | Unit (Vitest) | `resolveProtectedRoute` — 8 casos |
| `src/tests/auth.test.ts` | Unit (Vitest) | `getLoginResult` — credenciales inválidas y redirección por rol |
| `e2e/auth-guards.spec.ts` | E2E (Playwright) | Acceso sin auth y cross-role (Chromium) |

---

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
├── proxy.ts                           ← (raíz del proyecto, ver Fase 1 fix)
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

## Convenciones generales

### Commits

Se usa Conventional Commits:
- `chore:` — setup, config, tooling
- `feat:` — nuevas funcionalidades
- `fix:` — corrección de bugs
- `test:` — solo tests

### Branches

Formato: `feat/<fase>-<descripcion-corta>` — ej: `feat/fase-2-members-crm`

### Ciclo de desarrollo

```
RED (test falla) → GREEN (implementación mínima) → REFACTOR → pnpm test + pnpm build → commit
```

Nunca commitear con tests o build fallando.
