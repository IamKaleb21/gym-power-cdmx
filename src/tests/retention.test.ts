import { describe, it, expect } from 'vitest'
import {
  calculateRetentionRate,
  getPaymentAnalytics,
  getRetentionMetrics,
} from '@/lib/analytics/utils'

type Membership = { member_id: string; start_date: string; end_date: string }

describe('calculateRetentionRate', () => {
  it('calcula correctamente la tasa de retención', () => {
    expect(calculateRetentionRate(10, 3, 12)).toBeCloseTo(90)
  })

  it('retorna 0 si members_start es 0 (evitar división por cero)', () => {
    expect(calculateRetentionRate(0, 5, 5)).toBe(0)
  })

  it('retorna 0 si todos los miembros iniciales se fueron y no hay nuevos', () => {
    expect(calculateRetentionRate(10, 0, 0)).toBe(0)
  })
})

describe('getRetentionMetrics', () => {
  const memberships: Membership[] = [
    { member_id: 'a', start_date: '2026-01-01', end_date: '2026-03-31' },
    { member_id: 'b', start_date: '2026-01-01', end_date: '2026-06-30' },
    { member_id: 'c', start_date: '2026-02-01', end_date: '2026-04-30' },
    { member_id: 'd', start_date: '2026-03-01', end_date: '2026-05-31' },
    { member_id: 'e', start_date: '2026-03-15', end_date: '2026-09-15' },
  ]

  it('filtra por rango de fechas correctamente', () => {
    const result = getRetentionMetrics(memberships, '2026-01-01', '2026-03-31', '2026-12-31')
    expect(result.newCount).toBe(5)
  })

  it('cuenta nuevas altas dentro del período', () => {
    const result = getRetentionMetrics(memberships, '2026-03-01', '2026-03-31', '2026-12-31')
    expect(result.newCount).toBe(2)
  })

  it('genera monthlySeries con una entrada por mes en el rango', () => {
    const result = getRetentionMetrics(memberships, '2026-01-01', '2026-03-31', '2026-12-31')
    expect(result.monthlySeries.length).toBe(3)
    expect(result.monthlySeries[0].month).toBe('Jan 2026')
    expect(result.monthlySeries[2].month).toBe('Mar 2026')
  })

  it('retención: solo resta altas del período que siguen activas al cierre (no todas las altas)', () => {
    const rows: Membership[] = [
      { member_id: 'old', start_date: '2025-01-01', end_date: '2026-12-31' },
      { member_id: 'churn', start_date: '2026-02-01', end_date: '2026-03-15' },
    ]
    const result = getRetentionMetrics(rows, '2026-01-01', '2026-06-30', '2026-12-31')
    expect(result.newCount).toBe(1)
    expect(result.activeCount).toBe(1)
    expect(result.retentionRate).toBeCloseTo(100)
  })
})

describe('getPaymentAnalytics', () => {
  it('suma ingresos pagados por mes y totales del rango', () => {
    const payments = [
      {
        amount: 1000,
        status: 'paid',
        payment_date: '2026-02-15',
        created_at: '2026-02-15T12:00:00Z',
      },
      {
        amount: 500,
        status: 'paid',
        payment_date: null,
        created_at: '2026-03-10T10:00:00Z',
      },
      { amount: 200, status: 'pending', payment_date: null, created_at: '2026-03-01T10:00:00Z' },
    ]
    const r = getPaymentAnalytics(payments, '2026-02-01', '2026-03-31')
    expect(r.totalPaidInRange).toBe(1500)
    expect(r.pendingCount).toBe(1)
    expect(r.pendingTotal).toBe(200)
    const feb = r.monthlyRevenue.find((m) => m.month.startsWith('Feb'))
    const mar = r.monthlyRevenue.find((m) => m.month.startsWith('Mar'))
    expect(feb?.revenue).toBe(1000)
    expect(mar?.revenue).toBe(500)
  })
})
