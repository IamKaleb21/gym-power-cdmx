'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createMemberSchema, updateMemberSchema } from '@/lib/validations/member.schema'

export async function createMember(formData: FormData) {
  const raw = {
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    temp_password: formData.get('temp_password'),
    phone: formData.get('phone') || undefined,
    plan_id: formData.get('plan_id'),
    start_date: formData.get('start_date'),
  }

  const parsed = createMemberSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { full_name, email, temp_password, phone, plan_id, start_date } = parsed.data
  const admin = createAdminClient()

  // 1. Create auth user (trigger handle_new_user creates profile automatically)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: temp_password,
    email_confirm: true,
    user_metadata: { full_name, role: 'member' },
  })

  if (authError || !authData.user) {
    return { error: { _root: [authError?.message ?? 'Error al crear usuario'] } }
  }

  const memberId = authData.user.id

  // 2. Update phone in profiles (trigger doesn't include it)
  if (phone) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (admin as any).from('profiles').update({ phone }).eq('id', memberId)
  }

  // 3. Get plan duration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: plan } = await (admin as any)
    .from('membership_plans')
    .select('duration_days')
    .eq('id', plan_id)
    .single()

  if (!plan) {
    return { error: { plan_id: ['Plan no encontrado'] } }
  }

  // 4. Calculate end_date
  const startDateObj = new Date(start_date)
  const endDateObj = new Date(startDateObj)
  endDateObj.setUTCDate(startDateObj.getUTCDate() + plan.duration_days)
  const end_date = endDateObj.toISOString().slice(0, 10)

  // 5. Create membership
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: membershipError } = await (admin as any).from('member_memberships').insert({
    member_id: memberId,
    plan_id,
    start_date,
    end_date,
  })

  if (membershipError) {
    return { error: { _root: [membershipError.message] } }
  }

  revalidatePath('/admin/members')
  return { success: true, memberId }
}

export async function updateMember(memberId: string, formData: FormData) {
  const raw = {
    full_name: formData.get('full_name') || undefined,
    phone: formData.get('phone') || undefined,
  }

  const parsed = updateMemberSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update(parsed.data)
    .eq('id', memberId)

  if (error) return { error: { _root: [error.message] } }

  revalidatePath(`/admin/members/${memberId}`)
  revalidatePath('/admin/members')
  return { success: true }
}

export async function deleteMember(memberId: string) {
  const admin = createAdminClient()

  const { error } = await admin.auth.admin.deleteUser(memberId)
  if (error) return { error: error.message }

  revalidatePath('/admin/members')
  return { success: true }
}

export async function updateMemberAvatar(memberId: string, avatarUrl: string) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', memberId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/members/${memberId}`)
  return { success: true }
}
