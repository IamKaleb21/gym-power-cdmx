# Fase 8 — QR Check-in: Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** QR personal en portal miembro + scanner de validación en `/admin/scan` con resultado visual granted/denied, calco 1:1 del stitch `01-admin-scan-unified.html`.

**Architecture:** Lógica pura en `src/lib/qr/access.ts`, Server Action `validateMemberByUUID` con admin client. Admin scan: `html5-qrcode` en Client Component + panel de resultado. Member: RSC fetcha UUID propio → `QRDisplay` con `react-qr-code`. `MemberNav` añade tab QR.

**Tech Stack:** Next.js 16 App Router (RSC + Server Actions), TypeScript strict, Tailwind CSS 4, `html5-qrcode` (instalado), `react-qr-code` (instalado), Supabase admin + session clients, Vitest, pnpm.

---

## Task 1: TDD — Lógica pura de acceso

**Files:**
- Create: `src/lib/qr/access.ts`
- Create: `src/tests/qr-checkin.test.ts`

### Step 1: Escribir tests (RED)

Crear `src/tests/qr-checkin.test.ts`:

```typescript
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
```

### Step 2: Verificar RED

```bash
pnpm vitest run src/tests/qr-checkin.test.ts
```
Esperado: FAIL — módulo no encontrado.

### Step 3: Crear `src/lib/qr/access.ts`

```typescript
export type AccessStatus =
  | { status: 'granted' }
  | { status: 'denied'; denyReason: string }

export function getAccessStatus({
  endDate,
  pendingBalance,
  today,
}: {
  endDate: string | null
  pendingBalance: number
  today: string
}): AccessStatus {
  if (!endDate) {
    return { status: 'denied', denyReason: 'Sin membresía registrada' }
  }
  if (endDate < today) {
    return { status: 'denied', denyReason: 'Membresía vencida' }
  }
  if (pendingBalance > 0) {
    return {
      status: 'denied',
      denyReason: `Adeudo pendiente: $${pendingBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`,
    }
  }
  return { status: 'granted' }
}
```

### Step 4: Verificar GREEN

```bash
pnpm vitest run src/tests/qr-checkin.test.ts
```
Esperado: 5/5 pasando.

```bash
pnpm test
```
Esperado: todos pasando.

### Step 5: Commit

```bash
git add src/lib/qr/access.ts src/tests/qr-checkin.test.ts
git commit -m "test(qr): add TDD for access status logic"
```

---

## Task 2: Server Action — `validateMemberByUUID`

**Files:**
- Create: `src/app/actions/qr.ts`
- Reference: `src/lib/qr/access.ts`
- Reference: `src/lib/supabase/admin.ts`
- Reference: `src/lib/payments/utils.ts` (getMemberBalance)

### Step 1: Crear `src/app/actions/qr.ts`

```typescript
'use server'

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
  | { ok: false; error: 'not_found' | 'server_error' }

export async function validateMemberByUUID(memberId: string): Promise<ValidateQRResult> {
  const supabase = createAdminClient()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: MX })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [profileRes, membershipRes, paymentsRes] = await Promise.all([
    (supabase as any)
      .from('profiles')
      .select('id, full_name, email, avatar_url, role')
      .eq('id', memberId)
      .eq('role', 'member')
      .maybeSingle(),
    (supabase as any)
      .from('member_memberships')
      .select('end_date')
      .eq('member_id', memberId)
      .order('end_date', { ascending: false })
      .limit(1),
    (supabase as any)
      .from('payments')
      .select('amount, status, payment_date')
      .eq('member_id', memberId)
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
    (paymentsRes.data ?? []).map((p: { amount: number; status: string; payment_date: string | null }) => ({
      amount: Number(p.amount),
      status: p.status,
      payment_date: p.payment_date,
    })),
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
```

### Step 2: Build check

```bash
pnpm build
```
Esperado: 0 errores TypeScript.

### Step 3: Commit

```bash
git add src/app/actions/qr.ts
git commit -m "feat(qr): add validateMemberByUUID server action"
```

---

## Task 3: Admin Scan Page — calco stitch `01`

**Files:**
- Create: `src/app/(admin)/admin/scan/page.tsx`
- Create: `src/app/(admin)/admin/scan/QRScanner.tsx`
- Create: `src/app/(admin)/admin/scan/MemberResultPanel.tsx`
- Reference stitch: `docs/stitch/01-admin-scan-unified.html`

### `MemberResultPanel.tsx` — Client Component

Props:
```typescript
type Props = {
  result: ValidateQRResult | null
  loading: boolean
}
```

Estados visuales:
- `null` & `!loading` → idle: ícono `qr_code_scanner` grande centrado, texto "Esperando escaneo…"
- `loading` → spinner `animate-spin border-[#cafd00]`
- `result.ok === false` → error card con ícono `person_off` y mensaje según `error`
- `result.ok === true, accessStatus === 'granted'`:
  - Avatar con `<img>` o fallback initials
  - Nombre: `NOMBRE` / `<span text-[#cafd00]>APELLIDO</span>` tipografía editorial
  - Badge "ACTIVE" con borde lime izquierdo
  - Balance `$0.00 MXN` con ícono `check_circle` lime
  - Membresía vence: fecha formateada
  - Botón **GRANT ACCESS** `bg-[#cafd00] text-[#0e0e0e]`, botón **DENY** apagado
- `result.ok === true, accessStatus === 'denied'`:
  - Badge "DENIED" con borde error
  - `denyReason` en `text-error`
  - Botón **DENY ACCESS** `bg-error text-white`, botón **GRANT** apagado

### `QRScanner.tsx` — Client Component

```typescript
'use client'
// useEffect inicializa Html5Qrcode en el div "qr-reader"
// onScanSuccess(decodedText) → llama validateMemberByUUID(decodedText.trim())
// Botón "ID Input" toggle: muestra <input> para UUID manual + botón buscar
// Maneja cleanup de la cámara en useEffect return
```

CSS del stitch replicado con clases Tailwind + `@keyframes scan` global en `globals.css`.

### `page.tsx` — RSC shell

```typescript
import QRScanner from './QRScanner'
// Layout: flex h-screen overflow-hidden
// Izquierda: <QRScanner /> (flex-1)
// Derecha: maneja estado via props — QRScanner levanta el resultado
// Usar 'use client' en page.tsx NO — todo el state vive en QRScanner que pasa props a MemberResultPanel
// Alternativa: page.tsx es RSC que renderiza un <ScannerShell /> client component que contiene ambos paneles
```

> **Nota implementación:** Como `QRScanner` y `MemberResultPanel` comparten estado (`result`, `loading`), envolver ambos en un `ScannerShell.tsx` Client Component que los orqueste. `page.tsx` sigue siendo RSC que solo renderiza `<ScannerShell />`.

Crear `src/app/(admin)/admin/scan/ScannerShell.tsx`:
```typescript
'use client'
// useState: result, loading
// Renderiza izquierda + derecha side by side
// Pasa onScan callback a QRScanner, result+loading a MemberResultPanel
```

### Step N: Build + Lint + Commit

```bash
pnpm build
git add src/app/(admin)/admin/scan/
git commit -m "feat(qr): build admin QR scanner page with member validation panel"
```

---

## Task 4: Member QR Page + Nav

**Files:**
- Create: `src/app/(member)/member/qr/page.tsx`
- Create: `src/app/(member)/member/qr/QRDisplay.tsx`
- Modify: `src/components/member/MemberNav.tsx`

### `QRDisplay.tsx` — Client Component

```typescript
'use client'
import QRCode from 'react-qr-code'

export default function QRDisplay({ uuid, name }: { uuid: string; name: string }) {
  return (
    <div className="flex flex-col items-center gap-8">
      <div className="bg-white p-5 rounded-lg shadow-[0_0_40px_rgba(202,253,0,0.15)]">
        <QRCode value={uuid} size={220} />
      </div>
      <div className="text-center">
        <p className="font-headline text-2xl font-black uppercase tracking-tighter text-white">{name}</p>
        <p className="text-xs text-white/40 uppercase tracking-widest mt-2">Muestra este código en recepción</p>
      </div>
    </div>
  )
}
```

### `page.tsx` — RSC

```typescript
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import QRDisplay from './QRDisplay'

export default async function MemberQRPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (admin as any)
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center px-6 pb-32">
      <div className="mb-12 text-center">
        <p className="text-white/40 uppercase tracking-[0.2em] text-[10px] font-bold mb-1">Portal Miembro</p>
        <h1 className="font-headline text-4xl font-black uppercase tracking-tighter text-white">
          Mi <span className="text-[#cafd00]">QR</span>
        </h1>
      </div>
      <QRDisplay uuid={user.id} name={profile?.full_name ?? user.email ?? ''} />
    </div>
  )
}
```

### `MemberNav.tsx` — Modificar

Añadir entre Payments y Profile:
```typescript
{ href: '/member/qr', icon: 'qr_code_2', label: 'QR' },
```

### Step N: Build + Lint + Commit

```bash
pnpm build
git add src/app/(member)/member/qr/ src/components/member/MemberNav.tsx
git commit -m "feat(qr): add member QR display page and nav tab"
```

---

## Task 5: CSS animations + globals.css

**Files:**
- Modify: `src/app/globals.css`

El stitch usa `.scan-line { animation: scan 4s linear infinite }` y las `.scanner-frame` pseudo-elements con esquinas lime. Añadir al final de `globals.css`:

```css
@keyframes scan {
  0%   { top: 0%; }
  50%  { top: 100%; }
  100% { top: 0%; }
}
```

Las esquinas del frame se replican con clases Tailwind usando `before:` y `after:` pseudo-elements en `QRScanner.tsx`.

---

## Task 6: Verificación manual

1. **Member QR**: Login como miembro → `/member/qr` → ver QR grande centrado, nombre debajo, tab QR en nav.
2. **Admin Scan — granted**: Login como admin → `/admin/scan` → usar botón "ID Input" → pegar UUID del miembro demo (copiar de la URL de su perfil) → panel derecho muestra nombre, ACTIVE, balance 0, GRANT ACCESS iluminado.
3. **Admin Scan — denied (vencida)**: Pegar UUID de un miembro cuya membresía expiró → DENY ACCESS rojo.
4. **Admin Scan — cámara**: Abrir en móvil → permitir acceso a cámara → apuntar al QR del miembro → resultado aparece automáticamente.
5. **Not found**: Pegar UUID inválido → mensaje "Miembro no encontrado".

### No hay commit final — el usuario lo indicará.
