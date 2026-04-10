export type MembershipRow = {
  member_id: string
  start_date: string
  end_date: string
}

export type MonthlyPoint = {
  month: string
  new: number
  active: number
  /** Membresías que terminan en ese mes (baja), antes de `today`. */
  churn: number
}

export type RetentionMetrics = {
  activeCount: number
  newCount: number
  churnCount: number
  retentionRate: number
  monthlySeries: MonthlyPoint[]
}

/** Valores intermedios para auditoría / scripts (misma lógica que el dashboard). */
export type RetentionBreakdown = RetentionMetrics & {
  startDate: string
  endDate: string
  today: string
  activeAtStart: number
  activeAtEnd: number
  newMembershipsActiveAtEnd: number
  /** Miembros activos al cierre que ya estaban antes del inicio del rango (cohorte retenida). */
  retainedCount: number
}

function day(s: string): string {
  return s.slice(0, 10)
}

function betweenInclusive(dateStr: string, start: string, end: string): boolean {
  const d = day(dateStr)
  return d >= start && d <= end
}

function lastDayOfCalendarMonth(y: number, m1to12: number): string {
  const last = new Date(Date.UTC(y, m1to12, 0)).getUTCDate()
  return `${y}-${String(m1to12).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}

function monthLabelUTC(y: number, m1to12: number): string {
  return new Date(Date.UTC(y, m1to12 - 1, 15)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Itera YYYY-MM desde startDate hasta endDate (inclusive por mes calendario). */
function* eachMonthInRange(startDate: string, endDate: string): Generator<{ y: number; m: number }> {
  const ys = Number(startDate.slice(0, 4))
  const ms = Number(startDate.slice(5, 7))
  const ye = Number(endDate.slice(0, 4))
  const me = Number(endDate.slice(5, 7))
  let y = ys
  let m = ms
  while (y < ye || (y === ye && m <= me)) {
    yield { y, m }
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
}

/**
 * Retención de la cohorte inicial: ((members_end - nuevas_que_siguen_activas) / members_start) * 100
 *
 * `newMembersStillActiveAtEnd` = altas con inicio en el período que siguen cubriendo el último día
 * del rango (no confundir con el total de altas del período: muchas ya dieron de baja y no están en members_end).
 *
 * Retorna 0 si members_start === 0 o si no hay retención positiva.
 */
export function calculateRetentionRate(
  membersStart: number,
  newMembersStillActiveAtEnd: number,
  membersEnd: number,
): number {
  if (membersStart === 0) return 0
  const retained = membersEnd - newMembersStillActiveAtEnd
  if (retained <= 0) return 0
  return (retained / membersStart) * 100
}

/**
 * Desglose completo de retención (misma lógica que `getRetentionMetrics`).
 * `today` opcional para tests (YYYY-MM-DD CDMX).
 */
export function getRetentionBreakdown(
  memberships: MembershipRow[],
  startDate: string,
  endDate: string,
  today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }),
): RetentionBreakdown {
  const start = day(startDate)
  const end = day(endDate)

  const newCount = memberships.filter((m) => betweenInclusive(m.start_date, start, end)).length

  const activeAtStart = memberships.filter((m) => {
    const s = day(m.start_date)
    const e = day(m.end_date)
    return s <= start && e >= start
  }).length

  const activeAtEnd = memberships.filter((m) => {
    const s = day(m.start_date)
    const e = day(m.end_date)
    return s <= end && e >= end
  }).length

  const newMembershipsActiveAtEnd = memberships.filter((m) => {
    const s = day(m.start_date)
    const e = day(m.end_date)
    return betweenInclusive(s, start, end) && e >= end
  }).length

  const churnCount = memberships.filter((m) => {
    const e = day(m.end_date)
    return e >= start && e <= end && e < today
  }).length

  const retainedCount = activeAtEnd - newMembershipsActiveAtEnd
  const retentionRate = calculateRetentionRate(activeAtStart, newMembershipsActiveAtEnd, activeAtEnd)

  const monthlySeries: MonthlyPoint[] = []
  for (const { y, m } of eachMonthInRange(start, end)) {
    const monthStart = `${y}-${String(m).padStart(2, '0')}-01`
    const monthEnd = lastDayOfCalendarMonth(y, m)

    const monthNew = memberships.filter((row) => betweenInclusive(row.start_date, monthStart, monthEnd)).length

    const monthActive = memberships.filter((row) => {
      const s = day(row.start_date)
      const e = day(row.end_date)
      return s <= monthEnd && e >= monthStart
    }).length

    const monthChurn = memberships.filter((row) => {
      const e = day(row.end_date)
      return e >= monthStart && e <= monthEnd && e < today
    }).length

    monthlySeries.push({
      month: monthLabelUTC(y, m),
      new: monthNew,
      active: monthActive,
      churn: monthChurn,
    })
  }

  return {
    startDate: start,
    endDate: end,
    today,
    activeAtStart,
    activeAtEnd,
    newMembershipsActiveAtEnd,
    retainedCount,
    activeCount: activeAtEnd,
    newCount,
    churnCount,
    retentionRate,
    monthlySeries,
  }
}

/**
 * Métricas de retención para rango [startDate, endDate] (YYYY-MM-DD, comparación lexicográfica).
 * `today` opcional para tests (YYYY-MM-DD).
 */
export function getRetentionMetrics(
  memberships: MembershipRow[],
  startDate: string,
  endDate: string,
  today?: string,
): RetentionMetrics {
  const b = getRetentionBreakdown(memberships, startDate, endDate, today)
  return {
    activeCount: b.activeCount,
    newCount: b.newCount,
    churnCount: b.churnCount,
    retentionRate: b.retentionRate,
    monthlySeries: b.monthlySeries,
  }
}

export type PaymentRow = {
  amount: number
  status: string
  payment_date: string | null
  created_at: string
}

export type RevenueMonthPoint = { month: string; revenue: number }

export function getPaymentAnalytics(
  payments: PaymentRow[],
  startDate: string,
  endDate: string,
): {
  monthlyRevenue: RevenueMonthPoint[]
  totalPaidInRange: number
  pendingTotal: number
  pendingCount: number
} {
  const start = day(startDate)
  const end = day(endDate)

  function effectivePaidDate(p: PaymentRow): string | null {
    if (p.status !== 'paid') return null
    if (p.payment_date) return day(p.payment_date)
    return day(p.created_at)
  }

  const pendingRows = payments.filter((p) => p.status === 'pending')
  const pendingTotal = Math.round(pendingRows.reduce((s, p) => s + Number(p.amount), 0) * 100) / 100
  const pendingCount = pendingRows.length

  let totalPaidInRange = 0
  for (const p of payments) {
    const d = effectivePaidDate(p)
    if (!d) continue
    if (d >= start && d <= end) totalPaidInRange += Number(p.amount)
  }
  totalPaidInRange = Math.round(totalPaidInRange * 100) / 100

  const monthlyRevenue: RevenueMonthPoint[] = []
  for (const { y, m } of eachMonthInRange(start, end)) {
    const monthStart = `${y}-${String(m).padStart(2, '0')}-01`
    const monthEnd = lastDayOfCalendarMonth(y, m)
    let rev = 0
    for (const p of payments) {
      const d = effectivePaidDate(p)
      if (!d) continue
      if (betweenInclusive(d, monthStart, monthEnd)) rev += Number(p.amount)
    }
    monthlyRevenue.push({
      month: monthLabelUTC(y, m),
      revenue: Math.round(rev * 100) / 100,
    })
  }

  return { monthlyRevenue, totalPaidInRange, pendingTotal, pendingCount }
}
