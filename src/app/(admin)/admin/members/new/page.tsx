import { createClient } from '@/lib/supabase/server'
import { NewMemberForm } from './NewMemberForm'

export default async function NewMemberPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: plans } = await (supabase as any)
    .from('membership_plans')
    .select('id, name, price, duration_days')
    .order('price')

  return (
    <div className="px-4 lg:px-12 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-5xl md:text-7xl font-black font-headline tracking-tighter uppercase leading-none mb-2">
          New Member<span className="text-[#cafd00]">.</span>
        </h1>
        <p className="text-white/40 text-sm">Registrar nuevo miembro y asignar plan de membresía.</p>
      </div>
      <NewMemberForm plans={plans ?? []} />
    </div>
  )
}
