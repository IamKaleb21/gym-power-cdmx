'use server'

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAccessStatus } from '@/lib/qr/access'
import { getMemberBalance } from '@/lib/payments/utils'

const MX = 'America/Mexico_City'

export type MemberQRProfile = {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
  membershipEndDate: string | null
  pendingBalance: number
  accessStatus: 'granted' | 'denied'
  denyReason?: string
}

export type ValidateQRResult =
  | { ok: true; member: MemberQRProfile }
  | { ok: false; error: 'not_found' | 'invalid_id' | 'server_error' }

export async function validateMemberByUUID(memberIdRaw: string): Promise<ValidateQRResult> {
  const memberId = memberIdRaw.trim()
  const parsed = z.string().uuid().safeParse(memberId)
  if (!parsed.success) {
    return { ok: false, error: 'invalid_id' }
  }

  const supabase = createAdminClient()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: MX })

  /* Database types not generated for app tables — query via loose client */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [profileRes, membershipRes, paymentsRes] = await Promise.all([
    db
      .from('profiles')
      .select('id, full_name, email, avatar_url, role')
      .eq('id', parsed.data)
      .eq('role', 'member')
      .maybeSingle(),
    db
      .from('member_memberships')
      .select('end_date')
      .eq('member_id', parsed.data)
      .order('end_date', { ascending: false })
      .limit(1),
    db
      .from('payments')
      .select('amount, status, payment_date')
      .eq('member_id', parsed.data)
      .eq('status', 'pending'),
  ])

  if (profileRes.error || membershipRes.error || paymentsRes.error) {
    return { ok: false, error: 'server_error' }
  }
  if (!profileRes.data) {
    return { ok: false, error: 'not_found' }
  }

  const endDate = (membershipRes.data?.[0]?.end_date as string | undefined) ?? null
  const pendingBalance = getMemberBalance(
    (paymentsRes.data ?? []).map(
      (p: { amount: number; status: string; payment_date: string | null }) => ({
        amount: Number(p.amount),
        status: p.status,
        payment_date: p.payment_date,
      }),
    ),
  )

  const access = getAccessStatus({ endDate, pendingBalance, today })

  return {
    ok: true,
    member: {
      id: profileRes.data.id,
      full_name: profileRes.data.full_name,
      email: profileRes.data.email,
      avatar_url: profileRes.data.avatar_url,
      membershipEndDate: endDate,
      pendingBalance,
      accessStatus: access.status,
      denyReason: access.status === 'denied' ? access.denyReason : undefined,
    },
  }
}
