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
