# Fase 4 — Módulo de Entrenadores: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** CRUD completo de entrenadores con disponibilidad semanal visual (grid toggle 7×17) y páginas admin pixel-perfect al stitch `10-admin-trainers-unified.html`.

**Architecture:** RSC para lecturas + Server Actions para mutaciones, siguiendo el patrón de Phase 2. `WeeklyScheduleGrid` es un Client Component que emite `Set<"day-hour">`. La función `compressSlots` convierte ese Set en filas para `trainer_availability` (celdas consecutivas se fusionan en un rango). Avatar = placeholder sin upload.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS 4, Supabase (session client + admin client), Zod, Vitest.

---

## Task 1: TDD — Zod schemas + availability utils

**Files:**
- Create: `src/lib/validations/trainer.schema.ts`
- Create: `src/lib/trainers/availability.ts`
- Create: `src/tests/trainers.test.ts`

**Step 1: Write the failing tests**

Create `src/tests/trainers.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { createTrainerSchema, availabilitySlotSchema } from '@/lib/validations/trainer.schema'
import { compressSlots, expandSlots, compressForDisplay } from '@/lib/trainers/availability'

describe('createTrainerSchema', () => {
  it('valida full_name requerido (min 2)', () => {
    expect(createTrainerSchema.safeParse({ full_name: 'A', specialty: 'HIIT' }).success).toBe(false)
    expect(createTrainerSchema.safeParse({ full_name: '', specialty: 'HIIT' }).success).toBe(false)
  })

  it('valida specialty requerido', () => {
    expect(createTrainerSchema.safeParse({ full_name: 'Ana López', specialty: '' }).success).toBe(false)
  })

  it('acepta entrada válida', () => {
    expect(createTrainerSchema.safeParse({ full_name: 'Ana López', specialty: 'HIIT' }).success).toBe(true)
  })
})

describe('availabilitySlotSchema', () => {
  it('rechaza end_time <= start_time', () => {
    const result = availabilitySlotSchema.safeParse({
      trainer_id: '00000000-0000-0000-0000-000000000001',
      day_of_week: 1,
      start_time: '12:00',
      end_time: '10:00',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza day_of_week fuera de 0-6', () => {
    const result = availabilitySlotSchema.safeParse({
      trainer_id: '00000000-0000-0000-0000-000000000001',
      day_of_week: 7,
      start_time: '06:00',
      end_time: '12:00',
    })
    expect(result.success).toBe(false)
  })

  it('acepta slot válido', () => {
    const result = availabilitySlotSchema.safeParse({
      trainer_id: '00000000-0000-0000-0000-000000000001',
      day_of_week: 1,
      start_time: '06:00',
      end_time: '12:00',
    })
    expect(result.success).toBe(true)
  })
})

describe('compressSlots', () => {
  it('celdas consecutivas mismo día → un rango', () => {
    const selected = new Set(['1-6', '1-7', '1-8'])
    const result = compressSlots(selected)
    expect(result).toEqual([
      { day_of_week: 1, start_time: '06:00', end_time: '09:00' },
    ])
  })

  it('celdas no consecutivas → rangos separados', () => {
    const selected = new Set(['1-6', '1-7', '1-10', '1-11'])
    const result = compressSlots(selected)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ day_of_week: 1, start_time: '06:00', end_time: '08:00' })
    expect(result[1]).toEqual({ day_of_week: 1, start_time: '10:00', end_time: '12:00' })
  })

  it('días distintos → rangos independientes', () => {
    const selected = new Set(['1-6', '1-7', '3-14', '3-15'])
    const result = compressSlots(selected)
    expect(result).toHaveLength(2)
    expect(result.find(r => r.day_of_week === 1)).toEqual({ day_of_week: 1, start_time: '06:00', end_time: '08:00' })
    expect(result.find(r => r.day_of_week === 3)).toEqual({ day_of_week: 3, start_time: '14:00', end_time: '16:00' })
  })

  it('Set vacío → array vacío', () => {
    expect(compressSlots(new Set())).toEqual([])
  })
})

describe('expandSlots', () => {
  it('rows DB → Set<"day-hour"> correcto', () => {
    const rows = [
      { day_of_week: 1, start_time: '06:00', end_time: '08:00' },
    ]
    const result = expandSlots(rows)
    expect(result.has('1-6')).toBe(true)
    expect(result.has('1-7')).toBe(true)
    expect(result.has('1-8')).toBe(false) // end_time es exclusivo
  })
})

describe('compressForDisplay', () => {
  it('rows DB → chips {day, range}', () => {
    const rows = [
      { day_of_week: 1, start_time: '06:00', end_time: '12:00' },
      { day_of_week: 6, start_time: '08:00', end_time: '14:00' },
    ]
    const chips = compressForDisplay(rows)
    expect(chips).toContainEqual({ day: 'LUN', range: '06-12' })
    expect(chips).toContainEqual({ day: 'SÁB', range: '08-14' })
  })
})
```

**Step 2: Run to verify RED**
```bash
pnpm vitest run src/tests/trainers.test.ts
```
Expected: FAIL — modules not found.

**Step 3: Create `src/lib/validations/trainer.schema.ts`**

```typescript
import { z } from 'zod'

export const createTrainerSchema = z.object({
  full_name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  specialty: z.string().min(1, 'Especialidad requerida'),
  bio: z.string().optional(),
  is_active: z.boolean().default(true),
})

export const updateTrainerSchema = createTrainerSchema.partial()

export const availabilitySlotSchema = z
  .object({
    trainer_id: z.string().uuid(),
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}$/),
    end_time: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .refine((s) => s.end_time > s.start_time, {
    message: 'end_time debe ser mayor que start_time',
  })

export type CreateTrainerInput = z.infer<typeof createTrainerSchema>
export type UpdateTrainerInput = z.infer<typeof updateTrainerSchema>
export type AvailabilitySlot = z.infer<typeof availabilitySlotSchema>
```

**Step 4: Create `src/lib/trainers/availability.ts`**

```typescript
const DAY_LABELS: Record<number, string> = {
  0: 'DOM', 1: 'LUN', 2: 'MAR', 3: 'MIÉ', 4: 'JUE', 5: 'VIE', 6: 'SÁB',
}

type SlotRow = { day_of_week: number; start_time: string; end_time: string }
type DisplayChip = { day: string; range: string }

/** Convierte Set<"day-hour"> → rows con rangos fusionados (end_time es exclusivo) */
export function compressSlots(selected: Set<string>): SlotRow[] {
  // Group hours by day
  const byDay = new Map<number, number[]>()
  for (const key of selected) {
    const [d, h] = key.split('-').map(Number)
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push(h)
  }

  const result: SlotRow[] = []
  for (const [day, hours] of byDay) {
    const sorted = [...hours].sort((a, b) => a - b)
    let start = sorted[0]
    let prev = sorted[0]

    for (let i = 1; i <= sorted.length; i++) {
      const curr = sorted[i]
      if (curr === prev + 1) {
        prev = curr
      } else {
        result.push({
          day_of_week: day,
          start_time: `${String(start).padStart(2, '0')}:00`,
          end_time: `${String(prev + 1).padStart(2, '0')}:00`,
        })
        start = curr
        prev = curr
      }
    }
  }

  return result
}

/** Expande rows DB → Set<"day-hour"> para pre-llenar el grid */
export function expandSlots(rows: SlotRow[]): Set<string> {
  const result = new Set<string>()
  for (const row of rows) {
    const startH = parseInt(row.start_time.slice(0, 2))
    const endH = parseInt(row.end_time.slice(0, 2))
    for (let h = startH; h < endH; h++) {
      result.add(`${row.day_of_week}-${h}`)
    }
  }
  return result
}

/** Convierte rows DB → chips de display {day, range} */
export function compressForDisplay(rows: SlotRow[]): DisplayChip[] {
  return rows.map((row) => ({
    day: DAY_LABELS[row.day_of_week] ?? `D${row.day_of_week}`,
    range: `${row.start_time.slice(0, 2)}-${row.end_time.slice(0, 2)}`,
  }))
}
```

**Step 5: Run to verify GREEN**
```bash
pnpm vitest run src/tests/trainers.test.ts
```
Expected: All tests pass.

**Step 6: Full suite**
```bash
pnpm test
```
Expected: All tests pass.

**Step 7: Commit**
```bash
git add src/lib/validations/trainer.schema.ts src/lib/trainers/availability.ts src/tests/trainers.test.ts
git commit -m "test: add TDD for trainer schema and availability utils"
```

---

## Task 2: Server Actions

**Files:**
- Create: `src/app/actions/trainers.ts`

**Context:** Seguir el patrón de `src/app/actions/members.ts`. Admin client (`createAdminClient`) para operaciones que requieren bypass de RLS. Session client (`createClient`) para lecturas autenticadas.

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  createTrainerSchema,
  updateTrainerSchema,
  availabilitySlotSchema,
} from '@/lib/validations/trainer.schema'
import { compressSlots } from '@/lib/trainers/availability'

export async function createTrainer(formData: FormData) {
  const raw = {
    full_name: formData.get('full_name'),
    specialty: formData.get('specialty'),
    bio: formData.get('bio') || undefined,
    is_active: formData.get('is_active') !== 'false',
  }

  const parsed = createTrainerSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const admin = createAdminClient()
  const { data: trainer, error } = await admin
    .from('trainers')
    .insert(parsed.data)
    .select('id')
    .single()

  if (error || !trainer) {
    return { error: error?.message ?? 'Error al crear entrenador' }
  }

  // Save availability if provided
  const slotsJson = formData.get('availability_slots')
  if (slotsJson) {
    const selected: Set<string> = new Set(JSON.parse(slotsJson as string))
    const slots = compressSlots(selected).map((s) => ({
      ...s,
      trainer_id: trainer.id,
    }))
    if (slots.length > 0) {
      await admin.from('trainer_availability').insert(slots)
    }
  }

  revalidatePath('/admin/trainers')
  return { success: true, id: trainer.id }
}

export async function updateTrainer(id: string, formData: FormData) {
  const raw = {
    full_name: formData.get('full_name') || undefined,
    specialty: formData.get('specialty') || undefined,
    bio: formData.get('bio') || undefined,
    is_active: formData.get('is_active') !== 'false',
  }

  const cleanRaw = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined)
  )

  const parsed = updateTrainerSchema.safeParse(cleanRaw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('trainers')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/trainers')
  revalidatePath(`/admin/trainers/${id}`)
  return { success: true }
}

export async function setAvailability(
  trainerId: string,
  selectedKeys: string[]  // Array de "day-hour" keys
) {
  const slots = compressSlots(new Set(selectedKeys)).map((s) => ({
    ...s,
    trainer_id: trainerId,
  }))

  const admin = createAdminClient()
  // DELETE all + INSERT new (replace strategy)
  const { error: deleteError } = await admin
    .from('trainer_availability')
    .delete()
    .eq('trainer_id', trainerId)

  if (deleteError) return { error: deleteError.message }

  if (slots.length > 0) {
    const { error: insertError } = await admin
      .from('trainer_availability')
      .insert(slots)
    if (insertError) return { error: insertError.message }
  }

  revalidatePath('/admin/trainers')
  revalidatePath(`/admin/trainers/${trainerId}`)
  return { success: true }
}

export async function deactivateTrainer(id: string) {
  const admin = createAdminClient()
  const { error } = await admin
    .from('trainers')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/trainers')
  revalidatePath(`/admin/trainers/${id}`)
  return { success: true }
}
```

**Step 1: Create the file with content above**

**Step 2: Run build to verify TypeScript**
```bash
pnpm build
```
Expected: Clean build.

**Step 3: Commit**
```bash
git add src/app/actions/trainers.ts
git commit -m "feat: trainer Server Actions (create, update, setAvailability, deactivate)"
```

---

## Task 3: WeeklyScheduleGrid Client Component

**Files:**
- Create: `src/components/admin/WeeklyScheduleGrid.tsx`

**Context:** Client Component puro (no fetch de datos). Recibe `value: Set<string>` y `onChange: (next: Set<string>) => void`. Cada celda es `"${day}-${hour}"`. Las horas van de 6 a 22 (17 filas). Días: 0=DOM…6=SÁB.

```typescript
'use client'

const DAYS = [
  { label: 'DOM', value: 0 },
  { label: 'LUN', value: 1 },
  { label: 'MAR', value: 2 },
  { label: 'MIÉ', value: 3 },
  { label: 'JUE', value: 4 },
  { label: 'VIE', value: 5 },
  { label: 'SÁB', value: 6 },
]

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6–22

type Props = {
  value: Set<string>
  onChange: (next: Set<string>) => void
}

export function WeeklyScheduleGrid({ value, onChange }: Props) {
  function toggle(day: number, hour: number) {
    const key = `${day}-${hour}`
    const next = new Set(value)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    onChange(next)
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[400px]">
        {/* Header row */}
        <div className="grid grid-cols-[3rem_repeat(7,1fr)] gap-1 mb-1">
          <div /> {/* empty hour label column */}
          {DAYS.map((d) => (
            <div
              key={d.value}
              className="text-center text-[10px] font-black uppercase tracking-widest text-on-surface-variant py-1"
            >
              {d.label}
            </div>
          ))}
        </div>

        {/* Time rows */}
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[3rem_repeat(7,1fr)] gap-1 mb-1">
            {/* Hour label */}
            <div className="text-[10px] font-mono text-on-surface-variant flex items-center justify-end pr-2">
              {String(hour).padStart(2, '0')}
            </div>

            {/* Day cells */}
            {DAYS.map((d) => {
              const key = `${d.value}-${hour}`
              const active = value.has(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(d.value, hour)}
                  className={`h-8 w-full rounded-sm transition-colors active:scale-95 ${
                    active
                      ? 'bg-[#cafd00] text-[#121212]'
                      : 'bg-surface-container-highest hover:bg-surface-container-high'
                  }`}
                  aria-pressed={active}
                  aria-label={`${d.label} ${String(hour).padStart(2, '0')}:00`}
                />
              )
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-[10px] font-bold uppercase text-on-surface-variant">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#cafd00]" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-surface-container-highest" />
            <span>No disponible</span>
          </div>
        </div>
      </div>
    </div>
  )
}
```

**Step 1: Create the file**

**Step 2: Run build**
```bash
pnpm build
```
Expected: Clean build.

**Step 3: Commit**
```bash
git add src/components/admin/WeeklyScheduleGrid.tsx
git commit -m "feat: WeeklyScheduleGrid toggle client component"
```

---

## Task 4: TrainerForm Client Component

**Files:**
- Create: `src/components/admin/TrainerForm.tsx`

**Context:** Reutilizado en `/admin/trainers/new` y `/admin/trainers/[id]`. Recibe `initialData` opcional para modo edición. Llama `createTrainer` o `updateTrainer` según `mode`. El grid se gestiona con `useState<Set<string>>`. Al submit, serializa el Set como JSON en un hidden input.

```typescript
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { WeeklyScheduleGrid } from './WeeklyScheduleGrid'
import { createTrainer, updateTrainer, setAvailability } from '@/app/actions/trainers'
import { expandSlots } from '@/lib/trainers/availability'

type SlotRow = { day_of_week: number; start_time: string; end_time: string }

type Props = {
  mode: 'create' | 'edit'
  trainerId?: string
  initialData?: {
    full_name: string
    specialty: string
    bio: string
    is_active: boolean
    availability: SlotRow[]
  }
}

export function TrainerForm({ mode, trainerId, initialData }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    initialData ? expandSlots(initialData.availability) : new Set()
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    // Serialize slots as JSON
    formData.set('availability_slots', JSON.stringify([...selectedSlots]))

    startTransition(async () => {
      let result: { error?: unknown; success?: boolean; id?: string }

      if (mode === 'create') {
        result = await createTrainer(formData)
      } else {
        result = await updateTrainer(trainerId!, formData)
        if (!result.error && selectedSlots) {
          await setAvailability(trainerId!, [...selectedSlots])
        }
      }

      if (result.error) {
        setError(typeof result.error === 'string' ? result.error : 'Error de validación')
        return
      }

      router.push('/admin/trainers')
    })
  }

  const inputClass =
    'w-full bg-surface-container-highest border border-[#212121] rounded-xl py-4 px-4 text-white font-headline font-medium focus:border-[#cafd00] transition-colors focus:outline-none'
  const labelClass =
    'block font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 px-4 py-3 rounded-lg">{error}</p>
      )}

      {/* Basic info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="full_name" className={labelClass}>Full Name</label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            defaultValue={initialData?.full_name}
            placeholder="Nombre completo"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="specialty" className={labelClass}>Specialty</label>
          <input
            id="specialty"
            name="specialty"
            type="text"
            defaultValue={initialData?.specialty}
            placeholder="ej. Powerlifting, HIIT, Yoga"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="bio" className={labelClass}>Bio</label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={initialData?.bio}
          placeholder="Descripción del entrenador..."
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Is active toggle */}
      <div className="flex items-center justify-between bg-surface-container-high rounded-xl px-4 py-4">
        <div>
          <p className="font-headline font-bold text-sm text-on-surface">Estado</p>
          <p className="text-xs text-on-surface-variant">Entrenador activo y visible</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={initialData?.is_active ?? true}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#cafd00]" />
        </label>
      </div>

      {/* Weekly Schedule Grid */}
      <div>
        <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
          <span className="w-8 h-[1px] bg-[#cafd00]" />
          Weekly Availability
        </h3>
        <WeeklyScheduleGrid value={selectedSlots} onChange={setSelectedSlots} />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#cafd00] text-[#121212] font-headline font-black py-5 rounded-xl uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(204,255,0,0.2)] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending
          ? 'Guardando...'
          : mode === 'create'
          ? 'Create Trainer'
          : 'Save Changes'}
      </button>
    </form>
  )
}
```

**Step 1: Create the file**

**Step 2: Run build**
```bash
pnpm build
```
Expected: Clean build.

**Step 3: Commit**
```bash
git add src/components/admin/TrainerForm.tsx
git commit -m "feat: TrainerForm client component with WeeklyScheduleGrid"
```

---

## Task 5: /admin/trainers — Lista RSC (calco del stitch)

**Files:**
- Create: `src/app/(admin)/admin/trainers/page.tsx`

**Context:** El stitch (`10-admin-trainers-unified.html` líneas 155-357) muestra:
- Header "ELITE COACHES" con counters
- Bento grid: trainer cards (foto grayscale→color, specialty badge, nombre, bio, availability chips, Edit Profile link)
- CTA card `bg-[#cafd00]` → `/admin/trainers/new`
- Activity log card `md:col-span-2` (estático)

```typescript
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { compressForDisplay } from '@/lib/trainers/availability'

export default async function TrainersPage() {
  const admin = createAdminClient()

  const { data: trainers } = await admin
    .from('trainers')
    .select(`
      id, full_name, specialty, bio, avatar_url, is_active,
      trainer_availability ( day_of_week, start_time, end_time )
    `)
    .order('created_at', { ascending: false })

  const activeCount = trainers?.filter(t => t.is_active).length ?? 0
  const slotsCount = trainers?.reduce((acc, t) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return acc + ((t.trainer_availability as any[])?.length ?? 0)
  }, 0) ?? 0

  return (
    <div className="px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h1 className="font-headline text-5xl md:text-7xl font-black text-white leading-none tracking-tighter uppercase mb-4">
            ELITE <span className="text-[#cafd00] italic">COACHES</span>
          </h1>
          <p className="text-white/60 font-body max-w-lg text-lg">
            Managing the technical force behind Gym Power CDMX. High-performance oversight and roster optimization.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-surface-container-low px-6 py-4 rounded-lg border-l-4 border-[#cafd00]">
            <span className="block text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Active Trainers</span>
            <span className="text-3xl font-headline font-black text-white leading-none">{activeCount}</span>
          </div>
          <div className="bg-surface-container-low px-6 py-4 rounded-lg border-l-4 border-outline-variant">
            <span className="block text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">Slots Open</span>
            <span className="text-3xl font-headline font-black text-white leading-none">{slotsCount}</span>
          </div>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Trainer cards */}
        {trainers?.map((trainer) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const chips = compressForDisplay((trainer.trainer_availability as any[]) ?? [])
          return (
            <div key={trainer.id} className="bg-surface-container-low overflow-hidden group">
              {/* Photo */}
              <div className="relative h-64 overflow-hidden">
                {trainer.avatar_url ? (
                  <img
                    src={trainer.avatar_url}
                    alt={trainer.full_name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-gray-600">person</span>
                  </div>
                )}
                {/* Specialty badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-[#cafd00] text-[#121212] px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm">
                    {trainer.specialty}
                  </span>
                </div>
                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-surface-container-low to-transparent">
                  <h2 className="text-3xl font-headline font-black text-white tracking-tighter uppercase leading-none">
                    {trainer.full_name.toUpperCase()}
                  </h2>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-white/60 text-sm leading-relaxed mb-6 font-body line-clamp-3">
                  {trainer.bio ?? 'Sin descripción.'}
                </p>

                {/* Weekly availability chips */}
                {chips.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-[#cafd00] uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-8 h-[1px] bg-[#cafd00]" /> WEEKLY AVAILABILITY
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {chips.slice(0, 4).map((chip, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-sm text-center ${
                            i === chips.slice(0, 4).length - 1 && chips.length > 3
                              ? 'bg-[#cafd00]/10 border border-[#cafd00]/20'
                              : 'bg-surface-container-highest'
                          }`}
                        >
                          <span className={`block text-[10px] font-bold uppercase mb-1 ${
                            i === chips.slice(0, 4).length - 1 && chips.length > 3
                              ? 'text-[#cafd00]/60'
                              : 'text-white/40'
                          }`}>{chip.day}</span>
                          <span className={`text-[11px] font-mono font-bold ${
                            i === chips.slice(0, 4).length - 1 && chips.length > 3
                              ? 'text-[#cafd00]'
                              : 'text-white'
                          }`}>{chip.range}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex justify-between items-center">
                <button className="text-white/40 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
                <Link
                  href={`/admin/trainers/${trainer.id}`}
                  className="text-[12px] font-headline font-bold uppercase text-[#cafd00] border-b border-[#cafd00]/30 hover:border-[#cafd00] transition-all pb-1"
                >
                  Edit Profile
                </Link>
              </div>
            </div>
          )
        })}

        {/* CTA card */}
        <div className="bg-[#cafd00] p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-[10px] font-black text-[#121212]/60 uppercase tracking-widest mb-4 block">MANAGEMENT ACTIONS</span>
            <h2 className="text-4xl font-headline font-black text-[#121212] tracking-tighter uppercase mb-6 leading-[0.9]">
              RECRUIT NEW ELITE TALENT
            </h2>
            <Link
              href="/admin/trainers/new"
              className="bg-[#121212] text-[#cafd00] px-6 py-3 font-headline font-black uppercase tracking-tighter flex items-center gap-2 w-fit group-hover:scale-105 transition-transform"
            >
              <span className="material-symbols-outlined">add_circle</span>
              OPEN DIRECTORY
            </Link>
          </div>
          <span className="absolute -right-12 -bottom-12 text-[180px] font-black text-[#121212]/10 font-headline pointer-events-none group-hover:text-[#121212]/20 transition-colors">
            GP
          </span>
        </div>

        {/* Activity log card */}
        <div className="bg-surface-container-low p-6 md:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[10px] font-black text-[#cafd00] uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-8 h-[1px] bg-[#cafd00]" /> RECENT ACTIVITY
            </h3>
            <span className="text-[10px] text-white/40 font-bold uppercase">LIVE FEED</span>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm text-[#cafd00]">fitness_center</span>
                </div>
                <div>
                  <p className="text-sm text-white font-medium">Módulo de entrenadores activado</p>
                  <p className="text-[10px] text-white/40 uppercase font-bold">Fase 4</p>
                </div>
              </div>
            </div>
          </div>
          <button className="mt-auto w-full py-4 text-center text-white/40 font-headline font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors">
            View All Logs
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Step 1: Create the file**

**Step 2: Run build**
```bash
pnpm build
```
Expected: Clean build, `/admin/trainers` aparece en rutas.

**Step 3: Commit**
```bash
git add src/app/(admin)/admin/trainers/page.tsx
git commit -m "feat: admin trainers list page with bento grid (stitch calco)"
```

---

## Task 6: /admin/trainers/new — Formulario de creación

**Files:**
- Create: `src/app/(admin)/admin/trainers/new/page.tsx`

```typescript
import { TrainerForm } from '@/components/admin/TrainerForm'

export default function NewTrainerPage() {
  return (
    <div className="px-8 max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="font-headline text-4xl font-black text-white tracking-tighter uppercase mb-2">
          New <span className="text-[#cafd00] italic">Trainer</span>
        </h1>
        <p className="text-on-surface-variant text-sm">
          Complete the profile and set weekly availability.
        </p>
      </div>
      <TrainerForm mode="create" />
    </div>
  )
}
```

**Step 1: Create the file**

**Step 2: Run build**
```bash
pnpm build
```

**Step 3: Commit**
```bash
git add src/app/(admin)/admin/trainers/new/page.tsx
git commit -m "feat: admin trainers/new page"
```

---

## Task 7: /admin/trainers/[id] — Perfil + Edición

**Files:**
- Create: `src/app/(admin)/admin/trainers/[id]/page.tsx`

```typescript
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { TrainerForm } from '@/components/admin/TrainerForm'
import { DeactivateTrainerButton } from './DeactivateTrainerButton'

export default async function TrainerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: trainer } = await admin
    .from('trainers')
    .select(`
      id, full_name, specialty, bio, avatar_url, is_active,
      trainer_availability ( day_of_week, start_time, end_time ),
      classes ( id, name, scheduled_at, max_capacity )
    `)
    .eq('id', id)
    .maybeSingle()

  if (!trainer) notFound()

  const upcomingClasses = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (trainer.classes as any[]) ?? []
  )
    .filter((c) => new Date(c.scheduled_at) > new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5)

  return (
    <div className="px-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          {!trainer.is_active && (
            <span className="bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm">
              Inactivo
            </span>
          )}
        </div>
        <h1 className="font-headline text-4xl font-black text-white tracking-tighter uppercase mb-2">
          Edit <span className="text-[#cafd00] italic">Profile</span>
        </h1>
        <p className="text-on-surface-variant text-sm">{trainer.full_name}</p>
      </div>

      <TrainerForm
        mode="edit"
        trainerId={trainer.id}
        initialData={{
          full_name: trainer.full_name,
          specialty: trainer.specialty,
          bio: trainer.bio ?? '',
          is_active: trainer.is_active,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          availability: (trainer.trainer_availability as any[]) ?? [],
        }}
      />

      {/* Upcoming Classes */}
      {upcomingClasses.length > 0 && (
        <div className="mt-12">
          <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
            <span className="w-8 h-[1px] bg-[#cafd00]" /> Clases Asignadas
          </h3>
          <div className="space-y-2">
            {upcomingClasses.map((cls) => (
              <div
                key={cls.id}
                className="bg-surface-container-high rounded-xl px-4 py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-headline font-bold text-sm text-on-surface">{cls.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    {new Date(cls.scheduled_at).toLocaleDateString('es-MX', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                      timeZone: 'America/Mexico_City',
                    })}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant">
                  {cls.max_capacity} spots
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      {trainer.is_active && (
        <div className="mt-12 mb-8 pt-8 border-t border-[#212121]">
          <DeactivateTrainerButton trainerId={trainer.id} />
        </div>
      )}
    </div>
  )
}
```

**Also create `src/app/(admin)/admin/trainers/[id]/DeactivateTrainerButton.tsx`:**

```typescript
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deactivateTrainer } from '@/app/actions/trainers'

export function DeactivateTrainerButton({ trainerId }: { trainerId: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!confirm('¿Desactivar este entrenador?')) return
    startTransition(async () => {
      await deactivateTrainer(trainerId)
      router.push('/admin/trainers')
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="w-full flex items-center justify-between px-4 py-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-red-400">person_off</span>
        <span className="font-headline text-sm font-bold text-red-400 uppercase tracking-tighter">
          {isPending ? 'Desactivando...' : 'Deactivate Trainer'}
        </span>
      </div>
      <span className="material-symbols-outlined text-red-400/40">chevron_right</span>
    </button>
  )
}
```

**Step 1: Create both files**

**Step 2: Run build**
```bash
pnpm build
```
Expected: Clean build.

**Step 3: Run all tests**
```bash
pnpm test
```
Expected: All pass.

**Step 4: Commit**
```bash
git add src/app/(admin)/admin/trainers/[id]/
git commit -m "feat: admin trainer detail + edit page with classes list and deactivate"
```

---

## Final Check

```bash
pnpm build && pnpm test
```

Expected:
- Build: clean, rutas `/admin/trainers`, `/admin/trainers/new`, `/admin/trainers/[id]` presentes
- Tests: todos pasan (trainers suite + suites anteriores)
