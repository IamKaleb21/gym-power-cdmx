import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import ClassForm from '@/components/admin/ClassForm'
import DeleteClassButton from './DeleteClassButton'

export default async function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: cls, error } = await (supabase as any)
    .from('classes')
    .select(
      'id, name, description, trainer_id, scheduled_at, duration_minutes, max_capacity, class_enrollments(id, status, member_id, profiles(full_name, email))',
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !cls) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trainers } = await (supabase as any)
    .from('trainers')
    .select('id, full_name, specialty')
    .eq('is_active', true)
    .order('full_name')

  type Row = {
    status: string
    profiles: { full_name?: string; email?: string } | null
  }
  const roster =
    (cls.class_enrollments as Row[] | undefined)
      ?.filter((e) => e.status === 'active')
      .map((e) => ({
        name: e.profiles?.full_name ?? '—',
        email: e.profiles?.email ?? '—',
      })) ?? []

  return (
    <div className="px-8 py-8">
      <div className="max-w-2xl mx-auto space-y-10">
        <div>
          <h1 className="font-headline text-4xl font-black text-white tracking-tighter uppercase">
            EDITAR <span className="text-[#cafd00]">CLASE</span>
          </h1>
        </div>
        <ClassForm
          mode="edit"
          class={{
            id: cls.id,
            name: cls.name,
            description: cls.description,
            trainer_id: cls.trainer_id,
            scheduled_at: cls.scheduled_at,
            duration_minutes: cls.duration_minutes,
            max_capacity: cls.max_capacity,
          }}
          trainers={trainers ?? []}
        />

        <section>
          <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
            <span className="w-8 h-[1px] bg-primary" />
            Inscritos
          </h2>
          {roster.length === 0 ? (
            <p className="text-on-surface-variant text-sm">Sin inscripciones activas.</p>
          ) : (
            <ul className="space-y-2">
              {roster.map((r, i) => (
                <li
                  key={`${r.email}-${i}`}
                  className="flex justify-between gap-4 text-sm border-b border-outline-variant/20 pb-2"
                >
                  <span className="text-white font-medium">{r.name}</span>
                  <span className="text-on-surface-variant font-mono text-xs">{r.email}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <DeleteClassButton id={id} />
      </div>
    </div>
  )
}
