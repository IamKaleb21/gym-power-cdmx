'use client'

import type { MemberQRProfile, ValidateQRResult } from '@/app/actions/qr'

const MX = 'America/Mexico_City'

function formatEndDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: MX,
  })
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase()
}

type PanelProps = {
  loading: boolean
  lastResult: ValidateQRResult | null
  onRefresh: () => void
}

export function MemberResultPanel({ loading, lastResult, onRefresh }: PanelProps) {
  return (
    <section className="w-full lg:w-[420px] shrink-0 bg-[#131313] flex flex-col border-t lg:border-t-0 lg:border-l border-[#484847]/30 shadow-2xl z-20 min-h-[320px] lg:min-h-0 lg:max-h-[calc(100dvh-8rem)]">
      <div className="p-6 lg:p-8 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-white/60">
            <span className="material-symbols-outlined text-5xl animate-pulse text-[#cafd00]">
              hourglass_empty
            </span>
            <p className="font-headline text-sm uppercase tracking-widest">Validando…</p>
          </div>
        ) : !lastResult ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4 text-center text-white/50">
            <span className="material-symbols-outlined text-6xl text-[#cafd00]/30">qr_code_scanner</span>
            <p className="font-body text-sm max-w-[240px]">
              Escanea el código del miembro o ingresa el ID manualmente.
            </p>
          </div>
        ) : lastResult.ok === false ? (
          <ErrorState error={lastResult.error} onRetry={onRefresh} />
        ) : (
          <MemberCard member={lastResult.member} />
        )}
      </div>

      <div className="p-6 lg:p-8 pt-0 mt-auto grid grid-cols-2 gap-4 border-t border-[#484847]/20">
        <button
          type="button"
          className="py-4 border border-[#484847]/40 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#262626] transition-all font-headline"
        >
          Denegar acceso
        </button>
        <button
          type="button"
          className="py-4 bg-[#cafd00] text-[#516700] text-[10px] font-bold uppercase tracking-widest hover:bg-[#f3ffca] transition-all font-headline"
        >
          Permitir acceso
        </button>
      </div>
    </section>
  )
}

function ErrorState({
  error,
  onRetry,
}: {
  error: 'not_found' | 'invalid_id' | 'server_error'
  onRetry: () => void
}) {
  const copy =
    error === 'not_found'
      ? { title: 'No encontrado', body: 'No hay un miembro con ese ID.' }
      : error === 'invalid_id'
        ? { title: 'ID no válido', body: 'El código no es un UUID de miembro válido.' }
        : { title: 'Error al validar', body: 'No se pudo completar la validación. Intenta de nuevo.' }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-[#262626] p-6 border-l-4 border-[#ff7351]">
        <p className="font-headline text-xl font-black uppercase text-[#ff7351]">{copy.title}</p>
        <p className="mt-2 text-sm text-white/70 font-body">{copy.body}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="w-full py-3 bg-[#1a1a1a] border border-[#484847]/40 text-[#cafd00] text-xs font-headline font-bold uppercase tracking-widest hover:bg-[#262626]"
      >
        Escanear de nuevo
      </button>
    </div>
  )
}

function MemberCard({ member }: { member: MemberQRProfile }) {
  const granted = member.accessStatus === 'granted'

  return (
    <div className="space-y-6">
      <div className="relative mb-8">
        <span className="absolute -top-4 -left-1 text-7xl font-black text-[#262626] font-headline select-none uppercase">
          Miembro
        </span>
        <div className="relative z-10 mt-8">
          <div className="w-40 h-40 bg-[#262626] rounded-lg overflow-hidden border-2 border-[#cafd00]/20 mx-auto lg:mx-0">
            {member.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.avatar_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-headline font-black text-[#cafd00]/60">
                {initials(member.full_name)}
              </div>
            )}
          </div>
          <div className="mt-4 text-center lg:text-left">
            <h3 className="font-headline text-3xl font-black text-white uppercase leading-tight tracking-tight">
              {member.full_name}
            </h3>
            <p className="mt-2 text-xs text-white/50 font-mono break-all">ID: {member.id}</p>
            <p className="mt-1 text-xs text-white/40 truncate">{member.email}</p>
          </div>
        </div>
      </div>

      <div
        className={`p-5 rounded-lg flex items-center justify-between relative overflow-hidden ${
          granted ? 'bg-[#262626]' : 'bg-[#262626] border border-[#ff7351]/40'
        }`}
      >
        <div className="absolute inset-y-0 left-0 w-1 bg-[#cafd00]" aria-hidden />
        <div className="pl-2">
          <p className="text-[10px] font-body text-white/50 uppercase tracking-widest mb-1">Acceso</p>
          <p
            className={`text-xl font-headline font-bold uppercase ${
              granted ? 'text-[#cafd00]' : 'text-[#ff7351]'
            }`}
          >
            {granted ? 'Permitido' : 'Denegado'}
          </p>
          {!granted && member.denyReason ? (
            <p className="mt-2 text-sm text-white/70 font-body">{member.denyReason}</p>
          ) : null}
        </div>
        <span
          className={`material-symbols-outlined text-4xl opacity-20 ${
            granted ? 'text-[#cafd00]' : 'text-[#ff7351]'
          }`}
        >
          {granted ? 'verified_user' : 'block'}
        </span>
      </div>

      <div className="p-5 bg-[#262626] rounded-lg flex items-center justify-between">
        <div>
          <p className="text-[10px] font-body text-white/50 uppercase tracking-widest mb-1">Adeudo</p>
          <p className="text-xl font-headline font-bold text-white tracking-tight">
            ${member.pendingBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a1a1a]">
          <span className="material-symbols-outlined text-[#cafd00]">
            {member.pendingBalance > 0 ? 'warning' : 'check_circle'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-[#1a1a1a] rounded-lg">
          <p className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Membresía hasta</p>
          <p className="text-lg font-headline font-bold text-white">{formatEndDate(member.membershipEndDate)}</p>
        </div>
      </div>
    </div>
  )
}
