---
name: gym-power-domain
description: Use when implementing any module for Gym Power CDMX — contains business rules that must be implemented exactly as specified in the schema
---

# Gym Power CDMX — Reglas de Negocio del Dominio

## Overview

Este skill es la fuente de verdad para la lógica de negocio del proyecto. Cualquier divergencia entre este skill y una implementación es un bug.

**Referencia completa del schema:** `docs/SCHEMA.md`

---

## 1. Estado de Membresía

**Regla:** El estado se calcula en query, NO existe como columna en la tabla `member_memberships`.

```sql
-- Fragmento SQL para incluir en cualquier SELECT de membresías
CASE
  WHEN end_date < CURRENT_DATE               THEN 'expired'
  WHEN end_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring_soon'
  ELSE 'active'
END AS status
```

**Equivalente TypeScript** (para lógica en Server Actions o componentes):

```typescript
export type MembershipStatus = 'active' | 'expiring_soon' | 'expired'

export function getMembershipStatus(endDate: string): MembershipStatus {
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (end < today) return 'expired'

  const sevenDaysFromNow = new Date(today)
  sevenDaysFromNow.setDate(today.getDate() + 7)

  if (end <= sevenDaysFromNow) return 'expiring_soon'
  return 'active'
}
```

**Colores UI por estado:**
- `active` → badge verde
- `expiring_soon` → badge naranja/amarillo (≤7 días)
- `expired` → badge rojo

---

## 2. Inscripción y Re-inscripción a Clase

**Regla crítica:** La tabla `class_enrollments` tiene un índice único **parcial** `WHERE status = 'active'`. Esto significa que puede existir UNA fila cancelada y UNA activa para el mismo `(class_id, member_id)`, pero no dos activas.

### Flujo de inscripción (Server Action: `enrollMember`)

```typescript
export async function enrollMember(
  classId: string,
  memberId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  // Paso 1: Verificar cupos disponibles
  const { data: classData } = await supabase
    .from('classes')
    .select(`
      max_capacity,
      class_enrollments(count)
    `)
    .eq('id', classId)
    .eq('class_enrollments.status', 'active')
    .single()

  if (!classData) return { success: false, error: 'Clase no encontrada' }

  const activeEnrollments = classData.class_enrollments[0]?.count ?? 0
  if (activeEnrollments >= classData.max_capacity) {
    return { success: false, error: 'No hay cupos disponibles' }
  }

  // Paso 2: Verificar si ya existe una fila (activa o cancelada)
  const { data: existing } = await supabase
    .from('class_enrollments')
    .select('id, status')
    .eq('class_id', classId)
    .eq('member_id', memberId)
    .maybeSingle()

  if (existing?.status === 'active') {
    return { success: false, error: 'Ya estás inscrito en esta clase' }
  }

  if (existing?.status === 'cancelled') {
    // Re-inscripción: UPDATE (no INSERT — el índice parcial bloquearía un segundo INSERT)
    const { error } = await supabase
      .from('class_enrollments')
      .update({ status: 'active', enrolled_at: new Date().toISOString() })
      .eq('id', existing.id)

    if (error) return { success: false, error: 'Error al re-inscribirse' }
  } else {
    // Primera inscripción: INSERT
    const { error } = await supabase
      .from('class_enrollments')
      .insert({ class_id: classId, member_id: memberId, status: 'active' })

    if (error) return { success: false, error: 'Error al inscribirse' }
  }

  revalidatePath('/member/classes')
  revalidatePath('/admin/classes')
  return { success: true }
}
```

---

## 3. Cancelación de Inscripción (Ventana de 24 Horas)

**Regla:** La validación de la ventana de 24h ocurre en el Server Action, NO en la base de datos ni en el frontend. El frontend solo muestra u oculta el botón como UX; la DB no tiene constraint para esto.

```typescript
export async function cancelEnrollment(
  enrollmentId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  // 1. Obtener la clase asociada para verificar el horario
  const { data: enrollment } = await supabase
    .from('class_enrollments')
    .select('id, status, classes(scheduled_at)')
    .eq('id', enrollmentId)
    .single()

  if (!enrollment) return { success: false, error: 'Inscripción no encontrada' }
  if (enrollment.status === 'cancelled') {
    return { success: false, error: 'Esta inscripción ya fue cancelada' }
  }

  // 2. Validar ventana de 24 horas
  const scheduledAt = new Date(enrollment.classes.scheduled_at)
  const now = new Date()
  const hoursUntilClass = (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilClass <= 24) {
    return {
      success: false,
      error: 'No puedes cancelar con menos de 24 horas de anticipación',
    }
  }

  // 3. Cancelar (UPDATE, no DELETE — se preserva el historial)
  const { error } = await supabase
    .from('class_enrollments')
    .update({ status: 'cancelled' })
    .eq('id', enrollmentId)

  if (error) return { success: false, error: 'Error al cancelar la inscripción' }

  revalidatePath('/member/classes')
  revalidatePath('/admin/classes')
  return { success: true }
}
```

**Cupos disponibles** (query para mostrar en UI):
```sql
SELECT
  max_capacity,
  max_capacity - COUNT(ce.id) FILTER (WHERE ce.status = 'active') AS available_spots
FROM classes c
LEFT JOIN class_enrollments ce ON ce.class_id = c.id
WHERE c.id = $1
GROUP BY c.id
```

---

## 4. Fórmula de Retención de Miembros

**Fórmula:** `((miembros_fin - nuevas_altas) / miembros_inicio) × 100`

**Regla crítica:** Proteger contra división por cero cuando `miembros_inicio === 0`.

```typescript
export type RetentionMetrics = {
  startCount: number      // miembros activos al inicio del período
  endCount: number        // miembros activos al final del período
  newMembers: number      // altas dentro del período
  churnedMembers: number  // bajas dentro del período (calculado)
  retentionRate: number   // porcentaje, 0-100
}

export function calculateRetentionRate(
  startCount: number,
  endCount: number,
  newMembers: number
): number {
  if (startCount === 0) return 0  // guarda división por cero
  return Math.round(((endCount - newMembers) / startCount) * 100)
}
```

**Query Supabase para las métricas del período `[startDate, endDate]`:**

```typescript
export async function getRetentionMetrics(
  startDate: string,
  endDate: string
): Promise<RetentionMetrics> {
  const supabase = await createClient()

  // Miembros activos al inicio del período
  const { count: startCount } = await supabase
    .from('member_memberships')
    .select('*', { count: 'exact', head: true })
    .lte('start_date', startDate)
    .gte('end_date', startDate)

  // Miembros activos al final del período
  const { count: endCount } = await supabase
    .from('member_memberships')
    .select('*', { count: 'exact', head: true })
    .lte('start_date', endDate)
    .gte('end_date', endDate)

  // Nuevas altas dentro del período
  const { count: newMembers } = await supabase
    .from('member_memberships')
    .select('*', { count: 'exact', head: true })
    .gte('start_date', startDate)
    .lte('start_date', endDate)

  const s = startCount ?? 0
  const e = endCount ?? 0
  const n = newMembers ?? 0

  return {
    startCount: s,
    endCount: e,
    newMembers: n,
    churnedMembers: Math.max(0, s + n - e),
    retentionRate: calculateRetentionRate(s, e, n),
  }
}
```

---

## 5. Validación QR de Acceso (Check-in)

**Regla:** La validación del QR comprueba **DOS condiciones**. Fallar cualquiera de las dos bloquea el acceso.

```typescript
export type QRValidationResult =
  | { allowed: true; member: { fullName: string; avatarUrl: string | null; planName: string } }
  | { allowed: false; reason: 'not_found' | 'expired_membership' | 'pending_debt' | 'no_membership' }

export async function validateMemberByUUID(memberId: string): Promise<QRValidationResult> {
  const supabase = await createClient()

  // 1. Obtener perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', memberId)
    .single()

  if (!profile) return { allowed: false, reason: 'not_found' }

  // 2. Verificar membresía activa (end_date >= hoy)
  const today = new Date().toISOString().split('T')[0]
  const { data: membership } = await supabase
    .from('member_memberships')
    .select('end_date, membership_plans(name)')
    .eq('member_id', memberId)
    .gte('end_date', today)
    .order('end_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!membership) {
    return { allowed: false, reason: 'expired_membership' }
  }

  // 3. Verificar sin adeudos pendientes
  const { data: pendingPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('member_id', memberId)
    .eq('status', 'pending')

  const totalDebt = pendingPayments?.reduce((sum, p) => sum + p.amount, 0) ?? 0

  if (totalDebt > 0) {
    return { allowed: false, reason: 'pending_debt' }
  }

  return {
    allowed: true,
    member: {
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
      planName: membership.membership_plans.name,
    },
  }
}
```

---

## 6. Eliminación de Miembros — Restricción por Pagos

**Regla:** La tabla `payments` tiene `member_id ON DELETE RESTRICT`. Intentar eliminar un miembro con pagos lanzará un error de Postgres.

El flujo correcto en el admin:

```typescript
export async function deleteMember(memberId: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Verificar adeudos antes de intentar eliminar
  const { count } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)

  if ((count ?? 0) > 0) {
    return {
      success: false,
      error: `Este miembro tiene ${count} registro(s) de pago. Resuelve o archiva los pagos antes de eliminar el perfil.`,
    }
  }

  // Solo si no tiene pagos, proceder a eliminar (cascade borra membresías e inscripciones)
  const { error } = await supabase.auth.admin.deleteUser(memberId)
  if (error) return { success: false, error: 'Error al eliminar el miembro' }

  revalidatePath('/admin/members')
  return { success: true }
}
```

---

## Resumen de Reglas Críticas

| Regla | Dónde se valida | Qué NO hacer |
|---|---|---|
| Estado de membresía | Query SQL con CASE o función TS | Guardar como columna en DB |
| Re-inscripción | Server Action → UPDATE si cancelled, INSERT si no existe | INSERT siempre (viola índice parcial) |
| Cancelación 24h | Server Action | Constraint en DB, validación solo en frontend |
| Retención ÷0 | Server Action | `((end - new) / start) * 100` sin guarda |
| QR: membresía + adeudo | Server Action `validateMemberByUUID` | Verificar solo membresía o solo adeudo |
| Eliminar miembro con pagos | Server Action → verificar count | Dejar que Postgres lance error de FK |
