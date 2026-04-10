'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deactivateTrainer } from '@/app/actions/trainers'

interface Props {
  id: string
}

export default function DeactivateTrainerButton({ id }: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDeactivate() {
    startTransition(async () => {
      await deactivateTrainer(id)
      router.push('/admin/trainers')
    })
  }

  return (
    <button
      onClick={handleDeactivate}
      disabled={isPending}
      className="mt-8 w-full py-3 bg-[#ff7351]/10 border border-[#ff7351]/30 text-[#ff7351] font-headline font-bold uppercase tracking-tighter hover:bg-[#ff7351]/20 transition-colors disabled:opacity-60"
    >
      {isPending ? 'Desactivando…' : 'Desactivar entrenador'}
    </button>
  )
}
