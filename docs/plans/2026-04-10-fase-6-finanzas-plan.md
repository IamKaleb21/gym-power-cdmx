# Fase 6 — Módulo de Finanzas: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Registro manual de pagos por admin, vista global financiera (lista + métricas + form), cambio de status paid↔pending, e indicador de saldo en perfil de miembro — calco 1:1 del stitch `03-admin-payments-unified.html`.

**Architecture:** RSC en `/admin/payments` que fetcha métricas, lista de transacciones y miembros en paralelo con `createAdminClient()`. `RegisterPaymentForm` (Client) y `ToggleStatusButton` (Client) manejan mutaciones via Server Actions. Lógica pura en `src/lib/payments/utils.ts`.

**Tech Stack:** Next.js 16 App Router (RSC + Server Actions), TypeScript strict, Tailwind CSS 4, Supabase admin + session clients, Zod, Vitest, pnpm.

---

## Task 1: TDD — Schema Zod + Utils de pagos

**Files:**
- Create: `src/lib/validations/payment.schema.ts`
- Create: `src/lib/payments/utils.ts`
- Create: `src/tests/payments.test.ts`

### Step 1: Escribir los tests (RED)

Crear `src/tests/payments.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { registerPaymentSchema } from '@/lib/validations/payment.schema'
import { getMemberBalance, getMonthlyRevenue } from '@/lib/payments/utils'

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
    const payments: Payment[] = [
      { amount: 500, status: 'paid', payment_date: '2026-03-01' },
    ]
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
      { amount: 599, status: 'paid', payment_date: '2026-03-20' }, // otro mes
      { amount: 500, status: 'pending', payment_date: null },       // pendiente
    ]
    expect(getMonthlyRevenue(payments, '2026-04')).toBe(2198)
  })

  it('retorna 0 si no hay pagos en el mes', () => {
    const payments: Payment[] = [
      { amount: 599, status: 'paid', payment_date: '2026-03-05' },
    ]
    expect(getMonthlyRevenue(payments, '2026-04')).toBe(0)
  })
})
```

### Step 2: Verificar RED

```bash
pnpm vitest run src/tests/payments.test.ts
```
Esperado: FAIL — módulos no encontrados.

### Step 3: Crear `src/lib/validations/payment.schema.ts`

```typescript
import { z } from 'zod'

export const registerPaymentSchema = z
  .object({
    member_id: z.string().uuid('Miembro requerido'),
    amount: z.coerce.number().positive('El monto debe ser mayor a 0'),
    concept: z.string().min(1, 'El concepto es requerido'),
    status: z.enum(['paid', 'pending']),
    payment_date: z.string().optional().nullable(),
    due_date: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.status === 'pending' && !data.due_date) return false
      return true
    },
    {
      message: 'La fecha de vencimiento es requerida para pagos pendientes',
      path: ['due_date'],
    },
  )

export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>
```

### Step 4: Crear `src/lib/payments/utils.ts`

```typescript
type PaymentRow = {
  amount: number
  status: string
  payment_date: string | null
}

/** Suma los adeudos pendientes del miembro */
export function getMemberBalance(payments: PaymentRow[]): number {
  return payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0)
}

/**
 * Suma los pagos `paid` de un mes dado.
 * @param month ISO month string: "YYYY-MM"
 */
export function getMonthlyRevenue(payments: PaymentRow[], month: string): number {
  return payments
    .filter((p) => p.status === 'paid' && p.payment_date?.startsWith(month))
    .reduce((sum, p) => sum + p.amount, 0)
}
```

### Step 5: Verificar GREEN

```bash
pnpm vitest run src/tests/payments.test.ts
```
Esperado: 8/8 pasando.

```bash
pnpm test
```
Esperado: todos pasando (sin regresiones).

### Step 6: Commit

```bash
git add src/lib/validations/payment.schema.ts src/lib/payments/utils.ts src/tests/payments.test.ts
git commit -m "test: add TDD for payment schema and balance utils"
```

---

## Task 2: Server Actions — `src/app/actions/payments.ts`

**Files:**
- Create: `src/app/actions/payments.ts`
- Reference: `src/app/actions/trainers.ts` (patrón admin client + revalidatePath)
- Reference: `src/lib/supabase/server.ts` (createClient para session)

### Step 1: Crear `src/app/actions/payments.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { registerPaymentSchema } from '@/lib/validations/payment.schema'

export type ActionResult = { success: true } | { success: false; error: string }

export async function registerPayment(formData: FormData): Promise<ActionResult> {
  const raw = {
    member_id: formData.get('member_id'),
    amount: formData.get('amount'),
    concept: formData.get('concept'),
    status: formData.get('status'),
    payment_date: formData.get('payment_date') || null,
    due_date: formData.get('due_date') || null,
  }

  const parsed = registerPaymentSchema.safeParse(raw)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  // Obtener admin autenticado para registrar created_by
  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) return { success: false, error: 'No autenticado' }

  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('payments').insert({
    member_id: parsed.data.member_id,
    amount: parsed.data.amount,
    concept: parsed.data.concept,
    status: parsed.data.status,
    payment_date: parsed.data.payment_date,
    due_date: parsed.data.due_date,
    created_by: user.id,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/payments')
  revalidatePath(`/admin/members/${parsed.data.member_id}`)
  return { success: true }
}

export async function updatePaymentStatus(
  id: string,
  status: 'paid' | 'pending',
): Promise<ActionResult> {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('payments')
    .update({ status })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/payments')
  return { success: true }
}
```

### Step 2: Build check

```bash
pnpm build
```
Esperado: 0 errores TypeScript.

### Step 3: Commit

```bash
git add src/app/actions/payments.ts
git commit -m "feat: add payment registration and status update server actions"
```

---

## Task 3: Admin Payments Page — calco stitch `03`

**Files:**
- Create: `src/app/(admin)/admin/payments/page.tsx`
- Create: `src/app/(admin)/admin/payments/RegisterPaymentForm.tsx`
- Create: `src/app/(admin)/admin/payments/ToggleStatusButton.tsx`
- Reference stitch: `docs/stitch/03-admin-payments-unified.html`
- Reference: `src/app/(admin)/admin/classes/page.tsx` (patrón RSC + admin client)

### `ToggleStatusButton.tsx` — Client Component

```typescript
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updatePaymentStatus } from '@/app/actions/payments'

export default function ToggleStatusButton({
  id,
  currentStatus,
}: {
  id: string
  currentStatus: 'paid' | 'pending'
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const nextStatus = currentStatus === 'paid' ? 'pending' : 'paid'

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          await updatePaymentStatus(id, nextStatus)
          router.refresh()
        })
      }
      className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded transition-opacity disabled:opacity-50 ${
        currentStatus === 'paid'
          ? 'text-white/20 bg-white/5 hover:bg-white/10'
          : 'text-on-error bg-error/20 hover:bg-error/30'
      }`}
    >
      {pending ? '…' : currentStatus === 'paid' ? 'Success' : 'Pending Dues'}
    </button>
  )
}
```

### `RegisterPaymentForm.tsx` — Client Component

Props:
```typescript
interface RegisterPaymentFormProps {
  members: Array<{ id: string; full_name: string; email: string }>
}
```

Campos:
- `<select name="member_id">` con `members`
- `<input type="number" name="amount">` — placeholder "0.00", texto `text-2xl font-headline`
- `<input type="text" name="concept">` — concepto del pago
- Status toggle: dos botones `type="button"` — "Card" (→ status `paid`) y "Cash" (→ también `paid` por defecto). En realidad el form tiene campos `paid`/`pending`: usar botones de estado tipo toggle, el activo se muestra en lime.
  - Botón 1: "Paid" (status=paid), activo: `bg-[#cafd00] text-[#0e0e0e]`
  - Botón 2: "Pending" (status=pending), inactivo: `bg-[#262626] text-white/60`
  - Un `<input type="hidden" name="status">` guarda el valor seleccionado
- `<input type="date" name="due_date">` — visible solo cuando status=`pending`
- `<input type="date" name="payment_date">` — fecha del pago (opcional, default hoy)
- Botón submit "Process Transaction"

Comportamiento:
- `useState` para `selectedStatus: 'paid' | 'pending'`
- `useTransition` para pending state
- `onSubmit`: construye `FormData` manualmente y llama `registerPayment(fd)`
- Al éxito: `router.refresh()` + resetear form

### `page.tsx` — RSC

Queries en paralelo con `Promise.all`:
```typescript
const [paymentsResult, membersResult] = await Promise.all([
  (supabase as any)
    .from('payments')
    .select('id, amount, concept, status, payment_date, due_date, created_at, profiles!payments_member_id_fkey(full_name)')
    .order('created_at', { ascending: false })
    .limit(20),
  (supabase as any)
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'member')
    .order('full_name'),
])
```

Cálculo de métricas en RSC:
```typescript
const currentMonth = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' }).slice(0, 7) // 'YYYY-MM'
const allPayments = paymentsResult.data ?? []
const mrr = getMonthlyRevenue(allPayments, currentMonth)
const paidThisMonth = allPayments.filter(p => p.status === 'paid' && p.payment_date?.startsWith(currentMonth))
const avgTicket = paidThisMonth.length > 0 ? Math.round(mrr / paidThisMonth.length) : 0
const totalUnpaid = allPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0)
const unpaidCount = allPayments.filter(p => p.status === 'pending').length
```

Layout calco del stitch:
- Grid 12 cols hero: MRR card (8) + métricas (4)
- Grid 3 cols contenido: transacciones (2) + aside form (1)
- Mini bar chart del MRR: 7 divs estáticos, el último en lime (estético, sin datos reales)

### Step N: Build + Lint + Commit

```bash
pnpm build
pnpm eslint "src/app/(admin)/admin/payments/**/*.{tsx,ts}" src/app/actions/payments.ts src/lib/payments/utils.ts src/lib/validations/payment.schema.ts
git add src/app/(admin)/admin/payments/ src/app/actions/payments.ts
git commit -m "feat: build admin payments page with registration form and toggle status"
```

---

## Task 4: Indicador de saldo en `/admin/members/[id]`

**Files:**
- Modify: `src/app/(admin)/admin/members/[id]/page.tsx`
- Reference: `src/lib/payments/utils.ts` (getMemberBalance — ya creado en Task 1)

### Step 1: Agregar badge de adeudo en la sección pagos

En `src/app/(admin)/admin/members/[id]/page.tsx`, la sección de pagos ya existe. Agregar arriba del listado:

```typescript
import { getMemberBalance } from '@/lib/payments/utils'

// En el componente, después de obtener `member`:
const paymentRows = member.payments ?? []
const balance = getMemberBalance(paymentRows.map((p: any) => ({
  amount: p.amount ?? 0,
  status: p.status,
  payment_date: p.payment_date,
})))
```

Mostrar el badge en la sección:
```tsx
<h2 className="...">Membresía</h2>
{/* badge de adeudo */}
{balance > 0 && (
  <div className="flex items-center gap-2 mb-4 p-3 bg-[#ff7351]/10 border border-[#ff7351]/30 rounded-lg">
    <span className="material-symbols-outlined text-[#ff7351] text-sm">warning</span>
    <span className="text-[#ff7351] text-sm font-bold">
      Adeudo pendiente: ${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
    </span>
  </div>
)}
```

### Step 2: Build + Commit

```bash
pnpm build
git add src/app/(admin)/admin/members/[id]/page.tsx
git commit -m "feat: add pending balance indicator on admin member detail"
```

---

## Task 5: Build Final + Verificación Manual

### Step 1: Tests + Build

```bash
pnpm test
pnpm build
```
Esperado: 60+ tests pasando, 0 errores TypeScript.

### Step 2: Verificación manual

**Admin — Payments:**
1. Ir a `/admin/payments` — ver hero con MRR, transacciones recientes
2. En el aside, registrar un pago: seleccionar miembro, monto, concepto, status "Paid" → "Process Transaction"
3. El pago aparece en la lista con badge "Success"
4. Registrar un pago "Pending" — aparece due_date → guardar → badge "Pending Dues"
5. Clic en el badge de una transacción → cambia de "Success" a "Pending Dues" y viceversa

**Admin — Member Detail:**
6. Ir a `/admin/members/[id]` de un miembro con pagos pendientes → ver badge de adeudo rojo

### Step 3: No hay commit final — el usuario lo indicará
