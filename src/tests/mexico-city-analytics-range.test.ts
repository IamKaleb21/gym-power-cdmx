import { describe, expect, it } from 'vitest'
import {
  addCalendarMonthsToIsoDate,
  getAdminAnalyticsRangeDates,
} from '@/lib/dates/mexico-city'

describe('addCalendarMonthsToIsoDate', () => {
  it('resta 12 meses alineado al día civil (12M)', () => {
    expect(addCalendarMonthsToIsoDate('2026-04-10', -12)).toBe('2025-04-10')
  })

  it('ajusta fin de mes (31 mar → 28/29 feb)', () => {
    expect(addCalendarMonthsToIsoDate('2025-03-31', -1)).toBe('2025-02-28')
  })

  it('resta 3 y 6 meses', () => {
    expect(addCalendarMonthsToIsoDate('2026-04-10', -3)).toBe('2026-01-10')
    expect(addCalendarMonthsToIsoDate('2026-04-10', -6)).toBe('2025-10-10')
  })
})

describe('getAdminAnalyticsRangeDates', () => {
  it('usa calendario CDMX: fin = hoy MX, 12M = hoy − 12 meses', () => {
    const fixed = new Date('2026-04-10T18:00:00.000Z')
    const { startDate, endDate } = getAdminAnalyticsRangeDates('12m', fixed)
    expect(endDate).toBe('2026-04-10')
    expect(startDate).toBe('2025-04-10')
  })
})
