'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { updateMemberSchema } from '@/lib/validations/member.schema'

export async function updateMemberProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const raw = {
    full_name: formData.get('full_name') as string | undefined || undefined,
    phone: formData.get('phone') as string | undefined || undefined,
  }

  // Remove undefined keys so updateMemberSchema optional fields work correctly
  const cleanRaw = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => v !== undefined && v !== '')
  )

  const parsed = updateMemberSchema.safeParse(cleanRaw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  if (Object.keys(parsed.data).length === 0) {
    return { success: true }
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/member/profile')
  return { success: true }
}
