import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { QRDisplay } from './QRDisplay'

export default async function MemberQrPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !profile) redirect('/member/dashboard')

  return (
    <main>
      <QRDisplay memberId={profile.id} memberName={profile.full_name ?? 'Miembro'} />
    </main>
  )
}
