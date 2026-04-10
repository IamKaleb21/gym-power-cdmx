export type MembershipRow = {
  member_id: string
  start_date: string
  end_date: string
}

export type MonthlyPoint = {
  month: string
  new: number
  active: number
}

export type RetentionMetrics = {
  activeCount: number
  newCount: number
  churnCount: number
  retentionRate: number
  monthlySeries: MonthlyPoint[]
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
 * ((members_end - new_members) / members_start) * 100
 * Retorna 0 si members_start === 0 o si no hay retención positiva.
 */
export function calculateRetentionRate(
  membersStart: number,
  newMembers: number,
  membersEnd: number,
): number {
  if (membersStart === 0) return 0
  const retained = membersEnd - newMembers
  if (retained <= 0) return 0
  return (retained / membersStart) * 100
}

/**
 * Métricas de retención para rango [startDate, endDate] (YYYY-MM-DD, comparación lexicográfica).
 * `today` opcional para tests (YYYY-MM-DD).
 */
export function getRetentionMetrics(
  memberships: MembershipRow[],
  startDate: string,
  endDate: string,
  today: string = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }),
): RetentionMetrics {
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

  const churnCount = memberships.filter((m) => {
    const e = day(m.end_date)
    return e >= start && e <= end && e < today
  }).length

  const retentionRate = calculateRetentionRate(activeAtStart, newCount, activeAtEnd)

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

    monthlySeries.push({
      month: monthLabelUTC(y, m),
      new: monthNew,
      active: monthActive,
    })
  }

  return {
    activeCount: activeAtEnd,
    newCount,
    churnCount,
    retentionRate,
    monthlySeries,
  }
}
