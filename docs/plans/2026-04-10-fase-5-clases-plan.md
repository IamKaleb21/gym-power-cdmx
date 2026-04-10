# Fase 5 — Módulo de Clases Grupales: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Agenda visual de clases grupales para admin (CRUD) y portal de reservas para el miembro (inscribirse/cancelar con regla de 24h), calco 1:1 de los stitches `09-admin-classes-unified.html` y `14-member-class-schedule-booking.html`.

**Architecture:** URL `searchParams.date` (ISO `YYYY-MM-DD`) controla el día activo en RSC pages. `createAdminClient()` para lecturas (ambos roles, necesario para calcular cupos totales). `createClient()` session para mutaciones de miembro. Lógica de negocio en utils puras en `src/lib/classes/utils.ts`.

**Tech Stack:** Next.js 16 App Router (RSC + Server Actions), TypeScript strict, Tailwind CSS 4, Supabase (admin + session clients), Zod, Vitest, pnpm.

---

## Task 1: TDD — Schemas Zod + Utils de clases

**Files:**
- Create: `src/lib/validations/class.schema.ts`
- Create: `src/lib/classes/utils.ts`
- Create: `src/tests/classes.test.ts`

### Step 1: Escribir los tests (RED)

Crear `src/tests/classes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createClassSchema } from '@/lib/validations/class.schema'
import { getAvailableSpots, canCancel, getEnrollmentStatus } from '@/lib/classes/utils'

const makeEnrollments = (active: number, cancelled = 0) => [
  ...Array(active).fill({ id: 'a', status: 'active', member_id: 'member-1' }),
  ...Array(cancelled).fill({ id: 'b', status: 'cancelled', member_id: 'member-2' }),
]

describe('createClassSchema', () => {
  it('rechaza max_capacity <= 0', () => {
    const result = createClassSchema.safeParse({
      name: 'HIIT',
      trainer_id: '550e8400-e29b-41d4-a716-446655440001',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      duration_minutes: 60,
      max_capacity: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rechaza scheduled_at en el pasado', () => {
    const result = createClassSchema.safeParse({
      name: 'HIIT',
      trainer_id: '550e8400-e29b-41d4-a716-446655440001',
      scheduled_at: new Date(Date.now() - 86400000).toISOString(),
      duration_minutes: 60,
      max_capacity: 20,
    })
    expect(result.success).toBe(false)
  })

  it('acepta datos válidos', () => {
    const result = createClassSchema.safeParse({
      name: 'HIIT Advanced',
      trainer_id: '550e8400-e29b-41d4-a716-446655440001',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      duration_minutes: 60,
      max_capacity: 20,
    })
    expect(result.success).toBe(true)
  })
})

describe('getAvailableSpots', () => {
  it('resta solo enrollments activos', () => {
    expect(getAvailableSpots(makeEnrollments(3, 2), 20)).toBe(17)
  })

  it('retorna 0 si llena', () => {
    expect(getAvailableSpots(makeEnrollments(20), 20)).toBe(0)
  })
})

describe('canCancel', () => {
  it('retorna true si faltan más de 24h', () => {
    const future = new Date(Date.now() + 25 * 3600 * 1000).toISOString()
    expect(canCancel(future)).toBe(true)
  })

  it('retorna false si faltan 24h o menos', () => {
    const soon = new Date(Date.now() + 23 * 3600 * 1000).toISOString()
    expect(canCancel(soon)).toBe(false)
  })
})

describe('getEnrollmentStatus', () => {
  it('retorna booked si el miembro tiene enrollment activo', () => {
    const enrollments = [{ id: 'e1', status: 'active', member_id: 'me' }]
    expect(getEnrollmentStatus(enrollments, 'me', 20)).toBe('booked')
  })

  it('retorna full si no hay cupos y member no inscrito', () => {
    expect(getEnrollmentStatus(makeEnrollments(20), 'other', 20)).toBe('full')
  })

  it('retorna almost_full si ≤20% cupos libres', () => {
    // 17 activos de 20 → 3 libres → 15% libre → almost_full
    expect(getEnrollmentStatus(makeEnrollments(17), 'other', 20)).toBe('almost_full')
  })

  it('retorna available en caso normal', () => {
    expect(getEnrollmentStatus(makeEnrollments(5), 'other', 20)).toBe('available')
  })
})
```

### Step 2: Verificar RED

```bash
pnpm vitest run src/tests/classes.test.ts
```
Esperado: FAIL — módulos no encontrados.

### Step 3: Crear `src/lib/validations/class.schema.ts`

```typescript
import { z } from 'zod'

export const createClassSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  description: z.string().optional(),
  trainer_id: z.string().uuid().optional().nullable(),
  scheduled_at: z.string().refine(
    (val) => new Date(val) > new Date(),
    { message: 'La clase debe programarse en el futuro' }
  ),
  duration_minutes: z.coerce.number().int().positive().default(60),
  max_capacity: z.coerce.number().int().positive('Capacidad debe ser mayor a 0'),
})

export const updateClassSchema = createClassSchema.partial()

export type CreateClassInput = z.infer<typeof createClassSchema>
export type UpdateClassInput = z.infer<typeof updateClassSchema>
```

### Step 4: Crear `src/lib/classes/utils.ts`

```typescript
type Enrollment = { id: string; status: string; member_id: string }

export function getAvailableSpots(
  enrollments: Enrollment[],
  maxCapacity: number
): number {
  const activeCount = enrollments.filter((e) => e.status === 'active').length
  return Math.max(0, maxCapacity - activeCount)
}

export function canCancel(scheduledAt: string): boolean {
  const classTime = new Date(scheduledAt).getTime()
  const now = Date.now()
  return classTime - now > 24 * 60 * 60 * 1000
}

export function getEnrollmentStatus(
  enrollments: Enrollment[],
  memberId: string,
  maxCapacity: number
): 'booked' | 'available' | 'almost_full' | 'full' {
  const isBooked = enrollments.some(
    (e) => e.member_id === memberId && e.status === 'active'
  )
  if (isBooked) return 'booked'

  const available = getAvailableSpots(enrollments, maxCapacity)
  if (available === 0) return 'full'
  if (available / maxCapacity <= 0.2) return 'almost_full'
  return 'available'
}
```

### Step 5: Verificar GREEN

```bash
pnpm vitest run src/tests/classes.test.ts
```
Esperado: 9/9 pasando.

```bash
pnpm test
```
Esperado: todos los tests pasan (sin regresiones).

### Step 6: Commit

```bash
git add src/lib/validations/class.schema.ts src/lib/classes/utils.ts src/tests/classes.test.ts
git commit -m "test: add TDD for class schema and enrollment utils"
```

---

## Task 2: Server Actions — `src/app/actions/classes.ts`

**Files:**
- Create: `src/app/actions/classes.ts`
- Reference: `src/app/actions/members.ts` (patron de admin client + revalidatePath)
- Reference: `src/lib/supabase/admin.ts` (createAdminClient)
- Reference: `src/lib/supabase/server.ts` (createClient para session)

### Step 1: Crear `src/app/actions/classes.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createClassSchema, updateClassSchema } from '@/lib/validations/class.schema'
import { canCancel } from '@/lib/classes/utils'

export type ActionResult = { success: true } | { success: false; error: string }

// ── Admin Actions ─────────────────────────────────────────────────────────────

export async function createClass(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    trainer_id: formData.get('trainer_id') || null,
    scheduled_at: formData.get('scheduled_at'),
    duration_minutes: formData.get('duration_minutes'),
    max_capacity: formData.get('max_capacity'),
  }

  const parsed = createClassSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = createAdminClient()
  const { error } = await (supabase as any).from('classes').insert({
    name: parsed.data.name,
    description: parsed.data.description,
    trainer_id: parsed.data.trainer_id,
    scheduled_at: parsed.data.scheduled_at,
    duration_minutes: parsed.data.duration_minutes,
    max_capacity: parsed.data.max_capacity,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/classes')
  return { success: true }
}

export async function updateClass(id: string, formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get('name') || undefined,
    description: formData.get('description') || undefined,
    trainer_id: formData.get('trainer_id') || null,
    scheduled_at: formData.get('scheduled_at') || undefined,
    duration_minutes: formData.get('duration_minutes') || undefined,
    max_capacity: formData.get('max_capacity') || undefined,
  }

  const parsed = updateClassSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = createAdminClient()
  const { error } = await (supabase as any)
    .from('classes')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/classes')
  revalidatePath(`/admin/classes/${id}`)
  return { success: true }
}

export async function deleteClass(id: string): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { error } = await (supabase as any).from('classes').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/classes')
  return { success: true }
}

// ── Member Actions ────────────────────────────────────────────────────────────

export async function enrollMember(classId: string): Promise<ActionResult> {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'No autenticado' }

  const memberId = user.id

  // Check for existing cancelled enrollment (re-enrollment flow)
  const { data: existing } = await (supabase as any)
    .from('class_enrollments')
    .select('id, status')
    .eq('class_id', classId)
    .eq('member_id', memberId)
    .maybeSingle()

  if (existing?.status === 'active') {
    return { success: false, error: 'Ya estás inscrito en esta clase' }
  }

  if (existing?.status === 'cancelled') {
    // Re-enroll: update existing row
    const { error } = await (supabase as any)
      .from('class_enrollments')
      .update({ status: 'active', enrolled_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return { success: false, error: error.message }
  } else {
    // Fresh enrollment
    const { error } = await (supabase as any)
      .from('class_enrollments')
      .insert({ class_id: classId, member_id: memberId, status: 'active' })
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/member/classes')
  return { success: true }
}

export async function cancelEnrollment(
  enrollmentId: string,
  scheduledAt: string
): Promise<ActionResult> {
  if (!canCancel(scheduledAt)) {
    return {
      success: false,
      error: 'No se puede cancelar con menos de 24 horas de anticipación',
    }
  }

  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'No autenticado' }

  const { error } = await (supabase as any)
    .from('class_enrollments')
    .update({ status: 'cancelled' })
    .eq('id', enrollmentId)
    .eq('member_id', user.id) // RLS double-check

  if (error) return { success: false, error: error.message }

  revalidatePath('/member/classes')
  return { success: true }
}
```

### Step 2: Verificar build

```bash
pnpm build
```
Esperado: 0 errores TypeScript.

### Step 3: Commit

```bash
git add src/app/actions/classes.ts
git commit -m "feat: add class CRUD and enrollment server actions"
```

---

## Task 3: Admin Classes List Page

**Files:**
- Create: `src/app/(admin)/admin/classes/page.tsx`
- Create: `src/app/(admin)/admin/classes/DaySelector.tsx`
- Reference stitch: `docs/stitch/09-admin-classes-unified.html`
- Reference: `src/app/(admin)/admin/trainers/page.tsx` (patron RSC existente)

### Notas de implementación

**`DaySelector.tsx`** — Client Component:
- Recibe `selectedDate: string` (ISO) como prop
- Renderiza 7 botones con los 7 días de la semana que contiene `selectedDate` (Lun–Dom)
- Para calcular la semana: `const weekStart = startOfWeek(new Date(selectedDate), { weekStartsOn: 1 })` — usar aritmética manual (no instalar date-fns, usar `Date`)
- El activo tiene `border-b-4 border-[#cafd00]` + texto lime; los demás `bg-[#131313]`
- Al clic: `router.push('/admin/classes?date=' + isoDate)`

**`page.tsx`** — RSC:
```typescript
// searchParams.date ?? today en CDMX
// Calcular startOfDay / endOfDay en UTC:
//   CDMX es UTC-6 en invierno, UTC-5 en verano → usar toLocaleString con timeZone para obtener la fecha local, luego construir rango UTC
const tz = 'America/Mexico_City'
const today = new Date().toLocaleDateString('en-CA', { timeZone: tz }) // 'YYYY-MM-DD'
const dateStr = searchParams?.date ?? today
const startUTC = new Date(`${dateStr}T06:00:00.000Z`) // 06:00 UTC = 00:00 CDMX (UTC-6)
const endUTC = new Date(`${dateStr}T30:00:00.000Z`)   // ← INCORRECTO, usar +24h
// Correcto:
const startUTC = new Date(dateStr + 'T00:00:00-06:00') // Let Date parse with offset
// Mejor: calcular el offset real con Intl
```

**Cálculo correcto de rango UTC para un día en CDMX:**
```typescript
function getDayRangeUTC(dateStr: string) {
  // Crear inicio y fin del día en hora CDMX
  const startCDMX = new Date(`${dateStr}T00:00:00`)
  const endCDMX = new Date(`${dateStr}T23:59:59`)
  // Obtener el offset de CDMX en ese momento
  const offsetMs = (d: Date) => {
    const utcStr = d.toLocaleString('en-US', { timeZone: 'America/Mexico_City' })
    const localStr = d.toLocaleString('en-US')
    return new Date(localStr).getTime() - new Date(utcStr).getTime()
  }
  const startUTC = new Date(startCDMX.getTime() + offsetMs(startCDMX))
  const endUTC = new Date(endCDMX.getTime() + offsetMs(endCDMX))
  return { startUTC: startUTC.toISOString(), endUTC: endUTC.toISOString() }
}
```

**Nota importante sobre offset CDMX:** México usa CST (UTC-6) en invierno y CDT (UTC-5) en verano. La forma más robusta es usar `Intl.DateTimeFormat` con `timeZone: 'America/Mexico_City'` para construir el rango, o simplemente usar `new Date(dateStr + 'T00:00:00').toLocaleString('en-CA', {timeZone: 'America/Mexico_City'})` para verificar. El patrón más simple y correcto:

```typescript
function getDayRangeUTC(dateStr: string): { start: string; end: string } {
  // Parse date parts
  const [year, month, day] = dateStr.split('-').map(Number)
  // Create Date at midnight CDMX by using formatter to find offset
  // Approach: create a date, format in CDMX tz, compare to get offset
  const probe = new Date(Date.UTC(year, month - 1, day, 6, 0, 0)) // Try 06:00 UTC
  const cdmxHour = parseInt(
    probe.toLocaleString('en-US', { timeZone: 'America/Mexico_City', hour: 'numeric', hour12: false })
  )
  // cdmxHour should be 0 (midnight CDMX) if offset is -6, or 1 if offset is -5
  const offsetHours = 6 - cdmxHour // 6 if UTC-6 (winter), 5 if UTC-5 (summer)
  const startUTC = new Date(Date.UTC(year, month - 1, day, offsetHours, 0, 0))
  const endUTC = new Date(Date.UTC(year, month - 1, day + 1, offsetHours, 0, 0))
  return { start: startUTC.toISOString(), end: endUTC.toISOString() }
}
```

**Query Supabase:**
```typescript
const { data: classes } = await (supabase as any)
  .from('classes')
  .select('*, trainers(id, full_name), class_enrollments(id, status)')
  .gte('scheduled_at', range.start)
  .lt('scheduled_at', range.end)
  .order('scheduled_at')
```

**Para cada clase, calcular en RSC:**
```typescript
const activeCount = cls.class_enrollments.filter((e: any) => e.status === 'active').length
const isFull = activeCount >= cls.max_capacity
const pct = Math.round((activeCount / cls.max_capacity) * 100)
```

**Quick Stats** (al fondo de la página):
```typescript
// Classes today
const classesToday = classes?.length ?? 0
// New bookings last 24h — query separado
const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
const { count: newBookings } = await (supabase as any)
  .from('class_enrollments')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'active')
  .gte('enrolled_at', since24h)
// Avg attendance this week
const weekStart = ... // Monday of current week
const { data: weekClasses } = await (supabase as any)
  .from('classes')
  .select('max_capacity, class_enrollments(id, status)')
  .gte('scheduled_at', weekStart)
// calcular promedio
```

### Step 1: Crear DaySelector.tsx

```typescript
'use client'
import { useRouter } from 'next/navigation'

const DAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

function getWeekDays(dateStr: string): { iso: string; label: string; dayNum: number }[] {
  const date = new Date(dateStr + 'T12:00:00')
  const dayOfWeek = date.getDay() // 0 = Sun
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(date)
  monday.setDate(date.getDate() + mondayOffset)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = d.toISOString().slice(0, 10)
    return { iso, label: DAY_LABELS[i], dayNum: d.getDate() }
  })
}

interface Props { selectedDate: string }

export default function DaySelector({ selectedDate }: Props) {
  const router = useRouter()
  const days = getWeekDays(selectedDate)
  return (
    <div className="grid grid-cols-7 gap-1 md:gap-4 mb-10">
      {days.map((d) => {
        const isActive = d.iso === selectedDate
        return (
          <button
            key={d.iso}
            onClick={() => router.push(`/admin/classes?date=${d.iso}`)}
            className={`p-4 text-center rounded-lg transition-colors ${
              isActive
                ? 'bg-[#131313] border-b-4 border-[#cafd00]'
                : 'bg-[#131313] hover:bg-[#262626]'
            }`}
          >
            <span className={`block text-xs uppercase tracking-widest mb-1 ${isActive ? 'text-[#cafd00]' : 'text-[#adaaaa]'}`}>
              {d.label}
            </span>
            <span className={`text-2xl font-black font-['Space_Grotesk'] ${isActive ? 'text-[#cafd00]' : 'text-white'}`}>
              {d.dayNum}
            </span>
          </button>
        )
      })}
    </div>
  )
}
```

### Step 2: Crear page.tsx con diseño calco del stitch

La página debe ser un calco fiel de `09-admin-classes-unified.html`:
- Header `"Agenda."` con punto lime, descripción, botón "Create Class"
- `DaySelector` con la semana actual
- Lista de clases del día (vacía si no hay clases)
- Estados de clase: normal, featured (lime), FULL (borde rojo + watermark)
- Barra de capacidad con gradiente lime
- Botones edit + delete
- Quick stats section al fondo

### Step 3: Verificar build

```bash
pnpm build
```

### Step 4: Commit

```bash
git add src/app/(admin)/admin/classes/
git commit -m "feat: build admin classes agenda page with day selector"
```

---

## Task 4: Admin ClassForm + New/Edit Pages

**Files:**
- Create: `src/components/admin/ClassForm.tsx`
- Create: `src/app/(admin)/admin/classes/new/page.tsx`
- Create: `src/app/(admin)/admin/classes/[id]/page.tsx`
- Create: `src/app/(admin)/admin/classes/[id]/DeleteClassButton.tsx`

### `ClassForm.tsx` — Client Component

Props:
```typescript
interface ClassFormProps {
  mode: 'new' | 'edit'
  class?: {
    id: string
    name: string
    description: string | null
    trainer_id: string | null
    scheduled_at: string  // ISO
    duration_minutes: number
    max_capacity: number
  }
  trainers: Array<{ id: string; full_name: string; specialty: string }>
}
```

Campos del form:
- **Nombre**: text input, required
- **Descripción**: textarea, optional
- **Entrenador**: `<select>` con opción vacía + lista de trainers activos
- **Fecha y hora**: `<input type="datetime-local">` — al cargar en modo edit, convertir `scheduled_at` UTC a local con `new Date(scheduled_at).toISOString().slice(0,16)` (los datetime-local usan hora local del browser)
- **Duración (min)**: number input, default 60
- **Capacidad máxima**: number input, required

Comportamiento:
- `useTransition` para pending
- Construye `FormData` manualmente
- En new: llama `createClass(formData)` → `router.push('/admin/classes')`
- En edit: llama `updateClass(id, formData)` → `router.push('/admin/classes/${id}')`
- Muestra error inline si `result.success === false`

### `new/page.tsx` — RSC

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import ClassForm from '@/components/admin/ClassForm'

export default async function NewClassPage() {
  const supabase = createAdminClient()
  const { data: trainers } = await (supabase as any)
    .from('trainers')
    .select('id, full_name, specialty')
    .eq('is_active', true)
    .order('full_name')

  return (
    <main className="lg:ml-64 pt-8 pb-20 lg:pb-8 px-8 min-h-screen bg-[#0e0e0e]">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-['Space_Grotesk'] text-4xl font-black text-white tracking-tighter uppercase">
            NUEVA <span className="text-[#cafd00]">CLASE</span>
          </h1>
        </div>
        <ClassForm mode="new" trainers={trainers ?? []} />
      </div>
    </main>
  )
}
```

### `[id]/page.tsx` — RSC

Fetcha clase + enrollments activos (roster) + trainers:
```typescript
const { data: cls } = await (supabase as any)
  .from('classes')
  .select('*, trainers(id, full_name), class_enrollments(id, status, member_id, profiles(full_name, email))')
  .eq('id', params.id)
  .maybeSingle()
if (!cls) notFound()
```

Muestra:
1. `ClassForm` en modo edit, pre-llenado
2. Sección "Inscritos" con lista de perfiles activos (nombre + email)
3. `DeleteClassButton` al fondo

### `DeleteClassButton.tsx` — Client Component

```typescript
'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteClass } from '@/app/actions/classes'

export default function DeleteClassButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('¿Eliminar esta clase? Se cancelarán todas las inscripciones.')) return
    startTransition(async () => {
      await deleteClass(id)
      router.push('/admin/classes')
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="mt-8 w-full py-3 bg-[#ff7351]/10 border border-[#ff7351]/30 text-[#ff7351] font-['Space_Grotesk'] font-bold uppercase tracking-tighter hover:bg-[#ff7351]/20 transition-colors disabled:opacity-60"
    >
      {isPending ? 'Eliminando...' : 'Eliminar Clase'}
    </button>
  )
}
```

### Step N: Build + Commit

```bash
pnpm build
git add src/components/admin/ClassForm.tsx src/app/(admin)/admin/classes/new/ src/app/(admin)/admin/classes/[id]/
git commit -m "feat: add admin class form and new/edit pages"
```

---

## Task 5: Member Classes Page

**Files:**
- Modify: `src/app/(member)/member/classes/page.tsx` (reemplaza placeholder)
- Create: `src/app/(member)/member/classes/MemberDaySelector.tsx`
- Create: `src/app/(member)/member/classes/EnrollButton.tsx`
- Reference stitch: `docs/stitch/14-member-class-schedule-booking.html`

### `MemberDaySelector.tsx` — Client Component

Props: `selectedDate: string`

Comportamiento:
- Muestra 7 días desde hoy (o desde la semana que contiene `selectedDate`)
- Chips: `w-14 h-20 rounded-lg`, día abreviado en español + número
- Activo: `border border-[#CCFF00] bg-[#212121]` + punto indicador lime debajo del número
- Inactivo: `border border-[#212121] bg-[#1a1a1a]`
- `router.push('/member/classes?date=' + iso)`
- Scroll horizontal con `overflow-x-auto no-scrollbar` (agregar `.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } .no-scrollbar::-webkit-scrollbar { display: none; }` en globals.css si no existe)

```typescript
const DAY_LABELS_ES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
// Mostrar mes en español
const MONTHS_ES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
```

### `EnrollButton.tsx` — Client Component

Props:
```typescript
interface EnrollButtonProps {
  classId: string
  enrollmentId: string | null  // null si no inscrito
  scheduledAt: string           // ISO, para validar 24h
  status: 'booked' | 'available' | 'almost_full' | 'full'
}
```

Comportamiento por estado:
- `booked`: muestra aviso 24h (icon `info`) + botón rojo "Cancel Booking" → llama `cancelEnrollment(enrollmentId!, scheduledAt)`
- `available` / `almost_full`: botón lime "Book Spot" → llama `enrollMember(classId)`
- `full`: botón disabled "Waiting List" (gris, cursor-not-allowed)

### `page.tsx` — RSC member classes

```typescript
// 1. Obtener usuario autenticado
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
// if (!user) → middleware ya redirigió, pero hacer notFound() como fallback

// 2. Leer clases del día (admin client para ver todos los enrollments)
const adminSupabase = createAdminClient()
const tz = 'America/Mexico_City'
const today = new Date().toLocaleDateString('en-CA', { timeZone: tz })
const dateStr = searchParams?.date ?? today
const { start, end } = getDayRangeUTC(dateStr)  // helper del task 3

const { data: classes } = await (adminSupabase as any)
  .from('classes')
  .select('*, trainers(full_name, avatar_url), class_enrollments(id, member_id, status)')
  .gte('scheduled_at', start)
  .lt('scheduled_at', end)
  .order('scheduled_at')

// 3. Para cada clase, calcular estado del miembro
// enrollmentStatus = getEnrollmentStatus(cls.class_enrollments, user.id, cls.max_capacity)
// memberEnrollment = cls.class_enrollments.find(e => e.member_id === user.id && e.status === 'active')
```

**Diseño de cada card (calco del stitch):**

```typescript
// Booked card: border-l-4 border-[#CCFF00]
// Available card: sin borde, hover:border-[#CCFF00]/50 
// Almost Full card: badge "Almost Full" en esquina superior derecha
// Full card: opacity-60

// Header de card:
// - tiempo: "HH:MM - HH:MM" (scheduled_at → scheduled_at + duration_minutes)
// - nombre de clase (uppercase)
// - capacity badge: icon groups + "X/Y"

// Coach row:
// - img avatar (w-6 h-6 rounded-full) con fallback
// - nombre del entrenador

// Action section:
// - EnrollButton según estado
```

**Formatear tiempo de clase:**
```typescript
function formatClassTime(scheduledAt: string, durationMinutes: number): string {
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + durationMinutes * 60000)
  const fmt = (d: Date) => d.toLocaleTimeString('es-MX', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${fmt(start)} - ${fmt(end)}`
}
```

### Step N: Build + Commit

```bash
pnpm build
git add src/app/(member)/member/classes/
git commit -m "feat: build member class schedule with inline book/cancel"
```

---

## Task 6: Build Final Check

### Step 1: Run all tests

```bash
pnpm test
```
Esperado: todos pasando.

### Step 2: Build completo

```bash
pnpm build
```
Esperado: 0 errores.

### Step 3: Verificación manual

**Admin:**
1. Ir a `/admin/classes` — ver agenda con DaySelector
2. Clic en otro día → URL cambia, lista se actualiza
3. Clic "Create Class" → `/admin/classes/new` — llenar form y guardar
4. Clic edit en una clase → form pre-llenado, editar y guardar
5. Clic delete → confirmación → clase desaparece

**Miembro:**
1. Ir a `/member/classes` — ver clases del día
2. Clic "Book Spot" → clase pasa a "Booked" con botón "Cancel Booking"
3. Clic "Cancel Booking" (clase >24h) → clase vuelve a "Available"
4. Cambiar de día con MemberDaySelector → clases del día seleccionado

### Step 4: No hay commit final — el usuario lo indicará
