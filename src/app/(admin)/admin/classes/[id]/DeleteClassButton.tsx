'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteClass } from '@/app/actions/classes'

export default function DeleteClassButton({ id }: { id: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()

  function handleDelete() {
    if (!confirm('¿Eliminar esta clase? Se cancelarán todas las inscripciones.')) return
    start(async () => {
      const r = await deleteClass(id)
      if (!r.success) {
        alert(r.error)
        return
      }
      router.push('/admin/classes')
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="mt-8 w-full py-3 bg-[#ff7351]/10 border border-[#ff7351]/30 text-[#ff7351] font-headline font-bold uppercase tracking-tighter hover:bg-[#ff7351]/20 transition-colors disabled:opacity-60"
    >
      {pending ? 'Eliminando…' : 'Eliminar clase'}
    </button>
  )
}
