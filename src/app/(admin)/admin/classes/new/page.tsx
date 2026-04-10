import { createAdminClient } from '@/lib/supabase/admin'
import ClassForm from '@/components/admin/ClassForm'

export default async function NewClassPage() {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trainers } = await (supabase as any)
    .from('trainers')
    .select('id, full_name, specialty')
    .eq('is_active', true)
    .order('full_name')

  return (
    <div className="px-8 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-headline text-4xl font-black text-white tracking-tighter uppercase">
            NUEVA <span className="text-[#cafd00]">CLASE</span>
          </h1>
        </div>
        <ClassForm mode="new" trainers={trainers ?? []} />
      </div>
    </div>
  )
}
