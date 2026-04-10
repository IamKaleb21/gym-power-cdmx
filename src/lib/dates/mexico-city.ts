const MX_TZ = 'America/Mexico_City'

/** Fecha civil de hoy en Ciudad de México (YYYY-MM-DD). */
export function getTodayMexicoDateString(now: Date = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: MX_TZ })
}

/**
 * Suma meses calendario a una fecha civil YYYY-MM-DD (sin zona horaria del servidor).
 * Útil para ventanas 3M / 6M / 12M alineadas con el calendario de CDMX.
 */
export function addCalendarMonthsToIsoDate(iso: string, deltaMonths: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) {
    throw new Error(`Invalid date string: ${iso}`)
  }
  const total = y * 12 + (m - 1) + deltaMonths
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  const dim = new Date(Date.UTC(ny, nm, 0)).getUTCDate()
  const nd = Math.min(d, dim)
  return `${ny}-${String(nm).padStart(2, '0')}-${String(nd).padStart(2, '0')}`
}

export type AdminAnalyticsRange = '3m' | '6m' | '12m'

/** Rango [startDate, endDate] inclusive para métricas admin; ambos en calendario CDMX. */
export function getAdminAnalyticsRangeDates(
  range: AdminAnalyticsRange,
  now: Date = new Date(),
): { startDate: string; endDate: string } {
  const endDate = getTodayMexicoDateString(now)
  const delta = range === '3m' ? -3 : range === '6m' ? -6 : -12
  const startDate = addCalendarMonthsToIsoDate(endDate, delta)
  return { startDate, endDate }
}

/**
 * Mexico City no longer observes DST (since 2022); offset is UTC−6 year-round.
 * Returns [start, end) UTC ISO bounds for the calendar day `YYYY-MM-DD` in CDMX.
 */
export function getMexicoCityDayRangeUTC(dateStr: string): { start: string; end: string } {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) {
    throw new Error(`Invalid date string: ${dateStr}`)
  }
  const start = new Date(Date.UTC(y, m - 1, d, 6, 0, 0))
  const end = new Date(Date.UTC(y, m - 1, d + 1, 6, 0, 0))
  return { start: start.toISOString(), end: end.toISOString() }
}
