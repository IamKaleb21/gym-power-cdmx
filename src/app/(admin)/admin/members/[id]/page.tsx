import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { getMemberBalance } from '@/lib/payments/utils'
import { getMemberStatus } from '@/lib/members/status'
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge'
import { AvatarUpload } from './AvatarUpload'
import { EditMemberForm } from './EditMemberForm'

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: member, error } = await (supabase as any)
    .from('profiles')
    .select(`
      id, full_name, email, phone, avatar_url, created_at,
      member_memberships (
        id, start_date, end_date,
        membership_plans ( name, price )
      ),
      payments!payments_member_id_fkey ( id, amount, concept, status, payment_date, created_at )
    `)
    .eq('id', id)
    .eq('role', 'member')
    .maybeSingle()

  if (error) {
    throw new Error(`Error loading member detail: ${error.message}`)
  }
  if (!member) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const memberships = [...(member.member_memberships ?? [])].sort(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
  )
  const latestMembership = memberships[0]
  const status = latestMembership ? getMemberStatus(latestMembership.end_date) : 'expired'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payments = [...(member.payments ?? [])].sort(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const pendingBalance = getMemberBalance(
    payments.map((p: { amount: unknown; status: string; payment_date: string | null }) => ({
      amount: Number(p.amount),
      status: p.status,
      payment_date: p.payment_date,
    })),
  )

  return (
    <div className="px-4 lg:px-12 py-8 max-w-5xl space-y-10">
      {/* Header */}
      <div className="flex items-start gap-6">
        <AvatarUpload memberId={member.id} currentUrl={member.avatar_url} />
        <div className="flex flex-col gap-2 justify-center">
          <h1 className="text-4xl font-headline font-black uppercase text-white leading-none">
            {member.full_name}
          </h1>
          <div className="flex items-center gap-3">
            <MemberStatusBadge status={status} />
            <span className="text-white/40 text-sm">{member.email}</span>
          </div>
        </div>
      </div>

      {/* Perfil */}
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-white/40 font-headline mb-4">
          Perfil
        </h2>
        <EditMemberForm
          memberId={member.id}
          initialData={{
            full_name: member.full_name ?? '',
            phone: member.phone ?? '',
          }}
        />
      </section>

      {/* Membresía */}
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-white/40 font-headline mb-4">
          Membresía
        </h2>
        {memberships.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl p-6 text-white/30 text-sm">
            Sin membresías registradas.
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-xl divide-y divide-white/5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {memberships.map((m: any) => {
              const mStatus = getMemberStatus(m.end_date)
              return (
                <div key={m.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-white text-sm font-semibold">
                      {m.membership_plans?.name ?? '—'}
                    </p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {m.start_date} → {m.end_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {m.membership_plans?.price != null && (
                      <span className="text-white/60 text-sm">
                        ${Number(m.membership_plans.price).toLocaleString('es-MX')}
                      </span>
                    )}
                    <MemberStatusBadge status={mStatus} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Pagos */}
      <section>
        <h2 className="text-xs font-black uppercase tracking-widest text-white/40 font-headline mb-4">
          Pagos
        </h2>
        {pendingBalance > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-error/10 border border-error/30 rounded-lg">
            <span className="material-symbols-outlined text-error text-sm">warning</span>
            <span className="text-error text-sm font-bold">
              Adeudo pendiente:{' '}
              {pendingBalance.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
            </span>
          </div>
        )}
        {payments.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl p-6 text-white/30 text-sm">
            Sin pagos registrados.
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-xl divide-y divide-white/5">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-white text-sm font-semibold">{p.concept ?? '—'}</p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {p.payment_date ?? p.created_at?.slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white text-sm font-semibold">
                    ${Number(p.amount).toLocaleString('es-MX')}
                  </span>
                  <span
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-sm ${
                      p.status === 'paid'
                        ? 'bg-[#cafd00]/10 text-[#cafd00] border border-[#cafd00]/20'
                        : p.status === 'pending'
                          ? 'bg-error/10 text-error border border-error/20'
                          : 'bg-white/10 text-white/60 border border-white/10'
                    }`}
                  >
                    {p.status === 'paid' ? 'Pagado' : p.status === 'pending' ? 'Pendiente' : p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
