import type { MemberStatus } from '@/lib/members/status'

const config: Record<MemberStatus, { label: string; className: string }> = {
  active: {
    label: 'Activo',
    className: 'bg-[#cafd00]/10 text-[#cafd00] border border-[#cafd00]/20',
  },
  expiring_soon: {
    label: 'Por vencer',
    className: 'bg-[#fce047]/10 text-[#fce047] border border-[#fce047]/20',
  },
  expired: {
    label: 'Vencido',
    className: 'bg-[#ff7351]/10 text-[#ff7351] border border-[#ff7351]/20',
  },
}

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-sm ${className}`}>
      {label}
    </span>
  )
}
