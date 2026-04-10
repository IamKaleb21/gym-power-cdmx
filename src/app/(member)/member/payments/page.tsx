import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'America/Mexico_City',
  })
}

export default async function MemberPaymentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: payments } = await supabase
    .from('payments')
    .select('id, concept, amount, status, payment_date, due_date')
    .eq('member_id', user.id)
    .order('payment_date', { ascending: false })

  const pendingPayments = payments?.filter((p) => p.status === 'pending') ?? []
  const balance = pendingPayments.reduce((sum, p) => sum + (p.amount ?? 0), 0)
  const nextDue = pendingPayments
    .filter((p) => p.due_date)
    .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1))[0]
  const isAllClear = balance === 0

  return (
    <main className="px-5 pt-8">
      {/* Hero Summary */}
      <div className="mb-8 p-6 bg-[#1a1a1a] rounded-xl border-l-4 border-[#CCFF00] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined text-8xl">receipt_long</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Current Balance</p>
        <h2 className="text-4xl font-black font-headline text-[#CCFF00] tracking-tighter mb-4">
          ${balance.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
        </h2>
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-400">Next Payment</span>
            <span className="text-sm font-bold">
              {nextDue ? formatDate(nextDue.due_date!) : '—'}
            </span>
          </div>
          <div className="w-px h-8 bg-gray-800" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-400">Status</span>
            <span className={`text-sm font-bold ${isAllClear ? 'text-[#CCFF00]' : 'text-orange-500'}`}>
              {isAllClear ? 'ALL CLEAR' : 'BALANCE DUE'}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline font-bold text-lg uppercase tracking-tight">Transaction History</h3>
        <span className="material-symbols-outlined text-gray-600">filter_list</span>
      </div>

      {!payments?.length ? (
        <p className="text-on-surface-variant text-sm">No transactions found.</p>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => {
            const isPaid = payment.status === 'paid'
            return (
              <div
                key={payment.id}
                className={
                  isPaid
                    ? 'bg-[#121212] border border-[#212121] rounded-lg p-4 flex items-center justify-between hover:border-[#CCFF00]/30 transition-colors'
                    : 'bg-[#212121] border border-[#CCFF00]/50 rounded-lg p-4 flex items-center justify-between shadow-[0_0_15px_rgba(204,255,0,0.1)]'
                }
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-full bg-[#212121] flex items-center justify-center ${isPaid ? 'text-[#CCFF00]' : 'text-orange-400'}`}
                  >
                    <span className="material-symbols-outlined">calendar_today</span>
                  </div>
                  <div>
                    <p className="font-bold text-white leading-tight">{payment.concept}</p>
                    <p
                      className={`text-xs uppercase font-semibold ${isPaid ? 'text-gray-500' : 'text-[#CCFF00]'}`}
                    >
                      {payment.payment_date ? formatDate(payment.payment_date) : ''}
                      {!isPaid && ' • Pending Authorization'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black font-headline ${isPaid ? 'text-[#CCFF00]' : 'text-white'}`}>
                    ${payment.amount?.toLocaleString('es-MX') ?? '—'}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-[#CCFF00]' : 'bg-orange-500'}`}
                    />
                    <span
                      className={`text-[9px] font-black uppercase ${isPaid ? 'text-[#CCFF00]' : 'text-orange-500'}`}
                    >
                      {isPaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Download PDF button (disabled placeholder) */}
      <button
        disabled
        className="w-full mt-8 mb-8 bg-white text-black py-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-tighter opacity-50 cursor-not-allowed"
      >
        <span className="material-symbols-outlined">file_download</span>
        Download Full Statement (PDF)
      </button>
    </main>
  )
}
