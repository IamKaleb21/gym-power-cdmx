'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteClass } from '@/app/actions/classes'

export default function ClassRowActions({ id }: { id: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function onDelete() {
    if (!confirm('¿Eliminar esta clase? Se borrarán todas las inscripciones.')) return
    start(async () => {
      const r = await deleteClass(id)
      if (!r.success) {
        alert(r.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Link
        href={`/admin/classes/${id}`}
        className="p-3 bg-[#262626] rounded-lg text-white hover:text-[#cafd00] transition-colors"
        aria-label="Editar clase"
      >
        <span className="material-symbols-outlined">edit</span>
      </Link>
      <button
        type="button"
        disabled={pending}
        onClick={onDelete}
        className="p-3 bg-[#262626] rounded-lg text-white hover:text-[#ff7351] transition-colors disabled:opacity-50"
        aria-label="Eliminar clase"
      >
        <span className="material-symbols-outlined">delete</span>
      </button>
    </div>
  )
}
