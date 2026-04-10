---
name: supabase-nextjs-ssr
description: Use when creating a Supabase client in any Next.js App Router context — Server Components, Client Components, Server Actions, Route Handlers, or Middleware
---

# Supabase + Next.js App Router — Client Reference

## Overview

`@supabase/ssr` exposes dos funciones. Elegir la incorrecta rompe la sesión o bypasea RLS silenciosamente sin error en consola.

**Regla de oro:** si el código corre en el servidor (Server Component, Action, Route Handler, Middleware) → `createServerClient`. Si corre en el browser → `createBrowserClient`.

## Tabla de Referencia Rápida

| Contexto de ejecución | Función | Import cookies de |
|---|---|---|
| Client Component (`'use client'`) | `createBrowserClient` | — |
| Server Component | `createServerClient` | `next/headers` |
| Server Action (`'use server'`) | `createServerClient` | `next/headers` |
| Route Handler (`route.ts`) | `createServerClient` | `next/headers` |
| Middleware (`middleware.ts`) | `createServerClient` | `NextRequest` / `NextResponse` |
| Script de seed / admin | `createClient` + service role key | `@supabase/supabase-js` |

## Implementación Canónica — Helpers del Proyecto

Todos los clientes del proyecto viven en `src/lib/supabase/`. **Nunca crear clientes inline fuera de estos helpers.**

### `src/lib/supabase/client.ts` — Browser (Client Components)

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `src/lib/supabase/server.ts` — Server (Components, Actions, Route Handlers)

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Components no pueden setear cookies; el middleware lo maneja
          }
        },
      },
    }
  )
}
```

### `src/lib/supabase/middleware.ts` — Middleware

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRÍTICO: refreshear sesión en cada request para renovar el token
  const { data: { user } } = await supabase.auth.getUser()

  return { supabase, supabaseResponse, user }
}
```

### `middleware.ts` (raíz del proyecto)

```typescript
import { updateSession } from '@/lib/supabase/middleware'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Redirigir a login si no hay sesión en ruta protegida
  if (!user && (pathname.startsWith('/admin') || pathname.startsWith('/member'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirigir por rol
  if (user) {
    const role = user.user_metadata?.role as string | undefined
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/member/dashboard', request.url))
    }
    if (pathname.startsWith('/member') && role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

## Cómo Usar en Cada Contexto

### Server Component
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: members } = await supabase.from('profiles').select('*')
  return <div>{/* render members */}</div>
}
```

### Server Action
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMember(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').insert({ /* ... */ })
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/members')
  return { success: true }
}
```

### Client Component
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function MemberQR({ memberId }: { memberId: string }) {
  const supabase = createClient()  // no async en cliente
  // ...
}
```

## Errores Críticos

| Error | Consecuencia | Solución |
|---|---|---|
| `createBrowserClient` en Server Component | Sesión no se lee; queries corren con rol `anon` | Usar `createClient()` de `server.ts` |
| `createServerClient` sin refreshear sesión en middleware | Token expira → usuario se desloguea inesperadamente | Llamar siempre `supabase.auth.getUser()` en middleware |
| Service role key en código de app | Bypasea RLS completamente — cualquier usuario tiene acceso total | Service role key SOLO en `scripts/seed.ts` o funciones Edge de Supabase |
| Olvidar `await cookies()` en Next.js 15+ | Error en runtime: `cookies()` es ahora async | Siempre `await cookies()` en server.ts |
| Crear cliente dentro de Server Component con `cookies()` sin el helper | Duplicación e inconsistencias de sesión | Siempre importar de `@/lib/supabase/server` |

## Verificación de Sesión Correcta

Para obtener el usuario autenticado en Server Components y Actions, siempre usar `getUser()` (verifica con el servidor), nunca `getSession()` (lee solo el token local):

```typescript
// ✅ Correcto — verifica con Supabase Auth server
const { data: { user } } = await supabase.auth.getUser()

// ❌ Incorrecto — no verifica, puede tener datos stale
const { data: { session } } = await supabase.auth.getSession()
```
