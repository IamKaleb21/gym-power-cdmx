# Fase 9 — PWA + Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Configurar la app como PWA instalable (serwist + manifest + íconos) y pulir el login y la responsividad.

**Architecture:** @serwist/next wrappea next.config.ts y genera el service worker desde src/sw.ts. El login ya tiene el diseño del stitch implementado; solo necesita tweaks menores (íconos en inputs, año, arrow icon). El polish responsivo se hace página por página con audit del markup existente.

**Tech Stack:** @serwist/next ^9.5.7, serwist, react-qr-code (ya instalado), Next.js 16, Tailwind 4

---

## Task 1: Crear rama de trabajo

**Files:**
- No files

**Step 1: Crear rama**

```bash
git checkout -b feat/fase-9-pwa-polish
```

**Step 2: Verificar**

```bash
git branch --show-current
```

Expected: `feat/fase-9-pwa-polish`

---

## Task 2: Actualizar tsconfig.json para serwist

**Files:**
- Modify: `tsconfig.json`

**Step 1: Añadir `webworker` a lib y `@serwist/next/typings` a types, excluir sw generado**

Cambiar el bloque `"compilerOptions"` de:
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    ...
  },
  "exclude": ["node_modules"]
}
```

A:
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext", "webworker"],
    "types": ["@serwist/next/typings"],
    ...
  },
  "exclude": ["node_modules", "public/sw.js"]
}
```

**Step 2: Verificar que no hay errores de TypeScript**

```bash
pnpm exec tsc --noEmit 2>&1 | head -20
```

Expected: sin errores (o solo warnings previos).

---

## Task 3: Configurar @serwist/next en next.config.ts

**Files:**
- Modify: `next.config.ts`

**Step 1: Actualizar next.config.ts**

Reemplazar el contenido completo con:

```ts
import withSerwistInit from "@serwist/next"
import type { NextConfig } from "next"

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
})

const nextConfig: NextConfig = {}

export default withSerwist(nextConfig)
```

> `disable` en development evita regenerar el SW en cada hot-reload.

**Step 2: Verificar build**

```bash
pnpm build 2>&1 | tail -20
```

Expected: build exitoso (el SW se generará en `public/sw.js`).

---

## Task 4: Crear service worker src/sw.ts

**Files:**
- Create: `src/sw.ts`

**Step 1: Crear el archivo**

```ts
import { defaultCache } from "@serwist/next/worker"
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { Serwist } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

**Step 2: Verificar build**

```bash
pnpm build 2>&1 | tail -20
```

Expected: build exitoso, `public/sw.js` generado.

---

## Task 5: Crear manifest.json e íconos placeholder

**Files:**
- Create: `public/manifest.json`
- Create: `public/icon-192.png`
- Create: `public/icon-512.png`

**Step 1: Generar íconos SVG con IA**

Generar dos íconos PNG (fondo `#0e0e0e`, rayo `#cafd00`):
- `public/icon-192.png` — 192×192 px
- `public/icon-512.png` — 512×512 px

**Step 2: Crear manifest.json**

```json
{
  "name": "Gym Power CDMX",
  "short_name": "GymPower",
  "description": "Portal de gestión Gym Power CDMX",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0e0e0e",
  "theme_color": "#0e0e0e",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**Step 3: Verificar que los archivos están en `public/`**

```bash
ls public/manifest.json public/icon-192.png public/icon-512.png
```

---

## Task 6: Agregar manifest y theme-color al layout raíz

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Actualizar metadata y agregar viewport + link manifest**

Reemplazar el bloque `export const metadata` y agregar `export const viewport`:

```ts
import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: "Gym Power CDMX",
  description: "Sistema de administración Gym Power CDMX",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GymPower",
  },
}

export const viewport: Viewport = {
  themeColor: "#0e0e0e",
}
```

> Next.js 13+ maneja `<link rel="manifest">` y `<meta name="theme-color">` automáticamente a través de `metadata.manifest` y `viewport.themeColor`. No agregar manualmente en `<head>`.

**Step 2: Verificar build y que no hay linter errors**

```bash
pnpm build 2>&1 | tail -10 && pnpm exec eslint src/app/layout.tsx --max-warnings 0
```

---

## Task 7: Actualizar .gitignore para artefactos de serwist

**Files:**
- Modify: `.gitignore`

**Step 1: Agregar al final**

```
# serwist / PWA
/public/sw.js
/public/sw.js.map
/public/workbox-*.js
/public/workbox-*.js.map
```

**Step 2: Commit PWA**

```bash
git add next.config.ts src/sw.ts tsconfig.json public/manifest.json public/icon-192.png public/icon-512.png src/app/layout.tsx .gitignore
git commit -m "feat: configure @serwist/next PWA with service worker and manifest"
```

---

## Task 8: Polish login — íconos en inputs y tweaks menores

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`

El login YA tiene el diseño del stitch implementado. Solo necesita estos tweaks:

**Step 1: Identificar los cambios necesarios**

1. Inputs: agregar icono de Material Symbol a la izquierda (`alternate_email` y `lock`) y padding-left adecuado.
2. Botón submit: cambiar `→` por `<span className="material-symbols-outlined">arrow_forward_ios</span>`.
3. Footer: cambiar `© 2024` por `© 2026`.
4. Password field: agregar toggle show/hide con estado local `showPassword`.

**Step 2: Agregar `showPassword` state y toggle**

Añadir después de `const [apiError, setApiError] = useState<string | null>(null)`:
```ts
const [showPassword, setShowPassword] = useState(false)
```

**Step 3: Actualizar el EmailField**

Cambiar:
```tsx
<div className="relative group">
  <input
    type="email"
    placeholder="demo@gympowercdmx.mx"
    className="w-full border-b-2 border-transparent bg-[#262626] py-4 pr-4 pl-4 ..."
    {...form.register("email")}
  />
</div>
```

Por:
```tsx
<div className="relative group">
  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#484847] group-focus-within:text-[#cafd00] transition-colors pointer-events-none">
    alternate_email
  </span>
  <input
    type="email"
    placeholder="demo@gympowercdmx.mx"
    className="w-full border-b-2 border-transparent bg-[#262626] py-4 pr-4 pl-12 text-white placeholder:text-[#767575] transition-all focus:border-[#cafd00] focus:bg-[#20201f] focus:outline-none"
    {...form.register("email")}
  />
</div>
```

**Step 4: Actualizar el PasswordField**

```tsx
<div className="relative group">
  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#484847] group-focus-within:text-[#cafd00] transition-colors pointer-events-none">
    lock
  </span>
  <input
    type={showPassword ? "text" : "password"}
    placeholder="••••••••"
    className="w-full border-b-2 border-transparent bg-[#262626] py-4 pr-12 pl-12 text-white placeholder:text-[#767575] transition-all focus:border-[#cafd00] focus:bg-[#20201f] focus:outline-none"
    {...form.register("password")}
  />
  <button
    type="button"
    onClick={() => setShowPassword((v) => !v)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#484847] hover:text-[#cafd00] transition-colors"
    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
  >
    <span className="material-symbols-outlined text-sm">
      {showPassword ? "visibility_off" : "visibility"}
    </span>
  </button>
</div>
```

**Step 5: Cambiar el arrow del botón submit**

Reemplazar `<span>→</span>` por:
```tsx
<span className="material-symbols-outlined">arrow_forward_ios</span>
```

**Step 6: Actualizar el año en el footer**

Cambiar `© 2024` por `© 2026`.

**Step 7: Verificar eslint y build**

```bash
pnpm exec eslint "src/app/(auth)/login/page.tsx" --max-warnings 0 && pnpm build 2>&1 | tail -10
```

**Step 8: Verificar e2e login**

```bash
pnpm test:e2e 2>&1 | tail -20
```

Expected: 3 tests OK.

**Step 9: Commit**

```bash
git add "src/app/(auth)/login/page.tsx"
git commit -m "feat(login): add input icons, password toggle, and arrow symbol"
```

---

## Task 9: Responsive audit — MemberNav 5 ítems

**Files:**
- Modify: `src/components/member/MemberNav.tsx`

**Step 1: Ajustar padding en mobile para 5 ítems**

Reducir `px-3 py-1` a `px-2 py-1` en el className activo e inactivo para que 5 ítems quepan cómodamente en pantallas de 320px+.

Cambiar en el `<Link className=...>`:
```tsx
// Activo:
'text-[#CCFF00] bg-[#212121] rounded-xl px-2 py-1'
// Inactivo:
'text-gray-500 hover:text-gray-300 hover:bg-[#212121] px-2 py-1 rounded-xl'
```

Y reducir el label font-size:
```tsx
<span className="text-[9px] font-semibold uppercase tracking-wider mt-0.5 font-body">
```

**Step 2: Verificar build**

```bash
pnpm build 2>&1 | tail -10
```

---

## Task 10: Responsive audit — tablas admin

**Files:**
- Modify: `src/app/(admin)/admin/members/page.tsx` (si hace falta)
- Modify: `src/app/(admin)/admin/payments/page.tsx` (si hace falta)

**Step 1: Revisar members page**

La página de members ya usa `md:grid hidden md:grid` para el header de tabla y `flex flex-col` + `md:grid` para las filas — ya es responsive. Solo verificar que no haya columnas que se desborden en mobile (email largo, plan name).

Asegurar `min-w-0` y `truncate` en contenedores de texto de las filas.

**Step 2: Revisar payments page**

La payments page usa cards (no tabla), ya responsive. Solo verificar `overflow-x-hidden` en el wrapper principal si hay elementos absolutos que se salen.

**Step 3: Commit responsive**

```bash
git add src/components/member/MemberNav.tsx
# + cualquier admin page modificada
git commit -m "fix: responsive polish — MemberNav 5-item spacing and admin table overflow"
```

---

## Task 11: Build check final + e2e

**Step 1: Tests unitarios**

```bash
pnpm test
```

Expected: todos pasan (74+).

**Step 2: Build**

```bash
pnpm build
```

Expected: sin errores. Verificar que `/admin/scan` y `/member/qr` aparecen en el output de rutas.

**Step 3: E2E**

```bash
pnpm test:e2e
```

Expected: 3 tests OK.

**Step 4: Verificar PWA en DevTools** (manual)

Con `pnpm dev` en otro terminal: abrir Chrome DevTools → Application → Manifest → verificar que carga `manifest.json` con nombre, íconos y theme_color. Application → Service Workers → verificar que el SW está registrado (solo en production build via `pnpm start`).

---

## Commits esperados

```bash
git commit -m "feat: configure @serwist/next PWA with service worker and manifest"
git commit -m "feat(login): add input icons, password toggle, and arrow symbol"
git commit -m "fix: responsive polish — MemberNav 5-item spacing and admin table overflow"
```
