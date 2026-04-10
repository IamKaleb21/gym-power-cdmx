'use client'

import { useRouter } from 'next/navigation'
import { addDays, format, parseISO, startOfWeek } from 'date-fns'

const DAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

function getWeekDays(dateStr: string): { iso: string; label: string; dayNum: number }[] {
  const base = parseISO(`${dateStr}T12:00:00`)
  const monday = startOfWeek(base, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i)
    return {
      iso: format(d, 'yyyy-MM-dd'),
      label: DAY_LABELS[i],
      dayNum: Number(format(d, 'd')),
    }
  })
}

export default function DaySelector({ selectedDate }: { selectedDate: string }) {
  const router = useRouter()
  const days = getWeekDays(selectedDate)

  return (
    <div className="grid grid-cols-7 gap-1 md:gap-4 mb-10">
      {days.map((d) => {
        const isActive = d.iso === selectedDate
        return (
          <button
            key={d.iso}
            type="button"
            onClick={() => router.push(`/admin/classes?date=${d.iso}`)}
            className={`p-4 text-center rounded-lg transition-colors ${
              isActive
                ? 'bg-[#131313] border-b-4 border-[#cafd00]'
                : 'bg-[#131313] hover:bg-[#262626]'
            }`}
          >
            <span
              className={`block text-xs uppercase tracking-widest mb-1 ${
                isActive ? 'text-[#cafd00]' : 'text-[#adaaaa]'
              }`}
            >
              {d.label}
            </span>
            <span
              className={`text-2xl font-black font-headline ${
                isActive ? 'text-[#cafd00]' : 'text-white'
              }`}
            >
              {d.dayNum}
            </span>
          </button>
        )
      })}
    </div>
  )
}
