'use client'

import { useRouter } from 'next/navigation'
import { addDays, format, parseISO, startOfWeek } from 'date-fns'

const DAY_LABELS_ES = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM']

function getWeekDays(dateStr: string): { iso: string; label: string; dayNum: number }[] {
  const base = parseISO(`${dateStr}T12:00:00`)
  const monday = startOfWeek(base, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i)
    return {
      iso: format(d, 'yyyy-MM-dd'),
      label: DAY_LABELS_ES[i],
      dayNum: Number(format(d, 'd')),
    }
  })
}

export default function MemberDaySelector({
  selectedDate,
  monthLabel,
}: {
  selectedDate: string
  monthLabel: string
}) {
  const router = useRouter()
  const days = getWeekDays(selectedDate)

  return (
    <section className="mb-8">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="font-headline font-bold text-2xl tracking-tight text-white uppercase">
            {monthLabel}
          </h2>
          <p className="text-on-surface-variant text-sm font-medium">Hora Ciudad de México</p>
        </div>
        <span className="material-symbols-outlined text-[#cafd00]">calendar_month</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {days.map((d) => {
          const isActive = d.iso === selectedDate
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => router.push(`/member/classes?date=${d.iso}`)}
              className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-20 rounded-lg border transition-colors ${
                isActive
                  ? 'border-[#CCFF00] bg-[#212121]'
                  : 'border-[#212121] bg-surface-container'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase ${
                  isActive ? 'text-[#CCFF00]' : 'text-on-surface-variant'
                }`}
              >
                {d.label}
              </span>
              <span
                className={`text-lg font-headline font-bold ${
                  isActive ? 'text-[#CCFF00]' : 'text-white'
                }`}
              >
                {d.dayNum}
              </span>
              {isActive && <span className="w-1 h-1 bg-[#CCFF00] rounded-full mt-1" />}
            </button>
          )
        })}
      </div>
    </section>
  )
}
