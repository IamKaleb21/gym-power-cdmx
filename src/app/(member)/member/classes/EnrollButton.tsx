'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { enrollMember, cancelEnrollment } from '@/app/actions/classes'
import type { EnrollmentUiStatus } from '@/lib/classes/utils'

export default function EnrollButton({
  classId,
  enrollmentId,
  status,
}: {
  classId: string
  enrollmentId: string | null
  status: EnrollmentUiStatus
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  if (status === 'full') {
    return (
      <button
        type="button"
        disabled
        className="w-full py-3 bg-[#212121] text-on-surface-variant font-headline font-bold text-sm uppercase tracking-widest rounded cursor-not-allowed"
      >
        Lista de espera
      </button>
    )
  }

  if (status === 'booked' && enrollmentId) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[10px] text-on-surface-variant italic">
          <span className="material-symbols-outlined text-sm">info</span>
          Inscrito. La cancelación debe hacerse con al menos 24 h de anticipación.
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await cancelEnrollment(enrollmentId)
              if (!r.success) {
                alert(r.error)
                return
              }
              router.refresh()
            })
          }
          className="w-full py-3 bg-[#212121] text-[#ff7351] font-headline font-bold text-sm uppercase tracking-widest rounded border border-[#ff7351]/30 active:scale-95 transition-transform disabled:opacity-60"
        >
          {pending ? '…' : 'Cancelar inscripción'}
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await enrollMember(classId)
          if (!r.success) {
            alert(r.error)
            return
          }
          router.refresh()
        })
      }
      className="w-full py-3 bg-[#CCFF00] text-[#121212] font-headline font-bold text-sm uppercase tracking-widest rounded active:scale-95 transition-transform disabled:opacity-60"
    >
      {pending ? '…' : 'Reservar lugar'}
    </button>
  )
}
