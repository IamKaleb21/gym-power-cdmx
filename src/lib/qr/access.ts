export type AccessStatus =
  | { status: 'granted' }
  | { status: 'denied'; denyReason: string }

export function getAccessStatus({
  endDate,
  pendingBalance,
  today,
}: {
  endDate: string | null
  pendingBalance: number
  today: string
}): AccessStatus {
  if (!endDate) {
    return { status: 'denied', denyReason: 'Sin membresía registrada' }
  }
  if (endDate < today) {
    return { status: 'denied', denyReason: 'Membresía vencida' }
  }
  if (pendingBalance > 0) {
    return {
      status: 'denied',
      denyReason: `Adeudo pendiente: $${pendingBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
    }
  }
  return { status: 'granted' }
}
