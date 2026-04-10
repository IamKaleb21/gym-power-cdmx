'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClass, updateClass } from '@/app/actions/classes'

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export type TrainerOption = { id: string; full_name: string; specialty: string }

type ClassFormProps =
  | {
      mode: 'new'
      trainers: TrainerOption[]
    }
  | {
      mode: 'edit'
      class: {
        id: string
        name: string
        description: string | null
        trainer_id: string | null
        scheduled_at: string
        duration_minutes: number
        max_capacity: number
      }
      trainers: TrainerOption[]
    }

export default function ClassForm(props: ClassFormProps) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const trainers = props.trainers
  const initial =
    props.mode === 'edit'
      ? props.class
      : {
          name: '',
          description: '',
          trainer_id: null as string | null,
          scheduled_at: '',
          duration_minutes: 60,
          max_capacity: 20,
        }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    const rawLocal = fd.get('scheduled_at')
    if (typeof rawLocal === 'string' && rawLocal.length > 0) {
      const iso = new Date(rawLocal).toISOString()
      fd.set('scheduled_at', iso)
    }
    start(async () => {
      const res =
        props.mode === 'new'
          ? await createClass(fd)
          : await updateClass(props.class.id, fd)
      if (!res.success) {
        setError(res.error)
        return
      }
      router.push(props.mode === 'new' ? '/admin/classes' : `/admin/classes/${props.class.id}`)
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-[#ff7351]/40 bg-[#ff7351]/10 px-4 py-3 text-sm text-[#ff7351]">
          {error}
        </div>
      )}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa] block px-1">
          Nombre
        </label>
        <input
          name="name"
          required
          defaultValue={props.mode === 'edit' ? props.class.name : ''}
          className="w-full bg-[#262626] border-none text-white px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-[#cafd00]/40"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa] block px-1">
          Descripción
        </label>
        <textarea
          name="description"
          rows={3}
          defaultValue={props.mode === 'edit' ? props.class.description ?? '' : ''}
          className="w-full bg-[#262626] border-none text-white px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-[#cafd00]/40"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa] block px-1">
          Entrenador
        </label>
        <select
          name="trainer_id"
          defaultValue={props.mode === 'edit' ? props.class.trainer_id ?? '' : ''}
          className="w-full bg-[#262626] border-none text-white px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-[#cafd00]/40"
        >
          <option value="">— Sin asignar —</option>
          {trainers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name} ({t.specialty})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa] block px-1">
          Fecha y hora
        </label>
        <input
          type="datetime-local"
          name="scheduled_at"
          required={props.mode === 'new'}
          defaultValue={
            props.mode === 'edit' ? toDatetimeLocalValue(props.class.scheduled_at) : ''
          }
          className="w-full bg-[#262626] border-none text-white px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-[#cafd00]/40"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa] block px-1">
            Duración (min)
          </label>
          <input
            type="number"
            name="duration_minutes"
            min={1}
            defaultValue={initial.duration_minutes}
            className="w-full bg-[#262626] border-none text-white px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-[#cafd00]/40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa] block px-1">
            Capacidad máxima
          </label>
          <input
            type="number"
            name="max_capacity"
            min={1}
            required
            defaultValue={initial.max_capacity}
            className="w-full bg-[#262626] border-none text-white px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-[#cafd00]/40"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-[#cafd00] text-[#516700] font-headline font-black uppercase tracking-tighter py-4 rounded-lg hover:bg-[#f3ffca] transition-colors disabled:opacity-60"
      >
        {pending ? 'Guardando…' : props.mode === 'new' ? 'Crear clase' : 'Guardar cambios'}
      </button>
    </form>
  )
}
