'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Range = '3m' | '6m' | '12m'

const OPTIONS: { value: Range; label: string }[] = [
  { value: '3m', label: '3 meses' },
  { value: '6m', label: '6 meses' },
  { value: '12m', label: '12 meses' },
]

export default function RangeSelector({ current }: { current: Range }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(range: Range) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', range)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex gap-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleChange(opt.value)}
          className={`rounded-sm px-2 py-2 sm:px-3 font-headline text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors ${
            current === opt.value
              ? 'bg-[#cafd00] text-[#0e0e0e]'
              : 'bg-surface-container-high text-white/60 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
