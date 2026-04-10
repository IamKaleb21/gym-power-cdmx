import { describe, it, expect } from 'vitest'
import { formatDaysRemaining } from '@/lib/members/status'
import { updateMemberSchema } from '@/lib/validations/member.schema'

function dateOffset(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

describe('formatDaysRemaining', () => {
  it('returns "X Days Remaining" for future dates', () => {
    expect(formatDaysRemaining(dateOffset(22))).toBe('22 Days Remaining')
  })

  it('returns "1 Day Remaining" (singular) for tomorrow', () => {
    expect(formatDaysRemaining(dateOffset(1))).toBe('1 Day Remaining')
  })

  it('returns "Today" when end_date is today', () => {
    expect(formatDaysRemaining(dateOffset(0))).toBe('Today')
  })

  it('returns "Expired" for past dates', () => {
    expect(formatDaysRemaining(dateOffset(-3))).toBe('Expired')
  })
})

describe('updateMemberProfile validation', () => {
  it('accepts valid full_name and phone', () => {
    const result = updateMemberSchema.safeParse({ full_name: 'Ana López', phone: '5551234567' })
    expect(result.success).toBe(true)
  })

  it('rejects empty full_name when provided', () => {
    const result = updateMemberSchema.safeParse({ full_name: '' })
    expect(result.success).toBe(false)
  })

  it('accepts partial update (only phone)', () => {
    const result = updateMemberSchema.safeParse({ phone: '5559876543' })
    expect(result.success).toBe(true)
  })

  it('accepts empty object (no fields to update)', () => {
    const result = updateMemberSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
