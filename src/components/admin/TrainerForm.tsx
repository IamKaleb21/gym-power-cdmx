'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { createTrainer, updateTrainer } from '@/app/actions/trainers'
import { expandSlots } from '@/lib/trainers/availability'
import { WeeklyScheduleGrid } from './WeeklyScheduleGrid'

interface TrainerFormProps {
  mode: 'new' | 'edit'
  trainer?: {
    id: string
    full_name: string
    specialty: string
    bio: string | null
    is_active: boolean
    trainer_availability: Array<{
      day_of_week: number
      start_time: string
      end_time: string
    }>
  }
}

export function TrainerForm({ mode, trainer }: TrainerFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isActive, setIsActive] = useState(trainer?.is_active ?? true)
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(
    trainer ? expandSlots(trainer.trainer_availability) : new Set(),
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    // Override is_active from controlled state (checkbox value is unreliable for booleans)
    formData.set('is_active', String(isActive))
    formData.set('availability_slots', JSON.stringify([...selectedSlots]))

    startTransition(async () => {
      const result =
        mode === 'new'
          ? await createTrainer(formData)
          : await updateTrainer(trainer!.id, formData)

      if (!result.success) {
        setError(result.error)
      } else {
        if (mode === 'new') {
          router.push('/admin/trainers')
        } else {
          router.push(`/admin/trainers/${trainer!.id}`)
        }
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-[#ff7351]/10 border border-[#ff7351]/20 rounded-lg px-4 py-3 text-[#ff7351] text-sm">
          {error}
        </div>
      )}

      {/* Personal info */}
      <section className="bg-[#1a1a1a] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-black font-headline uppercase tracking-tight text-white">
          Datos del entrenador
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label
              htmlFor="full_name"
              className="block text-xs font-bold uppercase tracking-widest text-white/60 font-headline mb-2"
            >
              Nombre completo
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={trainer?.full_name}
              className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00]"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="specialty"
              className="block text-xs font-bold uppercase tracking-widest text-white/60 font-headline mb-2"
            >
              Especialidad
            </label>
            <input
              id="specialty"
              name="specialty"
              type="text"
              required
              defaultValue={trainer?.specialty}
              className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00]"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="bio"
              className="block text-xs font-bold uppercase tracking-widest text-white/60 font-headline mb-2"
            >
              Bio{' '}
              <span className="text-white/30 font-normal normal-case">(opcional)</span>
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              defaultValue={trainer?.bio ?? ''}
              className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00] resize-none"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              aria-label={isActive ? 'Desactivar entrenador' : 'Activar entrenador'}
              onClick={() => setIsActive((v) => !v)}
              className={[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#cafd00]',
                isActive ? 'bg-[#cafd00]' : 'bg-[#484847]',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-block h-4 w-4 rounded-full bg-[#0e0e0e] shadow transition-transform',
                  isActive ? 'translate-x-6' : 'translate-x-1',
                ].join(' ')}
              />
            </button>
            <span className="text-sm text-white/80 select-none">
              {isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </section>

      {/* Weekly schedule */}
      <section className="bg-[#1a1a1a] rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-black font-headline uppercase tracking-tight text-white">
            Disponibilidad semanal
          </h2>
          <p className="text-xs text-white/40">
            Selecciona los bloques de 1 hora en los que el entrenador está disponible.
          </p>
        </div>
        <WeeklyScheduleGrid value={selectedSlots} onChange={setSelectedSlots} />
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
        <button
          type="button"
          onClick={() => router.push('/admin/trainers')}
          disabled={isPending}
          className="bg-[#262626] text-white font-headline font-bold rounded-lg px-8 py-3 hover:bg-[#484847] transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#cafd00] text-[#516700] font-headline font-black rounded-lg px-8 py-3 hover:bg-[#f3ffca] transition-colors shadow-[0_0_20px_rgba(202,253,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? mode === 'new'
              ? 'Creando…'
              : 'Guardando…'
            : mode === 'new'
              ? 'Crear entrenador'
              : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
