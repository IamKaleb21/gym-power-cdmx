import { describe, it, expect } from 'vitest'
import { getAccessStatus } from '@/lib/qr/access'

describe('getAccessStatus', () => {
  const today = '2026-04-10'

  it('retorna granted si membresía activa y sin adeudo', () => {
    const result = getAccessStatus({ endDate: '2026-05-10', pendingBalance: 0, today })
    expect(result.status).toBe('granted')
  })

  it('retorna denied si membresía vencida', () => {
    const result = getAccessStatus({ endDate: '2026-03-01', pendingBalance: 0, today })
    expect(result.status).toBe('denied')
    expect(result.denyReason).toMatch(/vencida/i)
  })

  it('retorna denied si hay adeudo pendiente', () => {
    const result = getAccessStatus({ endDate: '2026-05-10', pendingBalance: 799, today })
    expect(result.status).toBe('denied')
    expect(result.denyReason).toMatch(/adeudo/i)
  })

  it('retorna denied si no hay membresía (endDate null)', () => {
    const result = getAccessStatus({ endDate: null, pendingBalance: 0, today })
    expect(result.status).toBe('denied')
    expect(result.denyReason).toMatch(/membresía/i)
  })

  it('retorna denied si vencida Y hay adeudo (prioridad: vencida)', () => {
    const result = getAccessStatus({ endDate: '2026-01-01', pendingBalance: 500, today })
    expect(result.status).toBe('denied')
    expect(result.denyReason).toMatch(/vencida/i)
  })
})
