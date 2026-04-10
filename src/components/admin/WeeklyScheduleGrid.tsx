'use client'

const DAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6) // 6..22

interface WeeklyScheduleGridProps {
  value: Set<string>
  onChange: (next: Set<string>) => void
}

export function WeeklyScheduleGrid({ value, onChange }: WeeklyScheduleGridProps) {
  function toggle(day: number, hour: number) {
    const key = `${day}-${hour}`
    const next = new Set(value)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    onChange(next)
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid min-w-max grid-cols-[auto_repeat(7,minmax(2rem,1fr))]">
        {/* Header row */}
        <div className="h-6" /> {/* empty corner */}
        {DAY_LABELS.map((day) => (
          <div
            key={day}
            className="h-6 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white/40 px-1"
          >
            {day}
          </div>
        ))}

        {/* Hour rows */}
        {HOURS.map((hour) => (
          <>
            {/* Hour label */}
            <div
              key={`label-${hour}`}
              className="h-7 flex items-center justify-end pr-2 text-[10px] font-mono text-white/40 select-none"
            >
              {String(hour).padStart(2, '0')}
            </div>

            {/* Day cells */}
            {DAY_LABELS.map((_, dayIdx) => {
              const key = `${dayIdx}-${hour}`
              const selected = value.has(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(dayIdx, hour)}
                  className={[
                    'h-7 w-8 rounded-sm border transition-colors duration-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#cafd00]',
                    selected
                      ? 'bg-[#cafd00]/15 border-[#cafd00]/40 text-[#cafd00]'
                      : 'bg-[#262626]/30 border-transparent hover:bg-[#262626]',
                  ].join(' ')}
                  aria-pressed={selected}
                  aria-label={`${DAY_LABELS[dayIdx]} ${String(hour).padStart(2, '0')}:00`}
                />
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}
