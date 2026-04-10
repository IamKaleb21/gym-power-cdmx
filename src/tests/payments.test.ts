import { describe, it, expect } from 'vitest'
import { registerPaymentSchema } from '@/lib/validations/payment.schema'
import { getMemberBalance, getMonthlyRevenue, formatMrrDisplay } from '@/lib/payments/utils'

type Payment = { amount: number; status: string; payment_date: string | null }

describe('registerPaymentSchema', () => {
  it('rechaza amount <= 0', () => {
    const result = registerPaymentSchema.safeParse({
      member_id: '550e8400-e29b-41d4-a716-446655440001',
      amount: 0,
      concept: 'Mensualidad',
      status: 'paid',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza concept vacío', () => {
    const result = registerPaymentSchema.safeParse({
      member_id: '550e8400-e29b-41d4-a716-446655440001',
      amount: 500,
      concept: '',
      status: 'paid',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza status pending sin due_date', () => {
    const result = registerPaymentSchema.safeParse({
      member_id: '550e8400-e29b-41d4-a716-446655440001',
      amount: 500,
      concept: 'Mensualidad',
      status: 'pending',
    })
    expect(result.success).toBe(false)
  })

  it('acepta status pending con due_date', () => {
    const result = registerPaymentSchema.safeParse({
      member_id: '550e8400-e29b-41d4-a716-446655440001',
      amount: 500,
      concept: 'Mensualidad',
      status: 'pending',
      due_date: '2026-05-01',
    })
    expect(result.success).toBe(true)
  })

  it('acepta datos válidos sin due_date cuando status es paid', () => {
    const result = registerPaymentSchema.safeParse({
      member_id: '550e8400-e29b-41d4-a716-446655440001',
      amount: 599,
      concept: 'Mensualidad Abril',
      status: 'paid',
    })
    expect(result.success).toBe(true)
  })
})

describe('getMemberBalance', () => {
  it('suma correctamente adeudos pendientes', () => {
    const payments: Payment[] = [
      { amount: 500, status: 'pending', payment_date: null },
      { amount: 300, status: 'pending', payment_date: null },
      { amount: 200, status: 'paid', payment_date: '2026-03-01' },
    ]
    expect(getMemberBalance(payments)).toBe(800)
  })

  it('retorna 0 si todos los pagos están pagados', () => {
    const payments: Payment[] = [{ amount: 500, status: 'paid', payment_date: '2026-03-01' }]
    expect(getMemberBalance(payments)).toBe(0)
  })

  it('retorna 0 con lista vacía', () => {
    expect(getMemberBalance([])).toBe(0)
  })
})

describe('getMonthlyRevenue', () => {
  it('suma pagos del mes especificado', () => {
    const payments: Payment[] = [
      { amount: 599, status: 'paid', payment_date: '2026-04-05' },
      { amount: 1599, status: 'paid', payment_date: '2026-04-15' },
      { amount: 599, status: 'paid', payment_date: '2026-03-20' },
      { amount: 500, status: 'pending', payment_date: null },
    ]
    expect(getMonthlyRevenue(payments, '2026-04')).toBe(2198)
  })

  it('retorna 0 si no hay pagos en el mes', () => {
    const payments: Payment[] = [{ amount: 599, status: 'paid', payment_date: '2026-03-05' }]
    expect(getMonthlyRevenue(payments, '2026-04')).toBe(0)
  })
})

describe('formatMrrDisplay', () => {
  it('usa sufijo K para miles', () => {
    expect(formatMrrDisplay(142800)).toBe('$142.8K')
  })
})
