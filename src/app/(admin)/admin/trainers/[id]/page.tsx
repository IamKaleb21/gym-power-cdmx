import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { TrainerForm } from '@/components/admin/TrainerForm'
import DeactivateTrainerButton from './DeactivateTrainerButton'

export default async function TrainerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trainer } = await (supabase as any)
    .from('trainers')
    .select('*, trainer_availability(*), classes(*)')
    .eq('id', id)
    .maybeSingle()

  if (!trainer) notFound()

  const now = new Date()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upcomingClasses = ((trainer.classes ?? []) as any[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((c: any) => c.scheduled_at && new Date(c.scheduled_at) > now)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())

  return (
    <div className="px-4 lg:px-12 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-headline text-4xl font-black text-white tracking-tighter uppercase">
          EDITAR <span className="text-[#cafd00]">ENTRENADOR</span>
        </h1>
        <p className="text-white/40 text-sm mt-1 font-body">{trainer.full_name}</p>
      </div>

      {/* Edit form */}
      <TrainerForm
        mode="edit"
        trainer={{
          id: trainer.id,
          full_name: trainer.full_name,
          specialty: trainer.specialty,
          bio: trainer.bio,
          is_active: trainer.is_active,
          trainer_availability: trainer.trainer_availability ?? [],
        }}
      />

      {/* Upcoming classes */}
      <section className="mt-10">
        <h2 className="text-xs font-black uppercase tracking-widest text-white/40 font-headline mb-4">
          Clases próximas
        </h2>
        {upcomingClasses.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl p-6 text-white/30 text-sm">
            Sin clases próximas registradas.
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-xl divide-y divide-white/5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {upcomingClasses.map((cls: any) => {
              const scheduled = new Date(cls.scheduled_at)
              return (
                <div key={cls.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-white text-sm font-semibold font-headline uppercase">
                      {cls.name ?? 'Clase'}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {scheduled.toLocaleDateString('es-MX', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      {scheduled.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-white/20">fitness_center</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Deactivate */}
      {trainer.is_active && <DeactivateTrainerButton id={trainer.id} />}
    </div>
  )
}
