'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState, useMemo } from 'react'
import { createMember } from '@/app/actions/members'

type Plan = { id: string; name: string; price: number; duration_days: number }

function firstErrorMessage(
  err: Record<string, string[] | undefined> | undefined,
): string {
  if (!err) return 'Error al registrar el miembro'
  const root = err._root
  if (root?.[0]) return root[0]
  for (const key of Object.keys(err)) {
    if (key === '_root') continue
    const msgs = err[key]
    if (msgs?.[0]) return msgs[0]
  }
  return 'Error al registrar el miembro'
}

export function NewMemberForm({ plans }: { plans: Plan[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createMember(formData)
      if ('error' in result) {
        setError(firstErrorMessage(result.error as Record<string, string[] | undefined>))
      } else if (result.success) {
        router.push('/admin/members')
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

      <section className="bg-[#1a1a1a] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-black font-headline uppercase tracking-tight text-white">
          Datos de cuenta
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
              autoComplete="name"
              className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00]"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold uppercase tracking-widest text-white/60 font-headline mb-2"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00]"
            />
          </div>
          <div>
            <label
              htmlFor="temp_password"
              className="block text-xs font-bold uppercase tracking-widest text-white/60 font-headline mb-2"
            >
              Contraseña temporal
            </label>
            <input
              id="temp_password"
              name="temp_password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00]"
            />
          </div>
          <div className="md:col-span-2">
            <label
              htmlFor="phone"
              className="block text-xs font-bold uppercase tracking-widest text-white/60 font-headline mb-2"
            >
              Teléfono <span className="text-white/30 font-normal normal-case">(opcional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00]"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#1a1a1a] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-black font-headline uppercase tracking-tight text-white">
          Membresía
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label
              htmlFor="plan_id"
              className="block text-xs font-bold uppercase tracking-widest text-white/60 font-headline mb-2"
            >
              Plan
            </label>
            <select
              id="plan_id"
              name="plan_id"
              required
              disabled={plans.length === 0}
              className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00] disabled:opacity-50"
              defaultValue=""
            >
              <option value="" disabled>
                {plans.length === 0 ? 'No hay planes disponibles' : 'Selecciona un plan'}
              </option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.price} / {p.duration_days} días
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="start_date"
              className="block text-xs font-bold uppercase tracking-widest text-white/60 font-headline mb-2"
            >
              Fecha de inicio
            </label>
            <input
              id="start_date"
              name="start_date"
              type="date"
              required
              defaultValue={today}
              className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00] scheme-dark"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
        <button
          type="button"
          onClick={() => router.push('/admin/members')}
          disabled={isPending}
          className="bg-[#262626] text-white font-headline font-bold rounded-lg px-8 py-3 hover:bg-[#484847] transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending || plans.length === 0}
          className="bg-[#cafd00] text-[#516700] font-headline font-black rounded-lg px-8 py-3 hover:bg-[#f3ffca] transition-colors shadow-[0_0_20px_rgba(202,253,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Registrando…' : 'Registrar miembro'}
        </button>
      </div>
    </form>
  )
}
