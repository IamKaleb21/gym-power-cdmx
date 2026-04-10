# Fase 7 — Dashboard Analítico: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reemplazar el placeholder de `/admin/dashboard` con un panel de retención: 4 KPI cards, selector de rango 3m/6m/12m vía URL, y gráfico de barras mensual (Recharts).

**Architecture:** RSC puro en `/admin/dashboard` — fetcha `member_memberships` con `createAdminClient()`, calcula métricas con utilidades puras, y pasa datos a dos Client Components (`RangeSelector`, `RetentionChart`). Rango controlado por `searchParams.range`.

**Tech Stack:** Next.js 16 App Router (RSC), TypeScript strict, Tailwind CSS 4, Recharts (ya instalado), Supabase admin client, Vitest, pnpm.

---

## Task 1: TDD — Funciones puras de analítica

**Files:**
- Create: `src/lib/analytics/utils.ts`
- Create: `src/tests/retention.test.ts`

### Step 1: Escribir tests (RED)

Crear `src/tests/retention.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { calculateRetentionRate, getRetentionMetrics } from '@/lib/analytics/utils'

type Membership = { member_id: string; start_date: string; end_date: string }

describe('calculateRetentionRate', () => {
  it('calcula correctamente la tasa de retención', () => {
    // ((12 - 3) / 10) * 100 = 90
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
    const result = getRetentionMetrics(memberships, '2026-01-01', '2026-03-31')
    // Nuevas altas en el periodo: a(ene), b(ene), c(feb), d(mar), e(mar) = 5
    expect(result.newCount).toBe(5)
  })

  it('cuenta nuevas altas dentro del período', () => {
    const result = getRetentionMetrics(memberships, '2026-03-01', '2026-03-31')
    // Solo altas en marzo: d y e
    expect(result.newCount).toBe(2)
  })

  it('genera monthlySeries con una entrada por mes en el rango', () => {
    const result = getRetentionMetrics(memberships, '2026-01-01', '2026-03-31')
    expect(result.monthlySeries.length).toBe(3)
    expect(result.monthlySeries[0].month).toBe('Jan 2026')
    expect(result.monthlySeries[2].month).toBe('Mar 2026')
  })
})
```

### Step 2: Verificar RED

```bash
pnpm vitest run src/tests/retention.test.ts
```
Esperado: FAIL — módulo no encontrado.

### Step 3: Crear `src/lib/analytics/utils.ts`

```typescript
export type MembershipRow = {
  member_id: string
  start_date: string
  end_date: string
}

export type MonthlyPoint = {
  month: string  // 'Jan 2026'
  new: number
  active: number
}

export type RetentionMetrics = {
  activeCount: number
  newCount: number
  churnCount: number
  retentionRate: number
  monthlySeries: MonthlyPoint[]
}

/**
 * ((members_end - new_members) / members_start) * 100
 * Retorna 0 si members_start === 0
 */
export function calculateRetentionRate(
  membersStart: number,
  newMembers: number,
  membersEnd: number,
): number {
  if (membersStart === 0) return 0
  const retained = membersEnd - newMembers
  if (retained <= 0) return 0
  return (retained / membersStart) * 100
}

/**
 * Calcula métricas de retención para un rango de fechas (strings 'YYYY-MM-DD').
 * Genera monthlySeries con una entrada por mes calendario en el rango.
 */
export function getRetentionMetrics(
  memberships: MembershipRow[],
  startDate: string,
  endDate: string,
): RetentionMetrics {
  const start = new Date(startDate)
  const end = new Date(endDate)

  // Nuevas altas en el período
  const newCount = memberships.filter((m) => {
    const s = new Date(m.start_date)
    return s >= start && s <= end
  }).length

  // Activos al inicio del período
  const activeAtStart = memberships.filter((m) => {
    const s = new Date(m.start_date)
    const e = new Date(m.end_date)
    return s <= start && e >= start
  }).length

  // Activos al final del período
  const activeAtEnd = memberships.filter((m) => {
    const s = new Date(m.start_date)
    const e = new Date(m.end_date)
    return s <= end && e >= end
  }).length

  // Bajas: membresías que terminaron dentro del período
  const today = new Date()
  const churnCount = memberships.filter((m) => {
    const e = new Date(m.end_date)
    return e >= start && e <= end && e < today
  }).length

  const retentionRate = calculateRetentionRate(activeAtStart, newCount, activeAtEnd)

  // Serie mensual
  const monthlySeries: MonthlyPoint[] = []
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1))
  const endMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1))

  while (cursor <= endMonth) {
    const monthStart = new Date(cursor)
    const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0))

    const monthNew = memberships.filter((m) => {
      const s = new Date(m.start_date)
      return s >= monthStart && s <= monthEnd
    }).length

    const monthActive = memberships.filter((m) => {
      const s = new Date(m.start_date)
      const e = new Date(m.end_date)
      return s <= monthEnd && e >= monthStart
    }).length

    const label = cursor.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    })

    monthlySeries.push({ month: label, new: monthNew, active: monthActive })
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }

  return {
    activeCount: activeAtEnd,
    newCount,
    churnCount,
    retentionRate,
    monthlySeries,
  }
}
```

### Step 4: Verificar GREEN

```bash
pnpm vitest run src/tests/retention.test.ts
```
Esperado: 5/5 pasando.

```bash
pnpm test
```
Esperado: todos pasando (sin regresiones).

### Step 5: Commit

```bash
git add src/lib/analytics/utils.ts src/tests/retention.test.ts
git commit -m "test(analytics): add TDD for retention rate and monthly metrics"
```

---

## Task 2: RangeSelector y RetentionChart (Client Components)

**Files:**
- Create: `src/app/(admin)/admin/dashboard/RangeSelector.tsx`
- Create: `src/app/(admin)/admin/dashboard/RetentionChart.tsx`

### Step 1: Crear `RangeSelector.tsx`

```typescript
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type Range = '3m' | '6m' | '12m'
const OPTIONS: { value: Range; label: string }[] = [
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '12m', label: '12M' },
]

export default function RangeSelector({ current }: { current: Range }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(range: Range) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('range', range)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleChange(opt.value)}
          className={`px-4 py-2 text-xs font-black uppercase tracking-widest font-headline transition-colors ${
            current === opt.value
              ? 'bg-[#cafd00] text-[#0e0e0e]'
              : 'bg-surface-container-high text-white/60 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
```

### Step 2: Crear `RetentionChart.tsx`

```typescript
'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type MonthlyPoint = { month: string; new: number; active: number }

export default function RetentionChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#adaaaa', fontSize: 10, fontFamily: 'Inter' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#adaaaa', fontSize: 10, fontFamily: 'Inter' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #262626',
            borderRadius: '2px',
            color: '#ffffff',
            fontSize: '12px',
            fontFamily: 'Inter',
          }}
          cursor={{ fill: '#262626' }}
        />
        <Legend
          wrapperStyle={{ color: '#adaaaa', fontSize: '10px', fontFamily: 'Inter' }}
        />
        <Bar dataKey="active" name="Activos" fill="#262626" radius={[2, 2, 0, 0]} />
        <Bar dataKey="new" name="Nuevas altas" fill="#cafd00" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

### Step 3: Build check (sin página aún)

```bash
pnpm build
```
Esperado: 0 errores.

### Step 4: Commit

```bash
git add "src/app/(admin)/admin/dashboard/RangeSelector.tsx" "src/app/(admin)/admin/dashboard/RetentionChart.tsx"
git commit -m "feat(analytics): add RangeSelector and RetentionChart client components"
```

---

## Task 3: Dashboard RSC — `page.tsx`

**Files:**
- Modify: `src/app/(admin)/admin/dashboard/page.tsx` (reemplazar placeholder completo)
- Reference: `src/lib/analytics/utils.ts`
- Reference: `src/lib/supabase/admin.ts`

### Step 1: Reemplazar `src/app/(admin)/admin/dashboard/page.tsx`

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { getRetentionMetrics } from '@/lib/analytics/utils'
import RangeSelector from './RangeSelector'
import RetentionChart from './RetentionChart'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

const MX = 'America/Mexico_City'

type Range = '3m' | '6m' | '12m'

function getRangeDates(range: Range): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = now.toLocaleDateString('en-CA', { timeZone: MX })

  const start = new Date(now)
  if (range === '3m') start.setMonth(start.getMonth() - 3)
  else if (range === '6m') start.setMonth(start.getMonth() - 6)
  else start.setFullYear(start.getFullYear() - 1)

  const startDate = start.toLocaleDateString('en-CA', { timeZone: MX })
  return { startDate, endDate }
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string }>
}) {
  const sp = (await searchParams) ?? {}
  const range: Range =
    sp.range === '3m' || sp.range === '12m' ? sp.range : '6m'

  const { startDate, endDate } = getRangeDates(range)

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberships } = await (supabase as any)
    .from('member_memberships')
    .select('member_id, start_date, end_date')

  const metrics = getRetentionMetrics(memberships ?? [], startDate, endDate)

  const kpis = [
    {
      label: 'Activos',
      value: metrics.activeCount,
      icon: 'group',
      color: 'text-[#cafd00]',
    },
    {
      label: 'Nuevas Altas',
      value: metrics.newCount,
      icon: 'person_add',
      color: 'text-[#cafd00]',
    },
    {
      label: 'Bajas',
      value: metrics.churnCount,
      icon: 'person_remove',
      color: 'text-error',
    },
    {
      label: 'Retención',
      value: `${metrics.retentionRate.toFixed(1)}%`,
      icon: 'trending_up',
      color: 'text-[#cafd00]',
    },
  ]

  return (
    <div className="px-4 lg:px-8 max-w-7xl mx-auto pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold mb-1">
            Admin Portal
          </p>
          <h1 className="text-4xl lg:text-5xl font-black font-headline uppercase tracking-tighter text-white">
            Analytics
          </h1>
        </div>
        <Suspense fallback={null}>
          <RangeSelector current={range} />
        </Suspense>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-surface-container-low p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold">
                {kpi.label}
              </p>
              <span className={`material-symbols-outlined text-sm ${kpi.color}`}>
                {kpi.icon}
              </span>
            </div>
            <p className={`text-4xl font-black font-headline tracking-tighter ${kpi.color}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-surface-container-low p-6 rounded-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-black font-headline uppercase tracking-tighter text-white">
            Actividad mensual
          </h2>
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            {startDate} → {endDate}
          </span>
        </div>
        <RetentionChart data={metrics.monthlySeries} />
      </div>
    </div>
  )
}
```

### Step 2: Build check

```bash
pnpm build
```
Esperado: 0 errores TypeScript, `/admin/dashboard` aparece como `ƒ` (dynamic).

### Step 3: Tests completos

```bash
pnpm test
```
Esperado: 68+ tests, 0 failures.

### Step 4: Commit

```bash
git add "src/app/(admin)/admin/dashboard/page.tsx"
git commit -m "feat(analytics): build admin dashboard with KPI cards and retention chart"
```

---

## Task 4: Verificación manual

1. Ir a `/admin/dashboard` — ver 4 KPI cards y gráfico de barras.
2. Clic en **3M** → URL cambia a `?range=3m`, métricas se actualizan.
3. Clic en **12M** → URL cambia a `?range=12m`.
4. Verificar que las barras muestran datos del seed (si hay membresías en el seed).
5. Confirmar que el rango default (`6m`) funciona sin `?range` en la URL.

### No hay commit final — el usuario lo indicará
