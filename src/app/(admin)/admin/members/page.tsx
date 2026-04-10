import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getMemberStatus } from '@/lib/members/status'
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge'

export default async function MembersPage() {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: members } = await (supabase as any)
    .from('profiles')
    .select(`
      id, full_name, email, phone, avatar_url, created_at,
      member_memberships (
        end_date,
        membership_plans ( name )
      )
    `)
    .eq('role', 'member')
    .order('created_at', { ascending: false })

  const membersWithStatus = ((members as any[]) ?? []).map((m: any) => {
    const sortedMemberships = [...(m.member_memberships ?? [])].sort(
      (a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime(),
    )
    const latestMembership = sortedMemberships[0]
    const status = latestMembership
      ? getMemberStatus(latestMembership.end_date)
      : ('expired' as const)
    return { ...m, status, latestMembership }
  })

  const totalActive = membersWithStatus.filter((m) => m.status === 'active').length
  const totalExpiringSoon = membersWithStatus.filter((m) => m.status === 'expiring_soon').length

  return (
    <div className="w-full min-w-0 px-4 py-8 lg:px-10 xl:px-12 2xl:px-14">
      {/* Header Section */}
      <section className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter uppercase leading-none mb-2">
              Miembros<span className="text-[#cafd00]">.</span>
            </h1>
            <div className="flex items-center gap-4 text-white/50 text-sm">
              <span className="flex items-center gap-1">
                <b className="text-white">{totalActive}</b> activos
              </span>
              <span className="w-1 h-1 bg-white/20 rounded-full" />
              <span className="flex items-center gap-1">
                <b className="text-[#ff7351]">{totalExpiringSoon}</b> por vencer
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="bg-[#262626] text-white px-6 py-3 font-headline font-bold rounded-lg flex items-center gap-2 hover:bg-[#484847] transition-colors">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filtros
            </button>
            <Link
              href="/admin/members/new"
              className="bg-[#cafd00] text-[#516700] px-8 py-3 font-headline font-black rounded-lg flex items-center gap-2 hover:bg-[#f3ffca] transition-colors shadow-[0_0_20px_rgba(202,253,0,0.3)]"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Registrar miembro
            </Link>
          </div>
        </div>
      </section>

      {/* Table Container */}
      <div className="grid grid-cols-1 gap-1 overflow-x-auto min-w-0">
        {/* Table Header */}
        <div className="bg-[#131313] px-8 py-4 rounded-t-xl hidden md:grid grid-cols-12 items-center text-[10px] uppercase tracking-widest font-black text-white/40">
          <div className="col-span-4">Miembro</div>
          <div className="col-span-2 text-center">Estado</div>
          <div className="col-span-3">Plan</div>
          <div className="col-span-2">Contacto</div>
          <div className="col-span-1 text-right">Acciones</div>
        </div>

        {/* Member Rows */}
        <div className="space-y-1">
          {membersWithStatus.length === 0 ? (
            <div className="bg-[#1a1a1a] px-8 py-12 text-center text-white/40 text-sm font-headline uppercase tracking-widest">
              No hay miembros
            </div>
          ) : (
            membersWithStatus.map((member, index) => {
              const isEven = index % 2 === 0
              const planName = member.latestMembership?.membership_plans?.name
              const endDate = member.latestMembership?.end_date
              const formattedEndDate = endDate
                ? new Date(endDate).toLocaleDateString('es-MX', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : null

              return (
                <div
                  key={member.id}
                  className={`${isEven ? 'bg-[#1a1a1a]' : 'bg-[#131313]'} group hover:bg-[#262626] transition-colors px-6 lg:px-8 py-6 md:grid md:grid-cols-12 items-center flex flex-col gap-4`}
                >
                  {/* Member Identity */}
                  <div className="col-span-4 flex items-center gap-4 w-full min-w-0">
                    <div className="relative flex-shrink-0">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.full_name ?? 'Miembro'}
                          className="w-14 h-14 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-[#262626] flex items-center justify-center grayscale group-hover:grayscale-0 transition-all duration-500">
                          <span className="material-symbols-outlined text-white/40 text-2xl">person</span>
                        </div>
                      )}
                      {member.status === 'active' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#cafd00] rounded-full border-4 border-[#0e0e0e]" />
                      )}
                      {member.status === 'expiring_soon' && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#fce047] rounded-full border-4 border-[#0e0e0e]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-headline font-black text-lg leading-tight uppercase truncate">
                        {member.full_name ?? '—'}
                      </h3>
                      <p className="text-xs text-white/40 truncate">{member.email}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-2 flex justify-center w-full">
                    <MemberStatusBadge status={member.status} />
                  </div>

                  {/* Plan Type */}
                  <div className="col-span-3 w-full min-w-0">
                    {planName ? (
                      <>
                        <p
                          className={`text-sm font-bold font-headline uppercase tracking-tight truncate ${
                            member.status === 'expired' ? 'text-white/40 line-through' : ''
                          }`}
                        >
                          {planName}
                        </p>
                        {formattedEndDate && (
                          <p
                            className={`text-[10px] uppercase font-bold ${
                              member.status === 'expired'
                                ? 'text-[#ff7351]'
                                : member.status === 'expiring_soon'
                                  ? 'text-[#fce047] italic'
                                  : 'text-white/40'
                            }`}
                          >
                            {member.status === 'expired'
                              ? `Venció ${formattedEndDate}`
                              : member.status === 'expiring_soon'
                                ? `Vence ${formattedEndDate}`
                                : `Renueva ${formattedEndDate}`}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-white/30 font-headline uppercase tracking-tight">Sin plan</p>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="col-span-2 w-full min-w-0 text-white/40 font-mono text-sm truncate">
                    {member.phone ?? '—'}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end gap-3 w-full">
                    <Link
                      href={`/admin/members/${member.id}`}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center p-2 hover:bg-[#cafd00] hover:text-[#516700] rounded-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#1a1a1a] py-4 px-8 rounded-b-xl flex justify-between items-center">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            {membersWithStatus.length}{' '}
            {membersWithStatus.length !== 1 ? 'miembros' : 'miembro'}
          </span>
        </div>
      </div>
    </div>
  )
}
