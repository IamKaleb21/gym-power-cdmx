# Gym Power CDMX

Sistema web para gestión de gimnasio: **panel de administración** (miembros, clases, entrenadores, pagos, escaneo QR) y **portal del miembro** (agenda, pagos, perfil). Stack: **Next.js** (App Router), **Supabase** (Auth + Postgres + RLS), **Tailwind CSS**.

## Demo en vivo (entrega ReWo)

| | |
| --- | --- |
| **URL pública** | [https://gym-power-cdmx.vercel.app/](https://gym-power-cdmx.vercel.app/) |

### Credenciales de prueba (usuarios generados por seed)

Tras ejecutar `pnpm seed` contra tu proyecto Supabase, existen cuentas demo. **Contraseña única del seed:** `Demo1234!`

| Rol | Email | Contraseña |
| --- | --- | --- |
| Admin | `admin@gympower.demo` | `Demo1234!` |
| Miembro | `member.demo@gympower.demo` | `Demo1234!` |

Otros miembros de ejemplo: `member01@gympower.demo` … `member35@gympower.demo` (misma contraseña).

**Nota:** La demo en Vercel debe apuntar a un proyecto Supabase donde se haya corrido el seed al menos una vez; en local, configura `.env.local` y ejecuta `pnpm seed` antes de probar login.

---

## Stack

- **Next.js** 16.x, **React** 19.x
- **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`)
- **Estilos:** Tailwind CSS 4, componentes propios / shadcn
- **PWA:** Serwist (service worker, manifest)
- **Gráficos:** Recharts (dashboard admin)
- **Gestor de paquetes:** `pnpm`

## Requisitos

- **Node.js** LTS (20+ recomendado)
- Proyecto **Supabase** (URL + anon key + service role para seed y acciones admin)
- Cuenta en **Vercel** (u otro host) para el despliegue público

## Variables de entorno

Crea `.env.local` en la raíz (no commitear secretos). Nombres esperados:

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (cliente y servidor) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor: seed, operaciones admin que bypass RLS |

Valores: panel del proyecto Supabase → Settings → API. Detalles de decisiones: [docs/DECISIONS.md](docs/DECISIONS.md).

## Setup local

```bash
pnpm install
# Configurar .env.local (ver tabla anterior)
pnpm dev
```

- App: [http://localhost:3000](http://localhost:3000)
- Poblar datos demo: `pnpm seed` (requiere `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`)

Otros comandos útiles:

```bash
pnpm build      # compilación de producción
pnpm test       # Vitest
pnpm test:e2e    # Playwright (requiere entorno preparado)
```

## Arquitectura (resumen)

- **Rutas:** grupos `(auth)` (login), `(admin)` (panel), `(member)` (portal). El middleware y helpers en `src/lib/auth/` redirigen según rol.
- **Datos:** Postgres en Supabase; políticas **RLS** documentadas en [docs/SCHEMA.md](docs/SCHEMA.md).
- **Mutaciones:** preferentemente **Server Actions** en `src/app/actions/` (ver [`.cursor/skills/server-action-pattern/SKILL.md`](.cursor/skills/server-action-pattern/SKILL.md) en el repo).
- **Fechas CDMX:** utilidades en `src/lib/dates/mexico-city.ts` donde aplica.

Documentación ampliada:

| Documento | Contenido |
| --- | --- |
| [docs/PLAN.md](docs/PLAN.md) | Plan por fases |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Decisiones técnicas |
| [docs/SCHEMA.md](docs/SCHEMA.md) | Esquema de tablas y RLS |
| [docs/PRD.md](docs/PRD.md) | Requisitos de producto |

## API y servidor

No hay OpenAPI único. La superficie principal es:

- **Páginas** bajo `/admin/*`, `/member/*`, `/login`
- **Server Actions** en `src/app/actions/` (miembros, clases, pagos, QR, etc.)
- **libs** en `src/lib/` (Supabase admin/cliente, analytics, pagos, validaciones)

Para contratos de datos, ver tablas y relaciones en [docs/SCHEMA.md](docs/SCHEMA.md).

## Aportación extra (criterio ReWo)

Además del alcance base del [PRD](docs/PRD.md), el proyecto incluye entre otras:

- **PWA** (Serwist): instalación, offline parcial; detalles en decisiones y planes en `docs/plans/` (fase PWA).
- **Dashboard de analytics** ampliado: KPIs de membresías, ingresos por mes, flujo altas vs bajas, métricas de retención con lógica documentada en código y tests (`src/lib/analytics/`, `src/tests/retention.test.ts`).

Cómo y por qué: [docs/DECISIONS.md](docs/DECISIONS.md) y commits recientes del repositorio.

## Licencia

Proyecto privado (`"private": true` en `package.json`).
