import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentAnalytics, getRetentionMetrics } from '@/lib/analytics/utils'
import { getAdminAnalyticsRangeDates } from '@/lib/dates/mexico-city'
import MembershipFlowChart from './MembershipFlowChart'
import RangeSelector from './RangeSelector'
import RetentionChart from './RetentionChart'
import RevenueChart from './RevenueChart'

export const dynamic = 'force-dynamic'

const mxn = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

type Range = '3m' | '6m' | '12m'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string }>
}) {
  const sp = (await searchParams) ?? {}
  const range: Range =
    sp.range === '3m' || sp.range === '12m' ? sp.range : '6m'

  const { startDate, endDate } = getAdminAnalyticsRangeDates(range)

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = supabase as any

  const [{ data: memberships }, { data: payments }, memberCountRes] = await Promise.all([
    admin.from('member_memberships').select('member_id, start_date, end_date'),
    admin.from('payments').select('amount, status, payment_date, created_at'),
    admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'member'),
  ])

  const metrics = getRetentionMetrics(memberships ?? [], startDate, endDate)
  const paymentAnalytics = getPaymentAnalytics(payments ?? [], startDate, endDate)
  const memberTotal = memberCountRes.count ?? 0

  const flowSeries = metrics.monthlySeries.map(({ month, new: n, churn }) => ({
    month,
    new: n,
    churn,
  }))

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

  const secondaryKpis = [
    {
      label: 'Miembros registrados',
      value: String(memberTotal),
      sub: 'Perfiles con rol member',
      icon: 'badge',
      color: 'text-[#cafd00]',
    },
    {
      label: 'Ingresos cobrados',
      value: mxn.format(paymentAnalytics.totalPaidInRange),
      sub: 'Pagos con fecha en el rango',
      icon: 'payments',
      color: 'text-[#cafd00]',
    },
    {
      label: 'Adeudos pendientes',
      value: mxn.format(paymentAnalytics.pendingTotal),
      sub:
        paymentAnalytics.pendingCount === 0
          ? 'Sin cargos pendientes'
          : `${paymentAnalytics.pendingCount} cargo(s)`,
      icon: 'schedule',
      color: 'text-amber-400',
    },
  ]

  return (
    <div className="w-full min-w-0 px-4 pb-24 lg:px-8 xl:px-10 2xl:px-12 lg:pb-8">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-4xl font-black tracking-tighter text-white uppercase lg:text-5xl">
            Analítica
          </h1>
        </div>
        <Suspense fallback={<div className="h-10 w-48 animate-pulse rounded-sm bg-surface-container-high" />}>
          <RangeSelector current={range} />
        </Suspense>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {secondaryKpis.map((kpi) => (
          <div key={kpi.label} className="rounded-lg bg-surface-container-low p-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">{kpi.label}</p>
              <span className={`material-symbols-outlined text-sm ${kpi.color}`}>{kpi.icon}</span>
            </div>
            <p className={`font-headline text-2xl font-black tracking-tighter sm:text-3xl ${kpi.color}`}>
              {kpi.value}
            </p>
            <p className="mt-1 text-[10px] text-white/35">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-surface-container-low p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-headline text-sm font-black tracking-tighter text-white uppercase">
              Membresías por mes
            </h2>
            <span className="text-[10px] tracking-widest text-white/40 uppercase">
              {startDate} → {endDate}
            </span>
          </div>
          <RetentionChart data={metrics.monthlySeries} />
        </div>
        <div className="rounded-lg bg-surface-container-low p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-headline text-sm font-black tracking-tighter text-white uppercase">
              Ingresos cobrados
            </h2>
            <span className="text-[10px] tracking-widest text-white/40 uppercase">Solo pagos liquidados</span>
          </div>
          <RevenueChart data={paymentAnalytics.monthlyRevenue} />
        </div>
      </div>

      <div className="rounded-lg bg-surface-container-low p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-headline text-sm font-black tracking-tighter text-white uppercase">
            Altas vs bajas
          </h2>
          <span className="text-[10px] tracking-widest text-white/40 uppercase">
            Nuevas membresías y fin de vigencia por mes
          </span>
        </div>
        <MembershipFlowChart data={flowSeries} />
      </div>
    </div>
  )
}
