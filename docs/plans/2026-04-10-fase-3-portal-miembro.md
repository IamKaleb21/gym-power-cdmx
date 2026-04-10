# Fase 3 — Portal del Miembro: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the member-facing portal with dashboard, classes placeholder, payment history, and profile edit — pixel-perfect calcos of stitch files 12, 11, and 13.

**Architecture:** RSC-only reads using `createClient()` (session-based, RLS restricts each member to their own data). Mutations via Server Actions in `src/app/actions/member-portal.ts`. Shared member layout with TopAppBar + BottomNavBar (4 tabs). Pure utilities extended in `src/lib/members/status.ts`.

**Tech Stack:** Next.js 16 App Router · Supabase SSR (`createClient`) · Zod · TypeScript · Tailwind CSS 4 · Material Symbols Outlined

---

## Reference files (read before each task)

- Stitch dashboard: `docs/stitch/12-member-dashboard-overview.html`
- Stitch profile: `docs/stitch/11-member-edit-profile.html`
- Stitch payments: `docs/stitch/13-member-payment-history.html`
- Existing admin avatar component: `src/app/(admin)/admin/members/[id]/AvatarUpload.tsx`
- Existing admin layout: `src/app/(admin)/layout.tsx`
- Existing member status util: `src/lib/members/status.ts`
- Existing update schema: `src/lib/validations/member.schema.ts`
- Existing Server Actions: `src/app/actions/members.ts`
- Schema reference: `docs/SCHEMA.md`

---

## Task 1: TDD — `formatDaysRemaining` pure utility

**Files:**
- Modify: `src/lib/members/status.ts`
- Test: `src/tests/member-portal.test.ts` (create)

**Step 1: Write the failing test**

Create `src/tests/member-portal.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { formatDaysRemaining } from '@/lib/members/status'

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
```

**Step 2: Run test to verify it fails**

```bash
pnpm vitest run src/tests/member-portal.test.ts
```

Expected: FAIL — `formatDaysRemaining is not a function`

**Step 3: Implement `formatDaysRemaining` in `src/lib/members/status.ts`**

Add after the existing `getMemberStatus` function:

```typescript
export function formatDaysRemaining(endDate: string): string {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setUTCHours(0, 0, 0, 0)
  const diff = Math.round((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diff < 0) return 'Expired'
  if (diff === 0) return 'Today'
  if (diff === 1) return '1 Day Remaining'
  return `${diff} Days Remaining`
}
```

**Step 4: Run test to verify it passes**

```bash
pnpm vitest run src/tests/member-portal.test.ts
```

Expected: PASS (4 tests)

**Step 5: Run all tests to check no regressions**

```bash
pnpm test
```

Expected: All tests pass.

**Step 6: Commit**

```bash
git add src/lib/members/status.ts src/tests/member-portal.test.ts
git commit -m "test: add formatDaysRemaining TDD — member portal utility"
```

---

## Task 2: Member layout + MemberNav component

**Files:**
- Create: `src/components/member/MemberNav.tsx`
- Create: `src/app/(member)/layout.tsx`

**Design reference:** Bottom nav from `12-member-dashboard-overview.html` lines 247–264. TopAppBar lines 102–113.

**Step 1: Create `src/components/member/MemberNav.tsx`**

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/member/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/member/classes', icon: 'event_note', label: 'Classes' },
  { href: '/member/payments', icon: 'payments', label: 'Payments' },
  { href: '/member/profile', icon: 'person', label: 'Profile' },
]

export function MemberNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-3 bg-[#121212] border-t border-[#212121] rounded-t-lg shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
      {NAV_ITEMS.map(({ href, icon, label }) => {
        const isActive = pathname === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-200 ${
              isActive
                ? 'text-[#CCFF00] bg-[#212121] rounded-xl px-3 py-1'
                : 'text-gray-500 hover:text-gray-300 hover:bg-[#212121] px-3 py-1 rounded-xl'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {icon}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider mt-0.5 font-body">
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
```

**Step 2: Create `src/app/(member)/layout.tsx`**

```typescript
import Link from 'next/link'
import { MemberNav } from '@/components/member/MemberNav'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-on-background min-h-screen pb-24">
      {/* TopAppBar */}
      <nav className="flex justify-between items-center px-6 h-16 w-full bg-[#121212] border-b border-[#212121] sticky top-0 z-50">
        <Link href="/member/dashboard" className="flex items-center gap-2 text-[#CCFF00]">
          <span className="material-symbols-outlined">fitness_center</span>
          <span className="font-headline font-bold tracking-widest text-xl uppercase">
            GYM PORTAL
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-gray-400">notifications</span>
        </div>
      </nav>

      {/* Main content */}
      <main>{children}</main>

      {/* Bottom nav */}
      <MemberNav />
    </div>
  )
}
```

**Step 3: Run build to verify no errors**

```bash
pnpm build
```

Expected: Build passes.

**Step 4: Commit**

```bash
git add src/components/member/MemberNav.tsx src/app/(member)/layout.tsx
git commit -m "feat: add member portal layout with TopAppBar and BottomNav"
```

---

## Task 3: Member dashboard page

**Files:**
- Create: `src/app/(member)/member/dashboard/page.tsx`

**Design reference:** `docs/stitch/12-member-dashboard-overview.html` — full page calco. Omit stats bento grid (Workout Streak / Avg Time) — no data backing yet.

**Important queries:**
- Profile + active membership: `profiles` JOIN `member_memberships` JOIN `membership_plans` (session client, RLS filters to own data)
- Upcoming classes: `class_enrollments` WHERE `status = 'active'` JOIN `classes` JOIN `trainers` WHERE `scheduled_at > NOW()` LIMIT 3 ORDER ASC
- Last payment: `payments!payments_member_id_fkey` ORDER BY `created_at DESC` LIMIT 1

**Step 1: Create `src/app/(member)/member/dashboard/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDaysRemaining, getMemberStatus } from '@/lib/members/status'

export default async function MemberDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select(`
      id, full_name, avatar_url,
      member_memberships (
        end_date,
        membership_plans ( name )
      )
    `)
    .eq('id', user.id)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollments } = await (supabase as any)
    .from('class_enrollments')
    .select(`
      id,
      classes (
        id, name, scheduled_at,
        trainers ( full_name )
      )
    `)
    .eq('member_id', user.id)
    .eq('status', 'active')
    .gt('classes.scheduled_at', new Date().toISOString())
    .order('classes(scheduled_at)', { ascending: true })
    .limit(3)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lastPaymentArr } = await (supabase as any)
    .from('payments')
    .select('id, concept, amount, payment_date, created_at, status')
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const sortedMemberships = [...(profile?.member_memberships ?? [])].sort(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (a: any, b: any) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
  )
  const latestMembership = sortedMemberships[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upcomingClasses = (enrollments ?? []).filter((e: any) => e.classes)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastPayment = (lastPaymentArr ?? [])[0] as any | undefined

  return (
    <div className="px-5 pt-6 space-y-8">
      {/* Welcome Hero */}
      <header className="relative overflow-hidden rounded-xl bg-surface-container p-6 border-l-4 border-[#CCFF00]">
        <div className="relative z-10">
          <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant mb-1">
            Welcome back,
          </p>
          <h1 className="font-headline text-4xl font-black text-[#CCFF00] leading-none mb-6">
            {profile?.full_name?.toUpperCase() ?? 'MEMBER'}
          </h1>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-high p-4 rounded-lg">
              <p className="font-label text-[10px] uppercase text-on-surface-variant mb-1">
                Current Plan
              </p>
              <p className="font-headline font-bold text-sm text-on-surface">
                {latestMembership?.membership_plans?.name ?? 'No active plan'}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              latestMembership
                ? getMemberStatus(latestMembership.end_date) === 'expired'
                  ? 'bg-[#ff7351]/20'
                  : 'bg-[#CCFF00]'
                : 'bg-surface-container-high'
            }`}>
              <p className={`font-label text-[10px] uppercase font-bold mb-1 ${
                latestMembership && getMemberStatus(latestMembership.end_date) !== 'expired'
                  ? 'text-[#121212]'
                  : 'text-on-surface-variant'
              }`}>
                Expiry
              </p>
              <p className={`font-headline font-black text-sm ${
                latestMembership && getMemberStatus(latestMembership.end_date) !== 'expired'
                  ? 'text-[#121212]'
                  : 'text-on-surface'
              }`}>
                {latestMembership
                  ? formatDaysRemaining(latestMembership.end_date)
                  : 'No membership'}
              </p>
            </div>
          </div>
        </div>
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#CCFF00] opacity-10 rounded-full blur-3xl" />
      </header>

      {/* Next 3 Classes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-lg font-bold tracking-tight flex items-center gap-2 uppercase">
            <span className="w-1.5 h-6 bg-[#CCFF00]" />
            Next 3 Classes
          </h2>
        </div>
        {upcomingClasses.length === 0 ? (
          <div className="bg-surface-container-low p-6 rounded-lg text-on-surface-variant text-sm">
            No upcoming classes.
          </div>
        ) : (
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {upcomingClasses.map((enrollment: any) => {
              const cls = enrollment.classes
              const scheduledAt = new Date(cls.scheduled_at)
              const month = scheduledAt.toLocaleString('en-US', { month: 'short' }).toUpperCase()
              const day = scheduledAt.getDate()
              const time = scheduledAt.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })
              return (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-4 bg-surface-container-low p-4 rounded-lg border border-outline-variant hover:border-[#CCFF00] transition-colors group"
                >
                  <div className="flex flex-col items-center justify-center bg-surface-container-highest rounded px-3 py-2 border border-outline-variant">
                    <span className="font-headline text-xs font-bold text-on-surface">{month}</span>
                    <span className="font-headline text-lg font-black text-[#CCFF00] leading-none">
                      {day}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-headline font-bold text-on-surface text-base uppercase leading-tight group-hover:text-[#CCFF00] transition-colors">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {time}
                      {cls.trainers?.full_name && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          {cls.trainers.full_name}
                        </>
                      )}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-[#CCFF00] opacity-0 group-hover:opacity-100 transition-opacity">
                    arrow_forward_ios
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-lg font-bold tracking-tight flex items-center gap-2 uppercase">
            <span className="w-1.5 h-6 bg-[#CCFF00]" />
            Recent Activity
          </h2>
        </div>
        <div className="bg-surface-container rounded-xl overflow-hidden">
          {lastPayment ? (
            <div className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#CCFF00]">payments</span>
                </div>
                <div>
                  <p className="font-headline font-bold text-sm text-on-surface">
                    {lastPayment.concept ?? 'Payment'}
                  </p>
                  <p className="font-label text-[10px] text-on-surface-variant uppercase">
                    {lastPayment.payment_date ?? lastPayment.created_at?.slice(0, 10)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-headline font-black text-on-surface">
                  ${Number(lastPayment.amount).toLocaleString('es-MX')} MXN
                </p>
                <p className="text-[9px] font-bold uppercase text-emerald-400 bg-emerald-400/10 px-1.5 rounded inline-block">
                  {lastPayment.status}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 text-on-surface-variant text-sm">No recent activity.</div>
          )}
        </div>
      </section>
    </div>
  )
}
```

**Step 2: Run build**

```bash
pnpm build
```

Expected: Build passes (dynamic route, SSR).

**Step 3: Commit**

```bash
git add src/app/(member)/member/dashboard/page.tsx
git commit -m "feat: build member dashboard RSC with plan status and upcoming classes"
```

---

## Task 4: Classes placeholder page

**Files:**
- Create: `src/app/(member)/member/classes/page.tsx`

**Step 1: Create the placeholder**

```typescript
export default function MemberClassesPage() {
  return (
    <div className="px-5 pt-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <span className="material-symbols-outlined text-[#CCFF00] text-6xl">event_note</span>
      <h2 className="font-headline text-2xl font-black uppercase tracking-tight text-white">
        Classes
      </h2>
      <p className="text-on-surface-variant text-sm uppercase tracking-widest text-center">
        Coming soon
      </p>
    </div>
  )
}
```

**Step 2: Run build**

```bash
pnpm build
```

Expected: PASS.

**Step 3: Commit**

```bash
git add src/app/(member)/member/classes/page.tsx
git commit -m "feat: add member classes placeholder page"
```

---

## Task 5: Payment history page

**Files:**
- Create: `src/app/(member)/member/payments/page.tsx`

**Design reference:** `docs/stitch/13-member-payment-history.html` — calco completo. Download PDF = placeholder button (disabled visually, no action). Status: Paid = `#CCFF00`, Pending = orange-500.

**Step 1: Create `src/app/(member)/member/payments/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MemberPaymentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: payments } = await (supabase as any)
    .from('payments')
    .select('id, concept, amount, status, payment_date, created_at')
    .eq('member_id', user.id)
    .order('created_at', { ascending: false })

  const list = (payments ?? []) as any[]

  // Next payment: earliest due_date in the future among pending
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: nextPaymentArr } = await (supabase as any)
    .from('payments')
    .select('due_date')
    .eq('member_id', user.id)
    .eq('status', 'pending')
    .gt('due_date', new Date().toISOString().slice(0, 10))
    .order('due_date', { ascending: true })
    .limit(1)

  const nextPayment = (nextPaymentArr ?? [])[0]
  const hasPending = list.some((p: any) => p.status === 'pending')

  return (
    <div className="px-5 pt-8 pb-4">
      {/* Hero Summary */}
      <div className="mb-8 p-6 bg-[#1a1a1a] rounded-xl border-l-4 border-[#CCFF00] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <span className="material-symbols-outlined text-8xl">receipt_long</span>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">
          Current Balance
        </p>
        <h2 className="text-4xl font-black font-headline text-[#CCFF00] tracking-tighter mb-4">
          $0.00 MXN
        </h2>
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-400">Next Payment</span>
            <span className="text-sm font-bold">
              {nextPayment?.due_date
                ? new Date(nextPayment.due_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric',
                  })
                : '—'}
            </span>
          </div>
          <div className="w-px h-8 bg-gray-800" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-gray-400">Status</span>
            <span className={`text-sm font-bold ${hasPending ? 'text-orange-400' : 'text-[#CCFF00]'}`}>
              {hasPending ? 'PENDING' : 'ALL CLEAR'}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline font-bold text-lg uppercase tracking-tight">
          Transaction History
        </h3>
        <span className="material-symbols-outlined text-gray-600">filter_list</span>
      </div>

      <div className="space-y-4">
        {list.length === 0 ? (
          <div className="text-on-surface-variant text-sm p-4">No transactions yet.</div>
        ) : (
          list.map((p: any, i: number) => {
            const isPaid = p.status === 'completed'
            const isPending = p.status === 'pending'
            const dateStr = p.payment_date
              ? new Date(p.payment_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric',
                })
              : p.created_at?.slice(0, 10)

            return (
              <div
                key={p.id}
                className={`border rounded-lg p-4 flex items-center justify-between hover:border-[#CCFF00]/30 transition-colors ${
                  isPending
                    ? 'bg-[#212121] border-[#CCFF00]/50 shadow-[0_0_15px_rgba(204,255,0,0.1)]'
                    : i < 1
                    ? 'bg-[#121212] border-[#212121]'
                    : 'bg-[#121212] border-[#212121] opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isPending ? 'bg-[#CCFF00] text-black' : 'bg-[#212121] text-[#CCFF00]'
                  }`}>
                    <span
                      className="material-symbols-outlined"
                      style={isPending ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {isPending ? 'bolt' : 'calendar_today'}
                    </span>
                  </div>
                  <div>
                    <p className="font-bold text-white leading-tight">{p.concept ?? '—'}</p>
                    <p className={`text-xs uppercase font-semibold ${
                      isPending ? 'text-[#CCFF00] font-black' : 'text-gray-500'
                    }`}>
                      {isPending ? 'Pending Authorization' : dateStr}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-black font-headline ${isPaid ? 'text-[#CCFF00]' : 'text-white'}`}>
                    ${Number(p.amount).toLocaleString('es-MX')}
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isPaid ? 'bg-[#CCFF00]' : isPending ? 'bg-orange-500' : 'bg-gray-500'
                    }`} />
                    <span className={`text-[9px] font-black uppercase ${
                      isPaid ? 'text-[#CCFF00]' : isPending ? 'text-orange-500' : 'text-gray-500'
                    }`}>
                      {isPaid ? 'Paid' : isPending ? 'Pending' : p.status}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Download PDF — placeholder */}
      <button
        disabled
        className="w-full mt-8 bg-white/10 text-white/30 py-4 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-tighter cursor-not-allowed"
      >
        <span className="material-symbols-outlined">file_download</span>
        Download Full Statement (PDF)
      </button>
    </div>
  )
}
```

**Step 2: Run build**

```bash
pnpm build
```

Expected: PASS.

**Step 3: Commit**

```bash
git add src/app/(member)/member/payments/page.tsx
git commit -m "feat: build member payment history page with balance summary"
```

---

## Task 6: `updateMemberProfile` Server Action

**Files:**
- Create: `src/app/actions/member-portal.ts`

**Step 1: Create `src/app/actions/member-portal.ts`**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import { updateMemberSchema } from '@/lib/validations/member.schema'

export async function updateMemberProfile(formData: FormData) {
  const raw = {
    full_name: formData.get('full_name') || undefined,
    phone: formData.get('phone') || undefined,
  }

  const parsed = updateMemberSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { _root: ['Not authenticated'] } }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update(parsed.data)
    .eq('id', user.id)

  if (error) return { error: { _root: [error.message] } }

  revalidatePath('/member/profile')
  revalidatePath('/member/dashboard')
  return { success: true }
}

export async function updateMemberAvatarPortal(avatarUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/member/profile')
  revalidatePath('/member/dashboard')
  return { success: true }
}
```

**Step 2: Run build**

```bash
pnpm build
```

Expected: PASS.

**Step 3: Commit**

```bash
git add src/app/actions/member-portal.ts
git commit -m "feat: add updateMemberProfile and updateMemberAvatarPortal Server Actions"
```

---

## Task 7: Profile edit page + `MemberProfileForm`

**Files:**
- Create: `src/app/(member)/member/profile/page.tsx`
- Create: `src/app/(member)/member/profile/MemberProfileForm.tsx`

**Design reference:** `docs/stitch/11-member-edit-profile.html`. Avatar: circular w-32 h-32, `border-2 border-[#CCFF00]`, camera button bottom-right. Fields: Full Name (icon `person`), Phone (icon `phone_iphone`). Location field = readonly "CDMX, MEXICO". Save button `bg-[#CCFF00] text-[#121212]`. Danger zone = "Deactivate Membership" placeholder (no action).

**Step 1: Create `src/app/(member)/member/profile/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberProfileForm } from './MemberProfileForm'

export default async function MemberProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, phone, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="pt-8 pb-4">
      <MemberProfileForm
        memberId={profile?.id ?? user.id}
        initialData={{
          full_name: profile?.full_name ?? '',
          phone: profile?.phone ?? '',
          avatar_url: profile?.avatar_url ?? null,
        }}
      />
    </div>
  )
}
```

**Step 2: Create `src/app/(member)/member/profile/MemberProfileForm.tsx`**

```typescript
'use client'

import { useTransition, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateMemberProfile, updateMemberAvatarPortal } from '@/app/actions/member-portal'

type Props = {
  memberId: string
  initialData: {
    full_name: string
    phone: string
    avatar_url: string | null
  }
}

export function MemberProfileForm({ memberId, initialData }: Props) {
  const [isPending, startTransition] = useTransition()
  const [isAvatarPending, startAvatarTransition] = useTransition()
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatar_url)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    startAvatarTransition(async () => {
      const supabase = createClient()
      const path = `members/${memberId}/avatar`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) { setError(uploadError.message); return }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
      await updateMemberAvatarPortal(data.publicUrl)
    })
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateMemberProfile(formData)
      if (result?.error) {
        const msgs = Object.values(result.error).flat()
        setError(msgs[0] ?? 'Error saving')
      } else {
        setSuccess(true)
      }
    })
  }

  return (
    <div className="px-6 max-w-md mx-auto">
      {/* Page title */}
      <div className="mb-8">
        <h2 className="font-headline text-3xl font-bold tracking-tighter uppercase text-white">
          Edit Profile
        </h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Update your personal information below.
        </p>
      </div>

      {/* Avatar */}
      <section className="mb-10 flex flex-col items-center">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full border-2 border-[#CCFF00] p-1 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400 text-4xl">person</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isAvatarPending}
            className="absolute bottom-0 right-0 bg-[#CCFF00] text-[#121212] w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#0e0e0e] shadow-lg active:scale-90 transition-transform disabled:opacity-50"
          >
            <span className="material-symbols-outlined font-bold text-xl">
              {isAvatarPending ? 'hourglass_empty' : 'photo_camera'}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <p className="font-headline font-bold text-[#CCFF00] text-xs uppercase tracking-widest mt-4">
          Change Photo
        </p>
      </section>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
            Full Name
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
              person
            </span>
            <input
              name="full_name"
              type="text"
              defaultValue={initialData.full_name}
              placeholder="Enter your name"
              className="w-full bg-surface-container-highest border border-[#212121] rounded-xl py-4 pl-12 pr-4 text-white font-headline font-medium focus:border-[#CCFF00] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
            Phone Number
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
              phone_iphone
            </span>
            <input
              name="phone"
              type="tel"
              defaultValue={initialData.phone}
              placeholder="+52 ..."
              className="w-full bg-surface-container-highest border border-[#212121] rounded-xl py-4 pl-12 pr-4 text-white font-headline font-medium focus:border-[#CCFF00] focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
            Location
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
              location_on
            </span>
            <input
              readOnly
              type="text"
              value="CDMX, MEXICO"
              className="w-full bg-surface-container border border-[#212121] rounded-xl py-4 pl-12 pr-4 text-gray-400 font-headline font-medium cursor-not-allowed"
            />
          </div>
          <p className="text-[10px] text-gray-600 px-1 italic">
            Location is managed by gym branch assignment.
          </p>
        </div>

        {error && (
          <p className="text-[#ff7351] text-xs px-1">{error}</p>
        )}
        {success && (
          <p className="text-[#CCFF00] text-xs px-1">Profile updated successfully.</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#CCFF00] text-[#121212] font-headline font-black py-5 rounded-xl uppercase tracking-widest mt-10 hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(204,255,0,0.2)] disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* Danger zone — placeholder */}
      <div className="mt-12 pt-8 border-t border-[#212121]">
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-between px-4 py-4 rounded-xl border border-red-500/20 bg-red-500/5 opacity-50 cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400">delete</span>
            <span className="font-headline text-sm font-bold text-red-400 uppercase tracking-tighter">
              Deactivate Membership
            </span>
          </div>
          <span className="material-symbols-outlined text-red-400/40">chevron_right</span>
        </button>
      </div>
    </div>
  )
}
```

**Step 3: Run all tests + build**

```bash
pnpm test && pnpm build
```

Expected: All tests pass, build clean.

**Step 4: Commit**

```bash
git add src/app/(member)/member/profile/page.tsx src/app/(member)/member/profile/MemberProfileForm.tsx
git commit -m "feat: build member profile edit page with avatar upload and form"
```

---

## Final verification

```bash
pnpm test && pnpm build
```

Expected output:
- All unit test suites pass
- `Route (app)` includes `/member/dashboard`, `/member/classes`, `/member/payments`, `/member/profile`
- No TypeScript errors

---

## Commit summary for this phase

```
test: add formatDaysRemaining TDD — member portal utility
feat: add member portal layout with TopAppBar and BottomNav
feat: build member dashboard RSC with plan status and upcoming classes
feat: add member classes placeholder page
feat: build member payment history page with balance summary
feat: add updateMemberProfile and updateMemberAvatarPortal Server Actions
feat: build member profile edit page with avatar upload and form
```
