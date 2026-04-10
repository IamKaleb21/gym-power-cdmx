import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDaysRemaining } from '@/lib/members/status'

function formatScheduledDate(isoString: string): { month: string; day: string; time: string } {
  const date = new Date(isoString)
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'America/Mexico_City' }).toUpperCase()
  const day = date.toLocaleString('en-US', { day: 'numeric', timeZone: 'America/Mexico_City' })
  const time = date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mexico_City' })
  return { month, day, time }
}

function formatPaymentDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'America/Mexico_City' })
}

function formatAmount(amount: number): string {
  return `$${amount.toLocaleString('en-US')} MXN`
}

export default async function MemberDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
  const nowMX = new Date().toLocaleString('sv', { timeZone: 'America/Mexico_City' }).replace(' ', 'T')

  const [
    { data: profile },
    { data: activeMembership },
    { data: upcomingEnrollments },
    { data: recentPayments },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('member_memberships')
      .select(`
        end_date,
        membership_plans ( name )
      `)
      .eq('member_id', user.id)
      .gte('end_date', today)
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from('class_enrollments')
      .select(`
        id,
        classes!inner (
          name,
          scheduled_at,
          trainers ( full_name )
        )
      `)
      .eq('member_id', user.id)
      .eq('status', 'active')
      .gt('classes.scheduled_at', nowMX)
      .order('scheduled_at', { referencedTable: 'classes', ascending: true })
      .limit(3),
    supabase
      .from('payments')
      .select('concept, payment_date, amount, status')
      .eq('member_id', user.id)
      .order('payment_date', { ascending: false })
      .limit(2),
  ])

  const displayName = (profile?.full_name ?? '').toUpperCase() || 'MEMBER'
  const planName = activeMembership?.membership_plans?.name ?? null
  const expiryDisplay = activeMembership?.end_date
    ? formatDaysRemaining(activeMembership.end_date)
    : null

  return (
    <main className="px-5 pt-6 space-y-8">
      {/* Welcome Hero */}
      <header className="relative overflow-hidden rounded-xl bg-surface-container p-6 border-l-4 border-[#CCFF00] min-w-0">
        <div className="relative z-10 min-w-0">
          <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-1">
            Welcome back,
          </p>
          <h1 className="font-headline text-4xl font-black text-[#CCFF00] leading-none mb-6 break-words">
            {displayName}
          </h1>
          <div className="grid grid-cols-2 gap-4 min-w-0">
            <div className="bg-surface-container-high p-4 rounded-lg min-w-0">
              <p className="font-label text-[10px] uppercase text-on-surface-variant mb-1">
                Current Plan
              </p>
              <p className="font-headline font-bold text-sm text-on-surface truncate">
                {planName ?? 'No active plan'}
              </p>
            </div>
            <div className="bg-[#CCFF00] p-4 rounded-lg min-w-0">
              <p className="font-label text-[10px] uppercase text-[#121212] font-bold mb-1">
                Expiry
              </p>
              <p className="font-headline font-black text-sm text-[#121212] truncate">
                {expiryDisplay ?? 'No active plan'}
              </p>
            </div>
          </div>
        </div>
        {/* Decorative circle */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#CCFF00] opacity-10 rounded-full blur-3xl" />
      </header>

      {/* Next 3 Classes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-lg font-bold tracking-tight flex items-center gap-2 uppercase">
            <span className="w-1.5 h-6 bg-[#CCFF00]" /> Next 3 Classes
          </h2>
          <Link
            href="/member/classes"
            className="text-[10px] font-label font-bold uppercase text-[#CCFF00] tracking-widest"
          >
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {upcomingEnrollments && upcomingEnrollments.length > 0 ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            upcomingEnrollments.map((enrollment: any) => {
              const cls = enrollment.classes
              if (!cls) return null
              const { month, day, time } = formatScheduledDate(cls.scheduled_at)
              const trainerName = cls.trainers?.full_name
                ? `Coach ${cls.trainers.full_name}`
                : 'Coach TBD'
              return (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-4 bg-surface-container-low p-4 rounded-lg border border-outline-variant hover:border-[#CCFF00] transition-colors group min-w-0"
                >
                  <div className="flex flex-col items-center justify-center bg-surface-container-highest rounded px-3 py-2 border border-outline-variant shrink-0">
                    <span className="font-headline text-xs font-bold text-on-surface">{month}</span>
                    <span className="font-headline text-lg font-black text-[#CCFF00] leading-none">
                      {day}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline font-bold text-on-surface text-base uppercase leading-tight group-hover:text-[#CCFF00] transition-colors truncate">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 min-w-0">
                      <span className="material-symbols-outlined text-[14px] shrink-0">schedule</span>{' '}
                      <span className="shrink-0">{time}</span>
                      <span className="mx-1 shrink-0">•</span>
                      <span className="material-symbols-outlined text-[14px] shrink-0">person</span>{' '}
                      <span className="truncate">{trainerName}</span>
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[#CCFF00] opacity-0 group-hover:opacity-100 transition-opacity">
                    arrow_forward_ios
                  </span>
                </div>
              )
            })
          ) : (
            <p className="text-on-surface-variant text-sm">No upcoming classes.</p>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-lg font-bold tracking-tight flex items-center gap-2 uppercase">
            <span className="w-1.5 h-6 bg-[#CCFF00]" /> Recent Activity
          </h2>
        </div>
        <div className="bg-surface-container rounded-xl overflow-hidden">
          {recentPayments && recentPayments.length > 0 ? (
            recentPayments.map((payment, idx) => (
              <div
                key={idx}
                className="p-4 border-b border-outline-variant last:border-b-0 flex justify-between items-center gap-3 min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#CCFF00]">payments</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-headline font-bold text-sm text-on-surface truncate">
                      {payment.concept}
                    </p>
                    <p className="font-label text-[10px] text-on-surface-variant uppercase">
                      {formatPaymentDate(payment.payment_date)}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 min-w-0">
                  <p className="font-headline font-black text-on-surface">
                    {formatAmount(payment.amount)}
                  </p>
                  {payment.status === 'paid' && (
                    <p className="text-[9px] font-bold uppercase text-emerald-400 bg-emerald-400/10 px-1.5 rounded inline-block">
                      Paid
                    </p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-on-surface-variant text-sm p-4">No recent activity.</p>
          )}
        </div>
      </section>
    </main>
  )
}
