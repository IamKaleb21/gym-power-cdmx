export type PaymentMetricRow = {
  amount: number
  status: string
  payment_date: string | null
}

/** Suma los adeudos pendientes del miembro */
export function getMemberBalance(payments: PaymentMetricRow[]): number {
  return payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)
}

/**
 * Suma los pagos `paid` cuyo `payment_date` cae en el mes dado (prefijo YYYY-MM).
 */
export function getMonthlyRevenue(payments: PaymentMetricRow[], month: string): number {
  return payments
    .filter((p) => p.status === 'paid' && (p.payment_date?.startsWith(month) ?? false))
    .reduce((sum, p) => sum + p.amount, 0)
}

/** Formato compacto tipo stitch ($142.8K) para montos grandes en MXN */
export function formatMrrDisplay(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`
  }
  return `$${amount.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
}
