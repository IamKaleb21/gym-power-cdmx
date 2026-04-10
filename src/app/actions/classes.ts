'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createClassSchema, updateClassSchema } from '@/lib/validations/class.schema'
import { canCancel } from '@/lib/classes/utils'

export type ActionResult = { success: true } | { success: false; error: string }

export async function createClass(formData: FormData): Promise<ActionResult> {
  const raw = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    trainer_id: formData.get('trainer_id'),
    scheduled_at: formData.get('scheduled_at'),
    duration_minutes: formData.get('duration_minutes'),
    max_capacity: formData.get('max_capacity'),
  }

  const parsed = createClassSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('classes').insert({
    name: parsed.data.name,
    description: parsed.data.description ?? null,
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
    trainer_id: formData.get('trainer_id'),
    scheduled_at: formData.get('scheduled_at') || undefined,
    duration_minutes: formData.get('duration_minutes') || undefined,
    max_capacity: formData.get('max_capacity') || undefined,
  }

  const parsed = updateClassSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const payload: Record<string, unknown> = {}
  if (parsed.data.name !== undefined) payload.name = parsed.data.name
  if (parsed.data.description !== undefined) payload.description = parsed.data.description
  if (parsed.data.trainer_id !== undefined) payload.trainer_id = parsed.data.trainer_id
  if (parsed.data.scheduled_at !== undefined) payload.scheduled_at = parsed.data.scheduled_at
  if (parsed.data.duration_minutes !== undefined) payload.duration_minutes = parsed.data.duration_minutes
  if (parsed.data.max_capacity !== undefined) payload.max_capacity = parsed.data.max_capacity

  if (Object.keys(payload).length === 0) {
    return { success: true }
  }

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('classes').update(payload).eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/classes')
  revalidatePath(`/admin/classes/${id}`)
  return { success: true }
}

export async function deleteClass(id: string): Promise<ActionResult> {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('classes').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/classes')
  return { success: true }
}

export async function enrollMember(classId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'No autenticado' }

  const memberId = user.id
  const admin = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cls, error: classErr } = await (admin as any)
    .from('classes')
    .select('id, max_capacity, class_enrollments(id, status)')
    .eq('id', classId)
    .maybeSingle()

  if (classErr || !cls) return { success: false, error: 'Clase no encontrada' }

  const activeCount =
    (cls.class_enrollments as { status: string }[] | undefined)?.filter(
      (e) => e.status === 'active',
    ).length ?? 0
  if (activeCount >= cls.max_capacity) {
    return { success: false, error: 'No hay cupos disponibles' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('class_enrollments')
      .update({ status: 'active', enrolled_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) return { success: false, error: error.message }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('class_enrollments').insert({
      class_id: classId,
      member_id: memberId,
      status: 'active',
    })
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/member/classes')
  return { success: true }
}

export async function cancelEnrollment(enrollmentId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { success: false, error: 'No autenticado' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error: fetchErr } = await (supabase as any)
    .from('class_enrollments')
    .select('id, member_id, classes(scheduled_at)')
    .eq('id', enrollmentId)
    .maybeSingle()

  if (fetchErr || !row) return { success: false, error: 'Inscripción no encontrada' }
  if (row.member_id !== user.id) return { success: false, error: 'No autorizado' }

  const scheduledAt = (row.classes as { scheduled_at: string } | null)?.scheduled_at
  if (!scheduledAt || !canCancel(scheduledAt)) {
    return {
      success: false,
      error: 'No se puede cancelar con menos de 24 horas de anticipación',
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('class_enrollments')
    .update({ status: 'cancelled' })
    .eq('id', enrollmentId)
    .eq('member_id', user.id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/member/classes')
  return { success: true }
}
