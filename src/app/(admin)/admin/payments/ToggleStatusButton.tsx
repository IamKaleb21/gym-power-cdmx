'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updatePaymentStatus } from '@/app/actions/payments'

export default function ToggleStatusButton({
  id,
  currentStatus,
}: {
  id: string
  currentStatus: 'paid' | 'pending'
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const nextStatus = currentStatus === 'paid' ? 'pending' : 'paid'

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await updatePaymentStatus(id, nextStatus)
          router.refresh()
        })
      }
      className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded transition-opacity disabled:opacity-50 ${
        currentStatus === 'paid'
          ? 'text-white/20 bg-white/5 hover:bg-white/10'
          : 'text-error bg-error/20 hover:bg-error/30'
      }`}
    >
      {isPending ? '…' : currentStatus === 'paid' ? 'Success' : 'Pending Dues'}
    </button>
  )
}
