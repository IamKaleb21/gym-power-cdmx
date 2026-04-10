'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { compressSlots } from '@/lib/trainers/availability'
import { createTrainerSchema, updateTrainerSchema } from '@/lib/validations/trainer.schema'

export type ActionResult = { success: true } | { success: false; error: string }

function parseAvailabilityJson(raw: FormDataEntryValue | null): { ok: true; value: string[] } | { ok: false; error: string } {
  if (raw === null || raw === '') {
    return { ok: true, value: [] }
  }
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Formato de disponibilidad inválido' }
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed) || !parsed.every((x) => typeof x === 'string')) {
      return { ok: false, error: 'Formato de disponibilidad inválido' }
    }
    return { ok: true, value: parsed }
  } catch {
    return { ok: false, error: 'No se pudo leer la disponibilidad' }
  }
}

export async function createTrainer(formData: FormData): Promise<ActionResult> {
  const raw = {
    full_name: formData.get('full_name'),
    specialty: formData.get('specialty'),
    bio: formData.get('bio') || undefined,
    is_active: formData.get('is_active') === 'true',
  }

  const parsed = createTrainerSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trainer, error } = await (supabase as any)
    .from('trainers')
    .insert({
      full_name: parsed.data.full_name,
      specialty: parsed.data.specialty,
      bio: parsed.data.bio ?? null,
      is_active: parsed.data.is_active,
    })
    .select('id')
    .single()

  if (error) return { success: false, error: error.message }
  if (!trainer?.id) return { success: false, error: 'No se pudo crear el entrenador' }

  const slotsParsed = parseAvailabilityJson(formData.get('availability_slots'))
  if (!slotsParsed.ok) return { success: false, error: slotsParsed.error }

  const slots = compressSlots(new Set(slotsParsed.value))
  if (slots.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: slotError } = await (supabase as any).from('trainer_availability').insert(
      slots.map((s) => ({ ...s, trainer_id: trainer.id }))
    )
    if (slotError) return { success: false, error: slotError.message }
  }

  revalidatePath('/admin/trainers')
  return { success: true }
}

export async function updateTrainer(id: string, formData: FormData): Promise<ActionResult> {
  const raw = {
    full_name: formData.get('full_name') || undefined,
    specialty: formData.get('specialty') || undefined,
    bio: formData.get('bio') || undefined,
    is_active:
      formData.get('is_active') !== null ? formData.get('is_active') === 'true' : undefined,
  }

  const parsed = updateTrainerSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = createAdminClient()

  const updatePayload: Record<string, unknown> = {}
  if (parsed.data.full_name !== undefined) updatePayload.full_name = parsed.data.full_name
  if (parsed.data.specialty !== undefined) updatePayload.specialty = parsed.data.specialty
  if (parsed.data.bio !== undefined) updatePayload.bio = parsed.data.bio
  if (parsed.data.is_active !== undefined) updatePayload.is_active = parsed.data.is_active

  if (Object.keys(updatePayload).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from('trainers').update(updatePayload).eq('id', id)
    if (error) return { success: false, error: error.message }
  }

  const slotsJson = formData.get('availability_slots')
  if (slotsJson !== null) {
    const slotsParsed = parseAvailabilityJson(slotsJson)
    if (!slotsParsed.ok) return { success: false, error: slotsParsed.error }

    const slots = compressSlots(new Set(slotsParsed.value))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('trainer_availability')
      .delete()
      .eq('trainer_id', id)
    if (deleteError) return { success: false, error: deleteError.message }

    if (slots.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any).from('trainer_availability').insert(
        slots.map((s) => ({ ...s, trainer_id: id }))
      )
      if (insertError) return { success: false, error: insertError.message }
    }
  }

  revalidatePath('/admin/trainers')
  revalidatePath(`/admin/trainers/${id}`)
  return { success: true }
}

export async function deactivateTrainer(id: string): Promise<ActionResult> {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('trainers').update({ is_active: false }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/trainers')
  revalidatePath(`/admin/trainers/${id}`)
  return { success: true }
}
