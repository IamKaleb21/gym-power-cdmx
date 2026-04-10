# Fase 9 — PWA + Polish Responsivo · Design

**Fecha:** 2026-04-10  
**Enfoque elegido:** A — Full fidelity al stitch + serwist canónico

---

## 1. Login Page Redesign

**Archivo:** `src/app/(auth)/login/page.tsx`

La lógica existente (useForm, Zod, supabase.auth.signInWithPassword, routing post-login) se conserva íntegra. Solo se reemplaza el markup visual para calcar `docs/stitch/02-login-access-portal.html`.

### Estructura

```
<body class="min-h-screen flex flex-col bg-[#0e0e0e]">
  <header fixed>
    Logo "GYM POWER CDMX" (texto, #cafd00)
    Nav links decorativos: Membership / Locations / Performance (text-[#262626], no href real)
    Botón Support (visual)

  <main class="kinetic-bg flex-grow flex items-center justify-center">
    "POWER" decorativo (texto 20rem, opacity-5, detrás del card)

    <div max-w-md>
      <LoginCard class="bg-[#131313] border-l-4 border-[#cafd00] p-8 lg:p-12">
        Heading: "Log In" + <span class="text-[#cafd00] italic">In</span>
        Subheading: "Access the kinetic monolith" (text-white/50, uppercase tracking-widest)

        EmailField:
          label "Email Terminal"
          icon: alternate_email (Material Symbols)
          input dark bg-[#262626]

        PasswordField:
          label "Security Key"
          icon: lock
          input dark + toggle show/hide (state local)

        Row: "Remember Session" checkbox + "Forgot Password?" link visual

        <LoginButton> bg-[#cafd00] text-[#516700] font-headline font-black text-xl
          "LOGIN" + icon arrow_forward_ios

        Error state: texto rojo bajo el botón si apiError

        Divisor + "New Performance Athlete?"
        <RequestMembershipButton> border outline, visual (href="#")

      <DemoCredentials grid 2-col>
        Admin: demo@gympowercdmx.mx
        Member: miembro@gympowercdmx.mx

    Acento decorativo derecho (lg+): línea + "Built for Power"

  <footer>
    "© 2026 GYM POWER CDMX"
    Links: Privacy / Terms / System Status: Active (href="#")
```

### CSS

`globals.css` — agregar clase `.kinetic-bg`:
```css
.kinetic-bg {
  background-image: linear-gradient(rgba(14,14,14,0.85), rgba(14,14,14,0.97)),
    url('/gym-bg.jpg');   /* o inline data-uri mínimo si no hay imagen real */
  background-size: cover;
  background-position: center;
}
```

> Si no hay imagen de gym disponible, el gradiente solo `from-[#0e0e0e] to-[#131313]` es suficiente.

---

## 2. PWA — @serwist/next

### Archivos

| Archivo | Acción |
|---------|--------|
| `next.config.ts` | Wrap con `withSerwist({ swSrc, swDest })` |
| `src/sw.ts` | Service worker con `defaultCache` de serwist |
| `public/manifest.json` | Web App Manifest completo |
| `public/icon-192.png` | Ícono generado (fondo #0e0e0e, rayo #cafd00) |
| `public/icon-512.png` | Ídem, 512×512 |
| `src/app/layout.tsx` | `<link rel="manifest">` + `<meta name="theme-color" content="#0e0e0e">` |

### manifest.json

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
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### sw.ts (minimal)

```ts
import { defaultCache } from "@serwist/next/worker"
import { Serwist } from "serwist"

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()
```

---

## 3. Responsive Polish

### Estrategia general

- Tablas admin: `overflow-x-auto` en wrapper; columnas secundarias `hidden sm:table-cell`.
- Mobile cards: cuando la tabla es muy densa, colapsar filas a card pattern con `flex sm:hidden`.
- Touch targets: mínimo `min-h-[44px]` en todos los botones de acción.
- `MemberNav` con 5 ítems: reducir `px-3` a `px-2` en mobile para que quepan sin comprimir.

### Páginas objetivo

| Página | Ajuste principal |
|--------|-----------------|
| `/admin/members` | Tabla → overflow-x-auto; columnas phone/created_at hidden en xs |
| `/admin/payments` | Tabla → overflow-x-auto; columna concept truncada en mobile |
| `/admin/classes` | Grid formulario 1-col mobile, 2-col md+ |
| `/admin/trainers` | Ídem |
| `/member/dashboard` | Cards de métricas: min-w-0 para evitar overflow |
| `/member/qr` | Centrado vertical correcto en pantallas bajas |
| `MemberNav` | 5 ítems: px-2 en mobile, font-size label si es necesario |

---

## Testing

- `pnpm build` — debe pasar sin errores
- `pnpm test` — tests existentes deben seguir verdes
- Verificación manual PWA: Chrome DevTools → Application → Manifest + Service Workers
- E2E: login flow en Playwright sigue verde con el nuevo markup
