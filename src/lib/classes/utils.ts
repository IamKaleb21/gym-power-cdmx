export type EnrollmentUiStatus = 'booked' | 'available' | 'almost_full' | 'full'

export type EnrollmentRow = {
  id: string
  status: string
  member_id: string
}

const MS_24H = 24 * 60 * 60 * 1000

export function getAvailableSpots(
  enrollments: EnrollmentRow[],
  maxCapacity: number,
): number {
  const activeCount = enrollments.filter((e) => e.status === 'active').length
  return Math.max(0, maxCapacity - activeCount)
}

export function canCancel(scheduledAt: string): boolean {
  const classTime = new Date(scheduledAt).getTime()
  return classTime - Date.now() > MS_24H
}

export function getEnrollmentStatus(
  enrollments: EnrollmentRow[],
  memberId: string,
  maxCapacity: number,
): EnrollmentUiStatus {
  const isBooked = enrollments.some(
    (e) => e.member_id === memberId && e.status === 'active',
  )
  if (isBooked) return 'booked'

  const available = getAvailableSpots(enrollments, maxCapacity)
  if (available === 0) return 'full'
  if (available / maxCapacity <= 0.2) return 'almost_full'
  return 'available'
}
