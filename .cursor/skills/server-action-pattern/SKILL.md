---
name: server-action-pattern
description: Use when implementing any Server Action that handles form data or mutations in this project
---

# Server Action Pattern — Zod + React Hook Form + useActionState

## Overview

Un schema Zod se define una sola vez y se comparte entre el formulario (validación en cliente) y el Server Action (validación en servidor). Esto garantiza que la misma regla se aplica en ambos lados sin duplicación.

**Stack:** React Hook Form + Zod + `useActionState` (React 19) + Next.js Server Actions + `revalidatePath`

## Estructura de 3 Archivos por Módulo

```
src/
├── lib/validations/
│   └── member.schema.ts        ← 1. Schema Zod (compartido)
├── app/actions/
│   └── members.ts              ← 2. Server Action (importa el schema)
└── app/(admin)/admin/members/
    └── new/
        └── MemberForm.tsx      ← 3. Client Component (importa schema + action)
```

## Tipo de Retorno Canónico

Todas las Server Actions de este proyecto devuelven este tipo. **No inventar variantes.**

```typescript
// src/types/actions.ts
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string }
```

## Implementación Completa — Ejemplo con Módulo de Miembros

### 1. Schema Zod (`src/lib/validations/member.schema.ts`)

```typescript
import { z } from 'zod'

export const memberSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  plan_id: z.string().uuid('Selecciona un plan válido'),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
  end_date: z.string().min(1, 'La fecha de vencimiento es requerida'),
})

export type MemberFormValues = z.infer<typeof memberSchema>
```

### 2. Server Action (`src/app/actions/members.ts`)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { memberSchema } from '@/lib/validations/member.schema'
import type { ActionResult } from '@/types/actions'
import { revalidatePath } from 'next/cache'

export async function createMember(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  // 1. Validar con el mismo schema del formulario
  const raw = Object.fromEntries(formData)
  const parsed = memberSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Datos inválidos',
    }
  }

  // 2. Crear cliente de servidor (respeta RLS)
  const supabase = await createClient()

  // 3. Verificar que el usuario autenticado es admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.user_metadata?.role !== 'admin') {
    return { success: false, error: 'Sin permisos' }
  }

  // 4. Insertar en DB
  const { error } = await supabase.from('profiles').insert({
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    role: 'member',
  })

  if (error) {
    // Mapear errores de Supabase a mensajes de usuario — nunca exponer error.message crudo
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un miembro con ese email' }
    }
    return { success: false, error: 'Error al crear el miembro. Intenta de nuevo.' }
  }

  // 5. Revalidar la ruta que lista los miembros
  revalidatePath('/admin/members')
  return { success: true }
}
```

### 3. Client Component con RHF (`src/app/(admin)/admin/members/new/MemberForm.tsx`)

```typescript
'use client'

import { useActionState } from 'react'  // React 19 — NO desde react-dom
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memberSchema, type MemberFormValues } from '@/lib/validations/member.schema'
import { createMember } from '@/app/actions/members'
import type { ActionResult } from '@/types/actions'

const initialState: ActionResult = { success: false, error: '' }

export function MemberForm() {
  const [state, formAction, isPending] = useActionState(createMember, initialState)

  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      plan_id: '',
      start_date: '',
      end_date: '',
    },
  })

  return (
    <form action={formAction}>
      {/* Errores del servidor */}
      {state && !state.success && state.error && (
        <p className="text-destructive text-sm">{state.error}</p>
      )}

      <input
        {...form.register('full_name')}
        placeholder="Nombre completo"
      />
      {form.formState.errors.full_name && (
        <span className="text-destructive text-xs">
          {form.formState.errors.full_name.message}
        </span>
      )}

      {/* ... resto de campos ... */}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Crear Miembro'}
      </button>
    </form>
  )
}
```

## Reglas del Patrón

| Regla | Correcto | Incorrecto |
|---|---|---|
| Schema Zod | Definido una vez en `lib/validations/` | Definido en el form Y en el action por separado |
| Retorno de action | `ActionResult<T>` canónico | `{ message: string }`, `{ ok: boolean }`, etc. |
| Hook de estado | `useActionState` de `react` | `useFormState` de `react-dom` (deprecated React 19) |
| Errores de DB | Mapeados a mensaje de usuario | `return { error: error.message }` (expone internos) |
| Revalidación | `revalidatePath()` al final de toda mutación exitosa | Olvidar revalidatePath (UI queda stale) |
| Cliente Supabase | `createClient()` de `@/lib/supabase/server` | `createBrowserClient` dentro de server action |

## Signature del Server Action

La firma siempre incluye `_prevState` como primer argumento cuando se usa con `useActionState`:

```typescript
// ✅ Correcto — compatible con useActionState
export async function miAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult>

// ❌ Incorrecto — no funciona con useActionState
export async function miAction(formData: FormData): Promise<ActionResult>
```

## Acciones sin FormData (mutaciones directas)

Para acciones que no vienen de un formulario HTML (ej. cancelar inscripción con un click):

```typescript
'use server'

export async function cancelEnrollment(enrollmentId: string): Promise<ActionResult> {
  const supabase = await createClient()
  // ... lógica ...
  revalidatePath('/member/classes')
  return { success: true }
}
```

Llamada desde el cliente con `startTransition`:
```typescript
'use client'
import { useTransition } from 'react'

export function CancelButton({ enrollmentId }: { enrollmentId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => cancelEnrollment(enrollmentId))}
      disabled={isPending}
    >
      {isPending ? 'Cancelando...' : 'Cancelar reserva'}
    </button>
  )
}
```

## Errores Comunes

| Error | Síntoma | Fix |
|---|---|---|
| `useFormState` en lugar de `useActionState` | Warning de deprecación en React 19 | Importar `useActionState` desde `react` |
| No incluir `_prevState` en la firma | `useActionState` no funciona, formulario no responde | Añadir `_prevState` como primer param |
| Olvidar `'use server'` | Error: "Functions cannot be passed directly to Client Components" | Agregar directiva al inicio del archivo de actions |
| Schema Zod en el mismo archivo del form | El schema se bundle en el cliente con código de servidor | Mover schema a `lib/validations/` |
