import { createAdminClient } from '@/lib/supabase/admin'
import { getMonthlyRevenue, formatMrrDisplay } from '@/lib/payments/utils'
import RegisterPaymentForm from './RegisterPaymentForm'
import ToggleStatusButton from './ToggleStatusButton'

export const dynamic = 'force-dynamic'

const MX = 'America/Mexico_City'

type ProfileName = { full_name: string | null }
type PaymentListRow = {
  id: string
  amount: number
  concept: string
  status: string
  payment_date: string | null
  due_date: string | null
  created_at: string
  profiles: ProfileName | ProfileName[] | null
}

type MetricRow = { amount: number; status: string; payment_date: string | null }

function memberName(row: PaymentListRow): string {
  const p = row.profiles
  if (!p) return '—'
  if (Array.isArray(p)) return p[0]?.full_name ?? '—'
  return p.full_name ?? '—'
}

function txnSubtitle(row: PaymentListRow): string {
  const d = new Date(row.created_at)
  const time = d.toLocaleTimeString('en-US', {
    timeZone: MX,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return `${row.concept} • ${time}`
}

export default async function AdminPaymentsPage() {
  const supabase = createAdminClient()

  const currentMonth = new Date().toLocaleDateString('en-CA', { timeZone: MX }).slice(0, 7)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recentRes, metricsRes, membersRes] = await Promise.all([
    (supabase as any)
      .from('payments')
      .select(
        'id, amount, concept, status, payment_date, due_date, created_at, profiles!payments_member_id_fkey(full_name)',
      )
      .order('created_at', { ascending: false })
      .limit(20),
    (supabase as any).from('payments').select('amount, status, payment_date'),
    (supabase as any).from('profiles').select('id, full_name, email').eq('role', 'member').order('full_name'),
  ])

  const recent = (recentRes.data ?? []) as PaymentListRow[]
  const metrics = (metricsRes.data ?? []) as MetricRow[]
  const members = (membersRes.data ?? []) as Array<{ id: string; full_name: string; email: string }>

  const mrr = getMonthlyRevenue(metrics, currentMonth)
  const paidThisMonth = metrics.filter(
    (p) => p.status === 'paid' && (p.payment_date?.startsWith(currentMonth) ?? false),
  )
  const avgTicket = paidThisMonth.length > 0 ? Math.round(mrr / paidThisMonth.length) : 0
  const totalUnpaid = metrics.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
  const unpaidCount = metrics.filter((p) => p.status === 'pending').length

  return (
    <div className="mt-8 px-4 lg:px-8 max-w-7xl mx-auto pb-24 lg:pb-8 min-w-0 overflow-x-hidden">
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
        <div className="md:col-span-8 bg-surface-container-low p-8 rounded-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#cafd00]/5 rounded-full blur-[100px] -mr-32 -mt-32" />
          <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold mb-2">
            Monthly Recurring Revenue
          </p>
          <div className="flex items-baseline gap-4 flex-wrap">
            <h3 className="text-6xl lg:text-8xl font-black font-headline tracking-tighter text-[#cafd00]">
              {formatMrrDisplay(mrr)}
            </h3>
            <span className="text-primary bg-primary/10 px-3 py-1 text-sm font-bold rounded-full flex items-center gap-1 mb-4">
              <span className="material-symbols-outlined text-sm">trending_up</span> 12%
            </span>
          </div>
          <div className="mt-8 flex gap-2 h-16 items-end">
            {(
              [
                'h-[40%]',
                'h-[60%]',
                'h-[55%]',
                'h-[85%]',
                'h-[70%]',
                'h-[95%]',
                'h-[45%]',
              ] as const
            ).map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-sm ${h} ${i === 5 ? 'bg-primary shadow-[0_0_20px_rgba(202,253,0,0.3)]' : 'bg-surface-container-highest'}`}
              />
            ))}
          </div>
        </div>
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-container-high p-6 rounded-lg flex-1">
            <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold mb-1">Average Ticket</p>
            <h4 className="text-4xl font-headline font-black text-white">
              ${avgTicket.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
            </h4>
            <div className="mt-4 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className={`h-full bg-[#cafd00] transition-all ${avgTicket > 0 ? 'w-3/4' : 'w-0'}`}
              />
            </div>
          </div>
          <div className="bg-surface-container-high p-6 rounded-lg flex-1 border-l-4 border-error">
            <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold mb-1">Churn Rate</p>
            <h4 className="text-4xl font-headline font-black text-white">2.4%</h4>
            <p className="text-[10px] text-error mt-2 font-bold uppercase">+0.3% vs Last Month</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-headline font-black uppercase tracking-tighter">Recent Transactions</h2>
            <span className="text-[10px] uppercase font-black tracking-widest text-white/30">Last 20</span>
          </div>
          <div className="space-y-4">
            {recent.length === 0 ? (
              <div className="bg-surface-container-low p-8 rounded-lg text-white/40 text-sm text-center">
                No transactions yet.
              </div>
            ) : (
              recent.map((row) => {
                const isPending = row.status === 'pending'
                const amountColor = isPending ? 'text-error' : 'text-[#cafd00]'
                return (
                  <div
                    key={row.id}
                    className={`bg-surface-container-low p-4 rounded-lg flex items-center justify-between group transition-colors hover:bg-surface-container-high ${
                      isPending ? 'border border-outline-variant/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-sm flex shrink-0 items-center justify-center ${
                          isPending ? 'bg-error/10' : 'bg-[#262626]'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined ${isPending ? 'text-error' : 'text-white/40'}`}
                        >
                          {isPending ? 'priority_high' : 'person'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white uppercase text-sm truncate">{memberName(row)}</p>
                        <p className="text-xs text-white/40 truncate">{txnSubtitle(row)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <p className={`${amountColor} font-headline font-black text-lg`}>
                        ${Number(row.amount).toLocaleString('es-MX')}
                      </p>
                      {row.status === 'paid' || row.status === 'pending' ? (
                        <div className="mt-1 flex justify-end">
                          <ToggleStatusButton id={row.id} currentStatus={row.status} />
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <RegisterPaymentForm members={members} />
          <div className="bg-surface-container-low p-6 rounded-lg border-l-2 border-[#cafd00]">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">Unpaid Dues Alert</h4>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-headline font-black">
                ${totalUnpaid.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
              </span>
              <span className="material-symbols-outlined text-[#cafd00] scale-125">info</span>
            </div>
            <p className="text-[10px] text-white/40 mt-2 uppercase">
              {unpaidCount} {unpaidCount === 1 ? 'record' : 'records'} requiring attention
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
