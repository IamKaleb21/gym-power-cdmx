# Fase 5 — Módulo de Clases Grupales: Design Doc

## Objetivo

Agenda visual de clases grupales para el admin (crear/editar/borrar) y portal de reservas para el miembro (inscribirse/cancelar con regla de 24 horas).

---

## Decisiones

### Patrón de navegación por día
- **URL search params**: `?date=YYYY-MM-DD` controla el día activo en ambas vistas (admin y miembro)
- El RSC lee `searchParams.date`, calcula `startOfDay` / `endOfDay` en `America/Mexico_City` → UTC, y fetcha clases de Supabase
- Los Client Components `DaySelector` / `MemberDaySelector` hacen `router.push(?date=...)` al cambiar día
- Justificación: mantiene el patrón RSC del proyecto, URLs compartibles/bookmarkable, sin Route Handlers extra

### Clientes Supabase
- **Admin RSC pages** → `createAdminClient()` — bypasa RLS, necesario para ver todos los enrollments de todos los miembros y calcular cupos
- **Member RSC pages** → `createAdminClient()` — el miembro no puede ver enrollments de otros por RLS, pero necesitamos el conteo total para mostrar la barra de capacidad
- **Server Actions de inscripción/cancelación** → `createClient()` (session) — RLS garantiza que el miembro solo actúe sobre sus propias inscripciones

### Capacidad disponible
- Calculada en RSC: `max_capacity - enrollments.filter(e => e.status === 'active').length`
- No almacenada en DB (consistente con el schema existente)

### Lógica de re-inscripción
- Si existe fila `(class_id, member_id)` con `status = 'cancelled'` → `UPDATE status = 'active', enrolled_at = NOW()`
- Si no existe → `INSERT` nuevo
- El partial unique index `idx_enrollments_one_active_per_member` previene doble inscripción activa

### Regla de 24 horas
- Validada en Server Action (`cancelEnrollment`): `scheduled_at - now() > 24h`
- También validada en `canCancel(scheduledAt)` util pura (testeable)
- En UI: el botón "Cancel Booking" siempre se muestra en clases reservadas; el Server Action rechaza con error si se intenta fuera del plazo

### Member classes — inline actions, sin página de detalle
- El stitch `14-member-class-schedule-booking.html` muestra booking/cancelación directamente en el list card
- `/member/classes/[id]` se omite; todas las acciones son inline via `EnrollButton` Client Component
- "Waiting List" (clase llena): botón disabled, placeholder sin funcionalidad real

### Scope de quick stats (admin)
- Valores estáticos en el prototipo del stitch; se implementan como conteos reales:
  - "Classes Today": `count` de clases del día actual
  - "New Bookings (24h)": `count` de enrollments con `enrolled_at > now - 24h`
  - "Average Attendance": `(sum(active_enrollments) / sum(max_capacity)) * 100` de la semana actual

---

## Arquitectura

### Páginas RSC

| Ruta | Descripción |
|------|-------------|
| `/admin/classes?date=` | Agenda semanal con DaySelector + lista de clases del día + quick stats |
| `/admin/classes/new` | Wrapper RSC + ClassForm (create mode) |
| `/admin/classes/[id]` | ClassForm (edit mode) + roster de inscritos + DeleteClassButton |
| `/member/classes?date=` | MemberDaySelector + class cards con EnrollButton inline |

### Client Components

| Componente | Ubicación | Responsabilidad |
|------------|-----------|-----------------|
| `DaySelector` | `(admin)/admin/classes/` | Selector de 7 días (semana actual), `router.push(?date=...)` |
| `ClassForm` | `components/admin/` | Form de creación/edición de clases |
| `DeleteClassButton` | `(admin)/admin/classes/[id]/` | Confirmación + delete action |
| `MemberDaySelector` | `(member)/member/classes/` | Chips horizontales scrolleables desde hoy |
| `EnrollButton` | `(member)/member/classes/` | Book/Cancel inline con useTransition |

### Lógica pura testeable

```typescript
// src/lib/classes/utils.ts
getAvailableSpots(enrollments: Enrollment[], maxCapacity: number): number
canCancel(scheduledAt: string): boolean   // scheduledAt - now > 24h en CDMX
getEnrollmentStatus(
  enrollments: Enrollment[],
  memberId: string,
  maxCapacity: number
): 'booked' | 'available' | 'almost_full' | 'full'
// almost_full: available_spots / max_capacity <= 0.2
```

### Server Actions

```typescript
// src/app/actions/classes.ts
createClass(formData: FormData): Promise<ActionResult>   // admin
updateClass(id: string, formData: FormData): Promise<ActionResult>  // admin
deleteClass(id: string): Promise<ActionResult>           // admin (cascade)
enrollMember(classId: string): Promise<ActionResult>     // session client
cancelEnrollment(enrollmentId: string): Promise<ActionResult> // session, verifica 24h
```

---

## Diseño UI (calco stitches)

### Admin `09-admin-classes-unified.html`

**Header:**
- Headline `"Agenda."` (texto enorme con punto lime `text-primary`)
- Descripción en `text-on-surface-variant`
- Botón "Create Class" (lime, icon `add_circle`) → `/admin/classes/new`

**DaySelector:**
- 7 botones para la semana actual (Lun–Dom)
- Activo: `border-b-4 border-primary` + texto lime
- Inactivo: `bg-surface-container-low` hover `bg-surface-container-highest`

**Lista de clases:**
- Cada fila: hora (texto headline grande), label "AM Session"/"PM Session", nombre de clase (lime para featured/primera), coach name con icon `person`, barra de capacidad (`h-3 bg-surface-container-highest` + fill gradiente lime)
- Clase FULL: `border-l-4 border-error` + watermark "FULL" rotado 90° (opacity-10, pointer-events-none)
- Botones: `edit` → `/admin/classes/[id]`, `delete` → DeleteClassButton

**Quick Stats (bottom):**
- Grid 3 columnas: card lime (% asistencia + icon `monitoring`), card oscura (clases hoy), card oscura (nuevas reservas 24h + icon `trending_up`)

### Member `14-member-class-schedule-booking.html`

**MemberDaySelector:**
- Horizontal scroll (`overflow-x-auto`), 7 días desde hoy
- Cada chip: `w-14 h-20 rounded-lg`, día abreviado + número del mes
- Activo: `border border-[#CCFF00] bg-[#212121]` + punto indicador lime

**Class cards (4 estados):**
- **Booked**: `border-l-4 border-[#CCFF00]`, tiempo + nombre + coach avatar (w-6 h-6) + "Booked. Cancellations must be made 24h prior." (italic, icon `info`) + botón rojo "Cancel Booking"
- **Available**: sin borde especial, botón lime "Book Spot"
- **Almost Full**: badge "Almost Full" (`bg-error-container text-on-error-container`) + botón lime "Book Spot", counter en rojo
- **Full**: `opacity-60`, icon `lock` en capacity badge, botón disabled "Waiting List"

---

## Stitch de referencia

- Admin: `docs/stitch/09-admin-classes-unified.html`
- Member: `docs/stitch/14-member-class-schedule-booking.html`
