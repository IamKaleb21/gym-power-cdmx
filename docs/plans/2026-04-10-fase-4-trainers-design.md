# Fase 4 — Módulo de Entrenadores: Design Doc

**Fecha:** 2026-04-10  
**Branch:** `feat/fase-4-trainers-module`  
**Stitch de referencia:** `docs/stitch/10-admin-trainers-unified.html`

---

## Objetivo

CRUD de entrenadores con disponibilidad semanal interactiva y perfil admin completo.

---

## Decisiones tomadas

| Decisión | Elección | Motivo |
|----------|----------|--------|
| WeeklyScheduleGrid | Hourly toggle grid (7×17) | Visual, simple, testeable; sin complejidad de drag |
| Avatar trainers | Placeholder (ícono `person`) | No se necesita upload real en Fase 4 |
| Estrategia availability | DELETE + INSERT completo | Atómica, sin conflictos de merge |
| Granularidad grid | 1 hora por celda (06:00–23:00) | Coincide con representación "06-12" del stitch |

---

## Arquitectura

### Páginas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/admin/trainers` | RSC | Lista bento — calco del stitch |
| `/admin/trainers/new` | RSC + Client Form | Formulario creación |
| `/admin/trainers/[id]` | RSC + Client Form | Perfil + edición + clases asignadas |

### Server Actions (`src/app/actions/trainers.ts`)

```typescript
createTrainer(formData: FormData): Promise<ActionResult>
updateTrainer(id: string, formData: FormData): Promise<ActionResult>
setAvailability(trainerId: string, slots: AvailabilitySlot[]): Promise<ActionResult>
deleteTrainer(id: string): Promise<ActionResult>  // soft: is_active = false
```

### Componentes Client

| Archivo | Descripción |
|---------|-------------|
| `src/components/admin/WeeklyScheduleGrid.tsx` | Grid 7×17 toggle interactivo |
| `src/components/admin/TrainerForm.tsx` | Form create/edit con grid embebido |

### Utilidades puras (`src/lib/trainers/availability.ts`)

```typescript
// Convierte Set<"day-hour"> → AvailabilitySlot[] con rangos fusionados
compressSlots(selected: Set<string>): AvailabilitySlot[]

// Convierte rows DB → chips display {day: "MON", range: "06-12"}
compressForDisplay(rows: TrainerAvailabilityRow[]): DisplayChip[]

// Expande AvailabilitySlot[] → Set<"day-hour"> (para pre-llenar grid en edición)
expandSlots(rows: TrainerAvailabilityRow[]): Set<string>
```

---

## Data Layer

### Schema Zod (`src/lib/validations/trainer.schema.ts`)

```typescript
export const createTrainerSchema = z.object({
  full_name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  specialty: z.string().min(1, "Especialidad requerida"),
  bio: z.string().optional(),
  is_active: z.boolean().default(true),
})

export const updateTrainerSchema = createTrainerSchema.partial()

export const availabilitySlotSchema = z.object({
  trainer_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
}).refine(s => s.end_time > s.start_time, {
  message: "end_time debe ser mayor que start_time",
})
```

### Tests TDD (`src/tests/trainers.test.ts`)

```typescript
// createTrainerSchema: valida full_name min 2 chars
// createTrainerSchema: valida specialty requerido
// availabilitySlotSchema: rechaza end_time <= start_time
// availabilitySlotSchema: rechaza day_of_week fuera de 0-6
// compressSlots: celdas consecutivas mismo día → un solo rango
// compressSlots: celdas no consecutivas → rangos separados
// compressSlots: días distintos → rangos independientes
// compressForDisplay: rows DB → chips {day, range}
// expandSlots: rows DB → Set<"day-hour"> correcto
```

---

## UI — Calco del Stitch

### `/admin/trainers` — Lista

```
ELITE COACHES (text-7xl font-black tracking-tighter)
       italic text-[#cafd00]

[Active Trainers 24] [Slots Open 128]
border-l-4 border-primary, bg-surface-container-low

grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6:
┌─────────────────────────────┐
│ [foto h-64 grayscale→color] │
│ [POWERLIFTING badge]        │
│ MARCO VEGA (gradient ovrl)  │
├─────────────────────────────┤
│ bio text-white/60 text-sm   │
│ ── WEEKLY AVAILABILITY ──   │
│ [MON][WED][FRI][SAT]       │
│  06-12 06-12 06-12 08-14   │
├─────────────────────────────┤
│ ⋯  Edit Profile →          │
└─────────────────────────────┘

┌─────────────────────────────┐  (LIME CTA card)
│ bg-[#cafd00]                │
│ RECRUIT NEW ELITE TALENT    │
│ [+ OPEN DIRECTORY]          │
│              GP (watermark) │
└─────────────────────────────┘

┌──────────────────────────────────┐  (md:col-span-2)
│ ── RECENT ACTIVITY   LIVE FEED   │
│ [icon] Marco Vega updated...     │
│ [icon] New trainer: Sofia Luna   │
│ [View All Logs]                  │
└──────────────────────────────────┘
```

Avatar placeholder cuando no hay foto: `bg-surface-container-highest w-full h-full flex items-center justify-center` con ícono `person text-6xl text-gray-600`.

### `WeeklyScheduleGrid`

```
        DOM  LUN  MAR  MIÉ  JUE  VIE  SÁB
 06:00  [ ]  [■]  [ ]  [■]  [ ]  [■]  [ ]
 07:00  [ ]  [■]  [ ]  [■]  [ ]  [■]  [ ]
 ...
 22:00  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]

■ = bg-[#cafd00] text-[#121212]
□ = bg-surface-container-highest hover:bg-surface-container-high
```

Props: `value: Set<string>`, `onChange: (next: Set<string>) => void`  
State keys: `"${day}-${hour}"` ej. `"1-6"` = Lunes 6am

### `/admin/trainers/new` y `/admin/trainers/[id]`

Sigue estilo Phase 2 (`members/new`):
- Labels `font-headline text-xs uppercase tracking-widest text-on-surface-variant`
- Inputs `bg-surface-container-highest border border-[#212121] rounded-xl py-4 px-4`
- Toggle `is_active` con switch visual
- `WeeklyScheduleGrid` debajo de campos básicos
- Submit `bg-[#cafd00] text-[#121212] font-headline font-black uppercase`

**`/admin/trainers/[id]` adicional:**
- Sección "Clases asignadas": tabla de clases futuras del entrenador
- Botón "Desactivar entrenador" (equivalente al Danger Zone de Phase 3)

---

## Sidebar Admin

Agregar entre "Classes" y "Payments":
```tsx
<Link href="/admin/trainers" className={isActive('/admin/trainers') ? activeClass : inactiveClass}>
  <span className="material-symbols-outlined">fitness_center</span> Trainers
</Link>
```

---

## File Structure

```
src/
├── app/
│   ├── actions/
│   │   └── trainers.ts                    (Server Actions)
│   └── (admin)/admin/
│       └── trainers/
│           ├── page.tsx                   (lista RSC)
│           ├── new/
│           │   └── page.tsx               (new RSC)
│           └── [id]/
│               └── page.tsx               (detalle/edit RSC)
├── components/admin/
│   ├── WeeklyScheduleGrid.tsx             (Client)
│   └── TrainerForm.tsx                    (Client)
├── lib/
│   ├── trainers/
│   │   └── availability.ts                (pure utils)
│   └── validations/
│       └── trainer.schema.ts              (Zod)
└── tests/
    └── trainers.test.ts                   (TDD)
```

---

## Build check

`pnpm build` debe pasar limpio al final de cada task.
