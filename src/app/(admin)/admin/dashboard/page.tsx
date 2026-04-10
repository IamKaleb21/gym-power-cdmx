import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRetentionMetrics } from '@/lib/analytics/utils'
import RangeSelector from './RangeSelector'
import RetentionChart from './RetentionChart'

export const dynamic = 'force-dynamic'

const MX = 'America/Mexico_City'

type Range = '3m' | '6m' | '12m'

function getRangeDates(range: Range): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = now.toLocaleDateString('en-CA', { timeZone: MX })

  const start = new Date(now)
  if (range === '3m') {
    start.setMonth(start.getMonth() - 3)
  } else if (range === '12m') {
    start.setFullYear(start.getFullYear() - 1)
  } else {
    start.setMonth(start.getMonth() - 6)
  }

  const startDate = start.toLocaleDateString('en-CA', { timeZone: MX })
  return { startDate, endDate }
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string }>
}) {
  const sp = (await searchParams) ?? {}
  const range: Range =
    sp.range === '3m' || sp.range === '12m' ? sp.range : '6m'

  const { startDate, endDate } = getRangeDates(range)

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberships } = await (supabase as any)
    .from('member_memberships')
    .select('member_id, start_date, end_date')

  const metrics = getRetentionMetrics(memberships ?? [], startDate, endDate)

  const kpis = [
    {
      label: 'Activos',
      value: String(metrics.activeCount),
      icon: 'group',
      color: 'text-[#cafd00]',
    },
    {
      label: 'Nuevas Altas',
      value: String(metrics.newCount),
      icon: 'person_add',
      color: 'text-[#cafd00]',
    },
    {
      label: 'Bajas',
      value: String(metrics.churnCount),
      icon: 'person_remove',
      color: 'text-error',
    },
    {
      label: 'Retención',
      value: `${metrics.retentionRate.toFixed(1)}%`,
      icon: 'trending_up',
      color: 'text-[#cafd00]',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 lg:px-8 lg:pb-8">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
            Admin Portal
          </p>
          <h1 className="font-headline text-4xl font-black tracking-tighter text-white uppercase lg:text-5xl">
            Analytics
          </h1>
        </div>
        <Suspense fallback={<div className="h-10 w-48 animate-pulse rounded-sm bg-surface-container-high" />}>
          <RangeSelector current={range} />
        </Suspense>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-lg bg-surface-container-low p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">{kpi.label}</p>
              <span className={`material-symbols-outlined text-sm ${kpi.color}`}>{kpi.icon}</span>
            </div>
            <p className={`font-headline text-4xl font-black tracking-tighter ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-surface-container-low p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-headline text-sm font-black tracking-tighter text-white uppercase">
            Actividad mensual
          </h2>
          <span className="text-[10px] tracking-widest text-white/40 uppercase">
            {startDate} → {endDate}
          </span>
        </div>
        <RetentionChart data={metrics.monthlySeries} />
      </div>
    </div>
  )
}
