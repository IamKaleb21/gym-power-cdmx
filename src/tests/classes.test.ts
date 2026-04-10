import { describe, it, expect } from 'vitest'
import { createClassSchema } from '@/lib/validations/class.schema'
import {
  getAvailableSpots,
  canCancel,
  getEnrollmentStatus,
  type EnrollmentRow,
} from '@/lib/classes/utils'

const TID = '550e8400-e29b-41d4-a716-446655440001'

function makeEnrollments(active: number, cancelled = 0): EnrollmentRow[] {
  const rows: EnrollmentRow[] = []
  for (let i = 0; i < active; i++) {
    rows.push({
      id: `a-${i}`,
      status: 'active',
      member_id: `member-${i}`,
    })
  }
  for (let j = 0; j < cancelled; j++) {
    rows.push({
      id: `c-${j}`,
      status: 'cancelled',
      member_id: `cx-${j}`,
    })
  }
  return rows
}

describe('createClassSchema', () => {
  it('rechaza max_capacity <= 0', () => {
    const result = createClassSchema.safeParse({
      name: 'HIIT',
      trainer_id: TID,
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      duration_minutes: 60,
      max_capacity: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rechaza scheduled_at en el pasado', () => {
    const result = createClassSchema.safeParse({
      name: 'HIIT',
      trainer_id: TID,
      scheduled_at: new Date(Date.now() - 86400000).toISOString(),
      duration_minutes: 60,
      max_capacity: 20,
    })
    expect(result.success).toBe(false)
  })

  it('acepta datos válidos', () => {
    const result = createClassSchema.safeParse({
      name: 'HIIT Advanced',
      trainer_id: TID,
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      duration_minutes: 60,
      max_capacity: 20,
    })
    expect(result.success).toBe(true)
  })
})

describe('getAvailableSpots', () => {
  it('resta solo enrollments activos', () => {
    expect(getAvailableSpots(makeEnrollments(3, 2), 20)).toBe(17)
  })

  it('retorna 0 si llena', () => {
    expect(getAvailableSpots(makeEnrollments(20), 20)).toBe(0)
  })
})

describe('canCancel', () => {
  it('retorna true si faltan más de 24h', () => {
    const future = new Date(Date.now() + 25 * 3600 * 1000).toISOString()
    expect(canCancel(future)).toBe(true)
  })

  it('retorna false si faltan 24h o menos', () => {
    const soon = new Date(Date.now() + 23 * 3600 * 1000).toISOString()
    expect(canCancel(soon)).toBe(false)
  })
})

describe('getEnrollmentStatus', () => {
  it('retorna booked si el miembro tiene enrollment activo', () => {
    const enrollments: EnrollmentRow[] = [
      { id: 'e1', status: 'active', member_id: 'me' },
    ]
    expect(getEnrollmentStatus(enrollments, 'me', 20)).toBe('booked')
  })

  it('retorna full si no hay cupos y member no inscrito', () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({
      id: `x-${i}`,
      status: 'active',
      member_id: `m-${i}`,
    }))
    expect(getEnrollmentStatus(rows, 'other', 20)).toBe('full')
  })

  it('retorna almost_full si ≤20% cupos libres', () => {
    expect(getEnrollmentStatus(makeEnrollments(17), 'other', 20)).toBe('almost_full')
  })

  it('retorna available en caso normal', () => {
    expect(getEnrollmentStatus(makeEnrollments(5), 'other', 20)).toBe('available')
  })
})
