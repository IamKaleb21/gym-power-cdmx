import Link from 'next/link'
import { addDays, format, parseISO, startOfWeek } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMexicoCityDayRangeUTC } from '@/lib/dates/mexico-city'
import DaySelector from './DaySelector'
import ClassRowActions from './ClassRowActions'

const MX = 'America/Mexico_City'

type AdminClassRow = {
  id: string
  name: string
  scheduled_at: string
  max_capacity: number
  trainers: { full_name?: string } | null
  class_enrollments: { status: string }[] | null
}

function sessionLabel(d: Date): string {
  const h = Number(
    d.toLocaleString('en-US', { timeZone: MX, hour: 'numeric', hour12: false }),
  )
  return h < 12 ? 'AM Session' : 'PM Session'
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    timeZone: MX,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export default async function AdminClassesPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>
}) {
  const sp = (await searchParams) ?? {}
  const today = new Date().toLocaleDateString('en-CA', { timeZone: MX })
  const dateStr = sp.date ?? today
  const { start, end } = getMexicoCityDayRangeUTC(dateStr)

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: classes } = await (supabase as any)
    .from('classes')
    .select('*, trainers(id, full_name), class_enrollments(id, status)')
    .gte('scheduled_at', start)
    .lt('scheduled_at', end)
    .order('scheduled_at', { ascending: true })

  const mondayStr = format(startOfWeek(parseISO(`${dateStr}T12:00:00`), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const nextMondayStr = format(addDays(parseISO(`${mondayStr}T12:00:00`), 7), 'yyyy-MM-dd')
  const weekStart = getMexicoCityDayRangeUTC(mondayStr).start
  const weekEndExclusive = getMexicoCityDayRangeUTC(nextMondayStr).start

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: weekClasses } = await (supabase as any)
    .from('classes')
    .select('max_capacity, class_enrollments(status)')
    .gte('scheduled_at', weekStart)
    .lt('scheduled_at', weekEndExclusive)

  let sumCap = 0
  let sumActive = 0
  for (const c of weekClasses ?? []) {
    sumCap += c.max_capacity as number
    const active =
      (c.class_enrollments as { status: string }[] | undefined)?.filter((e) => e.status === 'active')
        .length ?? 0
    sumActive += active
  }
  const avgPct = sumCap > 0 ? Math.round((sumActive / sumCap) * 100) : 0

  /* RSC: instante "ahora" en el servidor para ventana 24h */
  const since24h = new Date(
    new Date().getTime() - 24 * 3600 * 1000,
  ).toISOString()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: newBookings } = await (supabase as any)
    .from('class_enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .gte('enrolled_at', since24h)

  const classesToday = classes?.length ?? 0

  return (
    <div className="px-6 lg:px-10 py-8 lg:py-10">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-5xl md:text-8xl font-black font-headline tracking-tighter uppercase leading-none mb-4 text-white">
              Agenda<span className="text-primary">.</span>
            </h1>
            <p className="text-on-surface-variant font-body max-w-md">
              Manage the weekly kinetic flow. Control capacities, schedule elite sessions, and monitor
              attendance metrics.
            </p>
          </div>
          <Link
            href="/admin/classes/new"
            className="group flex items-center gap-2 bg-primary text-on-primary px-8 py-5 rounded-lg font-headline font-black uppercase tracking-tighter self-start hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Create Class
          </Link>
        </header>

        <DaySelector selectedDate={dateStr} />

        <div className="space-y-4 mb-16">
          {(classes ?? []).length === 0 && (
            <p className="text-on-surface-variant text-sm py-8 text-center">
              No hay clases programadas para este día.
            </p>
          )}
          {(classes ?? []).map((cls: AdminClassRow, idx: number) => {
            const startD = new Date(cls.scheduled_at)
            const activeCount =
              (cls.class_enrollments as { status: string }[] | undefined)?.filter(
                (e: { status: string }) => e.status === 'active',
              ).length ?? 0
            const cap = cls.max_capacity as number
            const pct = cap > 0 ? Math.round((activeCount / cap) * 100) : 0
            const isFull = activeCount >= cap
            const coachName = cls.trainers?.full_name ?? 'Sin asignar'
            const titleClass =
              idx === 0 ? 'text-primary' : 'text-on-surface'

            return (
              <div
                key={cls.id}
                className={`relative bg-[#131313] p-6 md:p-8 rounded-lg flex flex-col md:flex-row gap-8 items-center group hover:bg-[#20201f] transition-colors overflow-hidden ${
                  isFull ? 'border-l-4 border-[#ff7351]' : ''
                }`}
              >
                {isFull && (
                  <div className="absolute -right-4 top-1/2 -translate-y-1/2 rotate-90 text-[#ff7351] font-black font-headline uppercase tracking-[1em] opacity-10 text-6xl pointer-events-none">
                    FULL
                  </div>
                )}
                <div className="md:w-32 text-center md:text-left shrink-0">
                  <span className="text-3xl font-black font-headline tracking-tighter text-white block">
                    {formatTime(startD)}
                  </span>
                  <span className="block text-[10px] uppercase tracking-widest text-on-surface-variant">
                    {sessionLabel(startD)}
                  </span>
                </div>
                <div className="flex-grow flex flex-col md:flex-row md:items-center gap-6 min-w-0">
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap min-w-0">
                      <h3
                        className={`text-2xl font-black font-headline uppercase tracking-tight min-w-0 truncate ${titleClass}`}
                      >
                        {cls.name}
                      </h3>
                      {isFull && (
                        <span className="bg-[#ff7351] text-[10px] font-black uppercase px-2 py-0.5 rounded-sm text-[#450900]">
                          FULL
                        </span>
                      )}
                    </div>
                    <p className="text-on-surface-variant text-sm flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-sm shrink-0">person</span>
                      <span className="truncate">{coachName}</span>
                    </p>
                  </div>
                  <div className="md:w-48 w-full">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-on-surface">
                        Capacity
                      </span>
                      <span
                        className={`text-sm font-bold ${
                          isFull ? 'text-[#ff7351]' : idx === 0 ? 'text-primary' : 'text-on-surface'
                        }`}
                      >
                        {activeCount}/{cap}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-[#262626] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isFull ? 'bg-[#ff7351] w-full' : 'bg-gradient-to-r from-primary to-[#beee00]'
                        }`}
                        style={isFull ? {} : { width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
                <ClassRowActions id={cls.id} />
              </div>
            )
          })}
        </div>

        <section className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          <div className="bg-[#cafd00] p-8 rounded-lg relative overflow-hidden group">
            <span className="material-symbols-outlined text-9xl absolute -right-4 -bottom-4 text-[#4a5e00]/20 group-hover:scale-110 transition-transform">
              monitoring
            </span>
            <div className="relative z-10">
              <h4 className="font-headline font-black uppercase text-[#4a5e00] tracking-tighter text-4xl leading-none mb-2">
                {avgPct}%
              </h4>
              <p className="font-headline uppercase text-xs font-bold text-[#4a5e00] tracking-widest">
                Average Weekly Attendance
              </p>
            </div>
          </div>
          <div className="bg-[#131313] p-8 rounded-lg">
            <h4 className="font-headline font-black uppercase text-on-surface tracking-tighter text-4xl leading-none mb-2">
              {classesToday}
            </h4>
            <p className="font-headline uppercase text-xs font-bold text-on-surface-variant tracking-widest">
              Classes Today
            </p>
          </div>
          <div className="bg-[#131313] p-8 rounded-lg relative">
            <div className="absolute top-0 right-0 p-4">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                trending_up
              </span>
            </div>
            <h4 className="font-headline font-black uppercase text-on-surface tracking-tighter text-4xl leading-none mb-2">
              +{newBookings ?? 0}
            </h4>
            <p className="font-headline uppercase text-xs font-bold text-on-surface-variant tracking-widest">
              New Bookings (Last 24h)
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
