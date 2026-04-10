import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberProfileForm } from './MemberProfileForm'

export default async function MemberProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <MemberProfileForm
      initialData={{
        full_name: profile?.full_name ?? '',
        phone: profile?.phone ?? '',
        avatar_url: profile?.avatar_url ?? null,
      }}
    />
  )
}
