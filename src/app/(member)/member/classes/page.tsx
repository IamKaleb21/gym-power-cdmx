import { notFound } from 'next/navigation'
import { parseISO } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getMexicoCityDayRangeUTC } from '@/lib/dates/mexico-city'
import { getEnrollmentStatus, getAvailableSpots, type EnrollmentRow } from '@/lib/classes/utils'
import MemberDaySelector from './MemberDaySelector'
import EnrollButton from './EnrollButton'
import type { EnrollmentUiStatus } from '@/lib/classes/utils'

const MX = 'America/Mexico_City'

type MemberClassRow = {
  id: string
  name: string
  scheduled_at: string
  duration_minutes: number
  max_capacity: number
  trainers: { full_name?: string; avatar_url?: string | null } | null
  class_enrollments: { id: string; member_id: string; status: string }[] | null
}

function formatClassTimeRange(scheduledAt: string, durationMinutes: number): string {
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + durationMinutes * 60000)
  const fmt = (d: Date) =>
    d.toLocaleTimeString('es-MX', {
      timeZone: MX,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  return `${fmt(start)} - ${fmt(end)}`
}

export default async function MemberClassesPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>
}) {
  const sp = (await searchParams) ?? {}
  const session = await createClient()
  const {
    data: { user },
  } = await session.auth.getUser()
  if (!user) notFound()

  const today = new Date().toLocaleDateString('en-CA', { timeZone: MX })
  const dateStr = sp.date ?? today
  const { start, end } = getMexicoCityDayRangeUTC(dateStr)

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: classes } = await (admin as any)
    .from('classes')
    .select('id, name, scheduled_at, duration_minutes, max_capacity, trainers(full_name, avatar_url), class_enrollments(id, member_id, status)')
    .gte('scheduled_at', start)
    .lt('scheduled_at', end)
    .order('scheduled_at', { ascending: true })

  const monthLabel = parseISO(`${dateStr}T12:00:00`)
    .toLocaleDateString('es-MX', { month: 'long', timeZone: MX })
    .toUpperCase()

  return (
    <main className="px-4 py-6">
      <MemberDaySelector selectedDate={dateStr} monthLabel={monthLabel} />

      <div className="space-y-4">
        {(classes ?? []).map((cls: MemberClassRow) => {
          const enrollments: EnrollmentRow[] = (cls.class_enrollments ?? []).map((e) => ({
            id: e.id,
            status: e.status,
            member_id: e.member_id,
          }))
          const ui = getEnrollmentStatus(enrollments, user.id, cls.max_capacity)
          const activeEnrollment = enrollments.find(
            (e) => e.member_id === user.id && e.status === 'active',
          )
          const spots = getAvailableSpots(enrollments, cls.max_capacity)
          const coach = cls.trainers?.full_name ?? 'Entrenador'
          const avatar = cls.trainers?.avatar_url as string | null | undefined

          return (
            <ClassCard
              key={cls.id}
              classId={cls.id}
              timeRange={formatClassTimeRange(cls.scheduled_at, cls.duration_minutes)}
              name={cls.name}
              coachName={coach}
              coachAvatarUrl={avatar}
              enrolled={cls.max_capacity - spots}
              maxCapacity={cls.max_capacity}
              uiStatus={ui}
              enrollmentId={activeEnrollment?.id ?? null}
            />
          )
        })}
      </div>
    </main>
  )
}

function ClassCard({
  classId,
  timeRange,
  name,
  coachName,
  coachAvatarUrl,
  enrolled,
  maxCapacity,
  uiStatus,
  enrollmentId,
}: {
  classId: string
  timeRange: string
  name: string
  coachName: string
  coachAvatarUrl: string | null | undefined
  enrolled: number
  maxCapacity: number
  uiStatus: EnrollmentUiStatus
  enrollmentId: string | null
}) {
  const isBooked = uiStatus === 'booked'
  const isFull = uiStatus === 'full'
  const almost = uiStatus === 'almost_full'

  return (
    <div
      className={`bg-surface-container rounded-xl overflow-hidden ${
        isBooked ? 'border-l-4 border-[#CCFF00] shadow-lg' : 'border-l-4 border-transparent'
      } ${isFull ? 'opacity-60' : ''} ${!isBooked && !isFull ? 'hover:border-[#CCFF00]/50 transition-colors' : ''} relative`}
    >
      {almost && (
        <div className="absolute top-0 right-0 p-4 z-10">
          <span className="bg-error-container text-on-error-container text-[8px] font-black uppercase px-2 py-0.5 rounded">
            Casi lleno
          </span>
        </div>
      )}
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p
              className={`font-headline font-bold tracking-wider text-sm uppercase ${
                isBooked ? 'text-[#CCFF00]' : 'text-on-surface-variant'
              }`}
            >
              {timeRange}
            </p>
            <h3 className="text-xl font-headline font-bold mt-1 text-white">{name}</h3>
          </div>
          <div
            className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 shrink-0 ${
              isFull
                ? 'bg-[#212121] text-on-surface-variant'
                : almost
                  ? 'bg-error-container/20 text-error'
                  : 'bg-[#212121] text-on-surface-variant'
            }`}
          >
            {isFull ? (
              <>
                <span className="material-symbols-outlined text-[12px]">lock</span>
                LLENO
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[12px]">groups</span>
                {enrolled}/{maxCapacity}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mb-4">
          {coachAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coachAvatarUrl}
              alt=""
              className="w-6 h-6 rounded-full object-cover bg-[#212121]"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#212121] flex items-center justify-center">
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                person
              </span>
            </div>
          )}
          <span className="text-sm text-on-surface font-medium">{coachName}</span>
        </div>
        <EnrollButton classId={classId} enrollmentId={enrollmentId} status={uiStatus} />
      </div>
    </div>
  )
}
