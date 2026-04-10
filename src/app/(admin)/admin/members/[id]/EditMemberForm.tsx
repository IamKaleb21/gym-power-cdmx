'use client'
import { useTransition, useState } from 'react'
import { updateMember } from '@/app/actions/members'

type Props = {
  memberId: string
  initialData: { full_name: string; phone: string }
}

export function EditMemberForm({ memberId, initialData }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateMember(memberId, formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-xl p-6">
      {saved && (
        <div className="mb-4 text-xs text-[#cafd00] font-headline uppercase tracking-widest">
          ✓ Cambios guardados
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-white/40 font-headline">
            Nombre completo
          </label>
          <input
            name="full_name"
            defaultValue={initialData.full_name}
            className="bg-[#262626] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#cafd00]/50 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black uppercase tracking-widest text-white/40 font-headline">
            Teléfono
          </label>
          <input
            name="phone"
            defaultValue={initialData.phone}
            className="bg-[#262626] border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#cafd00]/50 transition-colors"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="bg-[#cafd00] text-black text-xs font-black uppercase tracking-widest px-6 py-2.5 rounded-lg font-headline disabled:opacity-50 transition-opacity"
      >
        {isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
