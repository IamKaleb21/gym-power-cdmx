# Fase 2 — Módulo de Miembros (CRM) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** CRUD completo de miembros con estado de membresía visual, layout admin compartido con sidebar, y upload de avatar.

**Architecture:** RSC para lecturas + Server Actions solo para mutaciones. Creación de miembro usa `auth.admin.createUser` (service role) para crear cuenta Auth + el trigger `handle_new_user` genera el perfil automáticamente. Estado de membresía es una función pura derivada de `end_date`.

**Tech Stack:** Next.js 16 App Router, Supabase SSR + Admin API, Zod 4, shadcn/ui, Tailwind CSS 4, Vitest, Space Grotesk + Inter fonts, `docs/stitch/06-admin-members-unified.html` como referencia de UI.

---

## Prerequisitos a verificar antes de empezar

```bash
git branch --show-current   # debe mostrar: feat/fase-2-members-crm
pnpm test                   # todos los tests deben pasar
pnpm build                  # build limpio
```

---

## Task 1: Lógica pura de estado + tests (TDD RED)

**Files:**
- Create: `src/lib/members/status.ts`
- Create: `src/tests/members.test.ts`

### Step 1: Escribir los tests que FALLAN

```ts
// src/tests/members.test.ts
import { describe, it, expect } from 'vitest'
import { getMemberStatus } from '@/lib/members/status'

function dateOffset(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

describe('getMemberStatus', () => {
  it('returns active when end_date is 30 days away', () => {
    expect(getMemberStatus(dateOffset(30))).toBe('active')
  })

  it('returns expiring_soon when end_date is exactly 7 days away', () => {
    expect(getMemberStatus(dateOffset(7))).toBe('expiring_soon')
  })

  it('returns expiring_soon when end_date is 3 days away', () => {
    expect(getMemberStatus(dateOffset(3))).toBe('expiring_soon')
  })

  it('returns expired when end_date is yesterday', () => {
    expect(getMemberStatus(dateOffset(-1))).toBe('expired')
  })

  it('returns expired when end_date is today', () => {
    expect(getMemberStatus(dateOffset(0))).toBe('expired')
  })
})
```

### Step 2: Correr el test — debe FALLAR

```bash
pnpm test src/tests/members.test.ts
# Expected: FAIL — "Cannot find module @/lib/members/status"
```

### Step 3: Implementar lógica mínima

```ts
// src/lib/members/status.ts
export type MemberStatus = 'active' | 'expiring_soon' | 'expired'

export function getMemberStatus(endDate: string): MemberStatus {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setUTCHours(0, 0, 0, 0)
  const threshold = new Date(today)
  threshold.setUTCDate(today.getUTCDate() + 7)

  if (end < today) return 'expired'
  if (end <= threshold) return 'expiring_soon'
  return 'active'
}
```

### Step 4: Correr el test — debe PASAR

```bash
pnpm test src/tests/members.test.ts
# Expected: PASS — 5 tests passed
```

### Step 5: Commit

```bash
git add src/lib/members/status.ts src/tests/members.test.ts
git commit -m "test: add unit tests for member status logic and implement getMemberStatus"
```

---

## Task 2: Zod schemas + tests de validación

**Files:**
- Create: `src/lib/validations/member.schema.ts`
- Modify: `src/tests/members.test.ts` (agregar suite de validación)

### Step 1: Agregar tests de schema al archivo existente

Agregar al final de `src/tests/members.test.ts`:

```ts
import { createMemberSchema } from '@/lib/validations/member.schema'

describe('createMemberSchema', () => {
  const valid = {
    full_name: 'Juan Pérez',
    email: 'juan@example.com',
    temp_password: 'Secreta123',
    plan_id: '00000000-0000-0000-0000-000000000001',
    start_date: '2026-04-10',
  }

  it('passes with valid data', () => {
    expect(createMemberSchema.safeParse(valid).success).toBe(true)
  })

  it('fails when full_name is missing', () => {
    const { full_name, ...rest } = valid
    expect(createMemberSchema.safeParse(rest).success).toBe(false)
  })

  it('fails when email is invalid', () => {
    expect(createMemberSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('fails when temp_password has fewer than 8 chars', () => {
    expect(createMemberSchema.safeParse({ ...valid, temp_password: 'short' }).success).toBe(false)
  })

  it('fails when plan_id is not a UUID', () => {
    expect(createMemberSchema.safeParse({ ...valid, plan_id: 'not-a-uuid' }).success).toBe(false)
  })

  it('allows optional phone', () => {
    expect(createMemberSchema.safeParse({ ...valid, phone: '+52 55 1234 5678' }).success).toBe(true)
  })
})
```

### Step 2: Correr — debe FALLAR

```bash
pnpm test src/tests/members.test.ts
# Expected: FAIL — "Cannot find module @/lib/validations/member.schema"
```

### Step 3: Crear el schema

```ts
// src/lib/validations/member.schema.ts
import { z } from 'zod'

export const createMemberSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  temp_password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  phone: z.string().optional(),
  plan_id: z.string().uuid('Plan inválido'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'),
})

export const updateMemberSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().optional(),
})

export type CreateMemberInput = z.infer<typeof createMemberSchema>
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>
```

### Step 4: Correr — debe PASAR

```bash
pnpm test src/tests/members.test.ts
# Expected: PASS — todos los tests
```

### Step 5: Commit

```bash
git add src/lib/validations/member.schema.ts src/tests/members.test.ts
git commit -m "feat: add member Zod schemas with validation tests"
```

---

## Task 3: Cliente Supabase con service role

**Files:**
- Create: `src/lib/supabase/admin.ts`

> IMPORTANTE: Este cliente usa `SUPABASE_SERVICE_ROLE_KEY`. NUNCA importarlo desde un Client Component (archivos con `"use client"`). Solo usar en Server Actions y archivos de servidor.

```ts
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRole) {
    throw new Error('Missing Supabase admin env vars')
  }

  return createClient<Database>(url, serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
```

### Commit

```bash
git add src/lib/supabase/admin.ts
git commit -m "feat: add supabase admin client with service role key"
```

---

## Task 4: Server Actions de miembros

**Files:**
- Create: `src/app/actions/members.ts`

```ts
// src/app/actions/members.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { createMemberSchema, updateMemberSchema } from '@/lib/validations/member.schema'

export async function createMember(formData: FormData) {
  const raw = {
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    temp_password: formData.get('temp_password'),
    phone: formData.get('phone') || undefined,
    plan_id: formData.get('plan_id'),
    start_date: formData.get('start_date'),
  }

  const parsed = createMemberSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { full_name, email, temp_password, phone, plan_id, start_date } = parsed.data
  const admin = createAdminClient()

  // 1. Crear usuario en Auth (el trigger handle_new_user crea el perfil automáticamente)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: temp_password,
    email_confirm: true,
    user_metadata: { full_name, role: 'member' },
  })

  if (authError || !authData.user) {
    return { error: { _root: authError?.message ?? 'Error al crear usuario' } }
  }

  const memberId = authData.user.id

  // 2. Actualizar phone en profiles (el trigger no lo incluye)
  if (phone) {
    await admin.from('profiles').update({ phone }).eq('id', memberId)
  }

  // 3. Obtener duración del plan
  const { data: plan } = await admin
    .from('membership_plans')
    .select('duration_days')
    .eq('id', plan_id)
    .single()

  if (!plan) {
    return { error: { plan_id: ['Plan no encontrado'] } }
  }

  // 4. Calcular end_date
  const startDateObj = new Date(start_date)
  const endDateObj = new Date(startDateObj)
  endDateObj.setUTCDate(startDateObj.getUTCDate() + plan.duration_days)
  const end_date = endDateObj.toISOString().slice(0, 10)

  // 5. Crear membresía
  const { error: membershipError } = await admin.from('member_memberships').insert({
    member_id: memberId,
    plan_id,
    start_date,
    end_date,
  })

  if (membershipError) {
    return { error: { _root: membershipError.message } }
  }

  revalidatePath('/admin/members')
  return { success: true, memberId }
}

export async function updateMember(memberId: string, formData: FormData) {
  const raw = {
    full_name: formData.get('full_name') || undefined,
    phone: formData.get('phone') || undefined,
  }

  const parsed = updateMemberSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update(parsed.data)
    .eq('id', memberId)

  if (error) return { error: { _root: error.message } }

  revalidatePath(`/admin/members/${memberId}`)
  revalidatePath('/admin/members')
  return { success: true }
}

export async function deleteMember(memberId: string) {
  const admin = createAdminClient()

  const { error } = await admin.auth.admin.deleteUser(memberId)
  if (error) return { error: error.message }

  revalidatePath('/admin/members')
  return { success: true }
}

export async function updateMemberAvatar(memberId: string, avatarUrl: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl })
    .eq('id', memberId)

  if (error) return { error: error.message }
  revalidatePath(`/admin/members/${memberId}`)
  return { success: true }
}
```

### Verificar build

```bash
pnpm build
# Expected: BUILD SUCCESS
```

### Commit

```bash
git add src/app/actions/members.ts
git commit -m "feat: implement member CRUD Server Actions with auth.admin and Zod validation"
```

---

## Task 5: Admin Layout con sidebar

**Files:**
- Create: `src/app/(admin)/layout.tsx`

Calcar EXACTAMENTE de `docs/stitch/06-admin-members-unified.html`. Fuentes: `Space Grotesk` + `Inter` via `next/font/google`. Material Symbols via etiqueta `<link>` en el layout.

```tsx
// src/app/(admin)/layout.tsx
import type { ReactNode } from 'react'
import { Space_Grotesk, Inter } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

const navItems = [
  { href: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/admin/members', icon: 'group', label: 'Members' },
  { href: '/admin/classes', icon: 'calendar_today', label: 'Classes' },
  { href: '/admin/trainers', icon: 'fitness_center', label: 'Trainers' },
  { href: '/admin/payments', icon: 'payments', label: 'Payments' },
  { href: '/admin/scan', icon: 'qr_code_scanner', label: 'Scan' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`dark ${spaceGrotesk.variable} ${inter.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0e0e0e] text-white min-h-screen">
        {/* Sidebar desktop */}
        <aside className="fixed h-screen w-64 left-0 top-0 bg-[#0e0e0e] flex flex-col py-8 px-4 z-40 hidden lg:flex">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-[#cafd00] flex items-center justify-center rounded-sm">
              <span className="material-symbols-outlined text-[#0e0e0e] font-black">bolt</span>
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter text-[#cafd00] font-headline uppercase leading-none">GYM POWER</h2>
              <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold font-headline">ADMIN PORTAL</p>
            </div>
          </div>
          <AdminNav items={navItems} />
          <a
            href="/admin/members/new"
            className="mt-auto bg-[#cafd00] text-[#516700] font-headline font-black py-4 rounded-sm flex items-center justify-center gap-2 hover:bg-[#f3ffca] transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">person_add</span>
            Add Member
          </a>
        </aside>

        {/* TopAppBar */}
        <header className="flex justify-between items-center w-full px-8 h-20 fixed top-0 z-50 bg-[#0e0e0e]/70 backdrop-blur-xl lg:pl-72">
          <span className="text-xl font-black text-[#cafd00] font-headline uppercase tracking-tighter lg:hidden">GYM POWER CDMX</span>
          <div className="flex items-center gap-4 ml-auto">
            <div className="hidden lg:flex items-center bg-[#131313] px-3 py-1.5 rounded-lg border border-white/10">
              <span className="material-symbols-outlined text-white/40 text-sm mr-2">search</span>
              <input className="bg-transparent border-none focus:ring-0 text-sm w-48 font-body placeholder-white/30 outline-none" placeholder="Search members..." type="text" />
            </div>
            <button className="text-white/40 hover:text-[#f3ffca] transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="lg:ml-64 pt-24 pb-20 lg:pb-8 min-h-screen">
          {children}
        </main>

        {/* Bottom nav mobile */}
        <nav className="fixed bottom-0 w-full flex justify-around items-center px-4 py-3 lg:hidden bg-[#0e0e0e]/80 backdrop-blur-2xl z-50 rounded-t-lg shadow-[0_-4px_30px_rgba(202,253,0,0.1)]">
          <a href="/admin/members/new" className="flex flex-col items-center justify-center text-white/50 hover:text-[#cafd00] transition-colors">
            <span className="material-symbols-outlined">person_add</span>
            <span className="text-[10px] uppercase font-bold tracking-widest font-headline">Add</span>
          </a>
          <a href="/admin/members" className="flex flex-col items-center justify-center text-white/50 hover:text-[#cafd00] transition-colors">
            <span className="material-symbols-outlined">group</span>
            <span className="text-[10px] uppercase font-bold tracking-widest font-headline">Members</span>
          </a>
          <a href="/admin/dashboard" className="flex flex-col items-center justify-center bg-[#cafd00] text-[#0e0e0e] rounded-sm px-4 py-1 scale-110">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-[10px] uppercase font-bold tracking-widest font-headline">Home</span>
          </a>
        </nav>
      </body>
    </html>
  )
}
```

Crear también el componente `AdminNav` para manejar el estado activo del nav item. Debe usar `usePathname` de `next/navigation` y ser un Client Component (`"use client"`):

```tsx
// src/components/admin/AdminNav.tsx
'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

type NavItem = { href: string; icon: string; label: string }

export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  return (
    <nav className="flex-1 space-y-1">
      {items.map((item) => {
        const active = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 font-headline tracking-tight transition-colors duration-200 active:scale-[0.98] ${
              active
                ? 'text-[#cafd00] font-bold border-l-4 border-[#cafd00] bg-[#262626]'
                : 'text-gray-500 font-medium hover:text-white hover:bg-[#262626] rounded-sm'
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
```

> NOTA: El layout admin va en `src/app/(admin)/layout.tsx`. Esto reemplaza cualquier `html`/`body` del root layout para las rutas admin — verificar que el root `layout.tsx` NO envuelva con `<html>` si ya lo hace el admin layout, o eliminar el `<html>/<body>` del admin layout y manejarlo solo en el root.

> VERIFICAR primero `src/app/layout.tsx` — si ya contiene `<html><body>`, el admin layout NO debe repetilos. Solo usar `<>...</>` como wrapper.

### Verificar

```bash
pnpm build
```

### Commit

```bash
git add src/app/\(admin\)/layout.tsx src/components/admin/AdminNav.tsx
git commit -m "feat: build admin layout with sidebar navigation and mobile bottom nav"
```

---

## Task 6: Página de lista de miembros

**Files:**
- Modify: `src/app/(admin)/admin/members/page.tsx` (crear si no existe)

Calcar de `docs/stitch/06-admin-members-unified.html`. El componente `MemberStatusBadge` se crea aquí también.

### Crear `MemberStatusBadge`

```tsx
// src/components/members/MemberStatusBadge.tsx
import type { MemberStatus } from '@/lib/members/status'

const config: Record<MemberStatus, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-[#cafd00]/10 text-[#cafd00] border border-[#cafd00]/20',
  },
  expiring_soon: {
    label: 'Expiring Soon',
    className: 'bg-[#fce047]/10 text-[#fce047] border border-[#fce047]/20',
  },
  expired: {
    label: 'Expired',
    className: 'bg-[#ff7351]/10 text-[#ff7351] border border-[#ff7351]/20',
  },
}

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-sm ${className}`}>
      {label}
    </span>
  )
}
```

### Crear la página de lista

```tsx
// src/app/(admin)/admin/members/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getMemberStatus } from '@/lib/members/status'
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge'

export default async function MembersPage() {
  const supabase = await createClient()

  const { data: members } = await supabase
    .from('profiles')
    .select(`
      id, full_name, email, phone, avatar_url,
      member_memberships (
        end_date,
        membership_plans ( name )
      )
    `)
    .eq('role', 'member')
    .order('created_at', { ascending: false })

  const membersWithStatus = (members ?? []).map((m) => {
    const latestMembership = m.member_memberships?.[0]
    const status = latestMembership
      ? getMemberStatus(latestMembership.end_date)
      : ('expired' as const)
    return { ...m, status, latestMembership }
  })

  const totalActive = membersWithStatus.filter((m) => m.status === 'active').length
  const totalExpiringSoon = membersWithStatus.filter((m) => m.status === 'expiring_soon').length

  return (
    <div className="px-4 lg:px-12 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter uppercase leading-none mb-2">
            Members<span className="text-[#cafd00]">.</span>
          </h1>
          <div className="flex items-center gap-4 text-white/50 text-sm">
            <span><b className="text-white">{totalActive}</b> Total Active</span>
            <span className="w-1 h-1 bg-white/20 rounded-full" />
            <span><b className="text-[#ff7351]">{totalExpiringSoon}</b> Expiring Soon</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="bg-[#262626] text-white px-6 py-3 font-headline font-bold rounded-lg flex items-center gap-2 hover:bg-[#333] transition-colors">
            <span className="material-symbols-outlined">filter_list</span>
            Filters
          </button>
          <Link
            href="/admin/members/new"
            className="bg-[#cafd00] text-[#516700] px-8 py-3 font-headline font-black rounded-lg flex items-center gap-2 hover:bg-[#f3ffca] transition-colors shadow-[0_0_20px_rgba(202,253,0,0.3)]"
          >
            <span className="material-symbols-outlined">add</span>
            Register New Member
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="grid grid-cols-1 gap-1">
        <div className="bg-[#131313] px-8 py-4 rounded-t-xl hidden md:grid grid-cols-12 items-center text-[10px] uppercase tracking-widest font-black text-white/40">
          <div className="col-span-4">Member Identity</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-3">Plan Type</div>
          <div className="col-span-2">Contact</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="space-y-1">
          {membersWithStatus.map((member, i) => (
            <div
              key={member.id}
              className={`group hover:bg-[#262626] transition-colors px-6 lg:px-8 py-6 md:grid md:grid-cols-12 items-center flex flex-col gap-4 ${
                i % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#131313]'
              }`}
            >
              <div className="col-span-4 flex items-center gap-4 w-full">
                <div className="relative">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.full_name}
                      className="w-14 h-14 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-[#262626] flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/30 text-2xl">person</span>
                    </div>
                  )}
                  {member.status === 'active' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#cafd00] rounded-full border-4 border-[#0e0e0e]" />
                  )}
                </div>
                <div>
                  <h3 className={`font-headline font-black text-lg leading-tight uppercase ${member.status === 'expired' ? 'text-[#ff7351]' : ''}`}>
                    {member.full_name}
                  </h3>
                  <p className="text-xs text-white/40 font-label">
                    {member.email}
                  </p>
                </div>
              </div>

              <div className="col-span-2 flex justify-center w-full">
                <MemberStatusBadge status={member.status} />
              </div>

              <div className="col-span-3 w-full">
                <p className={`text-sm font-bold font-headline uppercase tracking-tight ${member.status === 'expired' ? 'text-white/40 line-through' : ''}`}>
                  {member.latestMembership?.membership_plans?.name ?? '—'}
                </p>
                {member.latestMembership && (
                  <p className={`text-[10px] uppercase font-bold ${
                    member.status === 'expired' ? 'text-[#ff7351]' :
                    member.status === 'expiring_soon' ? 'text-[#fce047] italic' :
                    'text-white/40'
                  }`}>
                    {member.status === 'expired'
                      ? `Expired ${member.latestMembership.end_date}`
                      : `Renews ${member.latestMembership.end_date}`}
                  </p>
                )}
              </div>

              <div className="col-span-2 w-full text-white/40 font-mono text-sm">
                {member.phone ?? '—'}
              </div>

              <div className="col-span-1 flex justify-end gap-3 w-full">
                <Link
                  href={`/admin/members/${member.id}`}
                  className="p-2 hover:bg-[#cafd00] hover:text-[#516700] rounded-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#1a1a1a] py-4 px-8 rounded-b-xl flex justify-between items-center">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            {membersWithStatus.length} Members
          </span>
        </div>
      </div>
    </div>
  )
}
```

### Verificar

```bash
pnpm build
```

### Commit

```bash
git add src/app/\(admin\)/admin/members/page.tsx src/components/members/MemberStatusBadge.tsx
git commit -m "feat: build admin members list with status badges"
```

---

## Task 7: Página de creación de miembro

**Files:**
- Create: `src/app/(admin)/admin/members/new/page.tsx`

Esta página tiene un formulario client-side (react-hook-form) que llama al Server Action `createMember`.

```tsx
// src/app/(admin)/admin/members/new/page.tsx
import { createClient } from '@/lib/supabase/server'
import { NewMemberForm } from './NewMemberForm'

export default async function NewMemberPage() {
  const supabase = await createClient()
  const { data: plans } = await supabase
    .from('membership_plans')
    .select('id, name, price, duration_days')
    .order('price')

  return (
    <div className="px-4 lg:px-12 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-5xl md:text-7xl font-black font-headline tracking-tighter uppercase leading-none mb-2">
          New Member<span className="text-[#cafd00]">.</span>
        </h1>
        <p className="text-white/40 text-sm">Registrar nuevo miembro y asignar plan de membresía.</p>
      </div>
      <NewMemberForm plans={plans ?? []} />
    </div>
  )
}
```

Crear `NewMemberForm` como Client Component en el mismo directorio:

```tsx
// src/app/(admin)/admin/members/new/NewMemberForm.tsx
'use client'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { createMember } from '@/app/actions/members'

type Plan = { id: string; name: string; price: number; duration_days: number }

export function NewMemberForm({ plans }: { plans: Plan[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createMember(formData)
      if (result.success) {
        router.push('/admin/members')
      }
      // TODO: manejar errores con setError state
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Cuenta */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-white/40 font-headline">Datos de cuenta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2 font-headline">Nombre completo *</label>
            <input name="full_name" required className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00] transition-colors" placeholder="Ej. Juan Pérez" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2 font-headline">Email *</label>
            <input name="email" type="email" required className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00] transition-colors" placeholder="juan@ejemplo.com" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2 font-headline">Contraseña temporal *</label>
            <input name="temp_password" type="password" required minLength={8} className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00] transition-colors" placeholder="Mín. 8 caracteres" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2 font-headline">Teléfono</label>
            <input name="phone" className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00] transition-colors" placeholder="+52 55 1234 5678" />
          </div>
        </div>
      </div>

      {/* Membresía */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest text-white/40 font-headline">Membresía</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2 font-headline">Plan *</label>
            <select name="plan_id" required className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00] transition-colors">
              <option value="">Seleccionar plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.price} MXN / {p.duration_days} días
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2 font-headline">Fecha de inicio *</label>
            <input
              name="start_date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => router.push('/admin/members')}
          className="px-8 py-3 bg-[#262626] text-white font-headline font-bold rounded-lg hover:bg-[#333] transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-3 bg-[#cafd00] text-[#516700] font-headline font-black rounded-lg hover:bg-[#f3ffca] transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(202,253,0,0.3)]"
        >
          {isPending ? 'Registrando...' : 'Registrar Miembro'}
        </button>
      </div>
    </form>
  )
}
```

### Verificar

```bash
pnpm build
```

### Commit

```bash
git add src/app/\(admin\)/admin/members/new/
git commit -m "feat: build member registration form with plan assignment"
```

---

## Task 8: Página de detalle del miembro

**Files:**
- Create: `src/app/(admin)/admin/members/[id]/page.tsx`
- Create: `src/app/(admin)/admin/members/[id]/AvatarUpload.tsx`
- Create: `src/app/(admin)/admin/members/[id]/EditMemberForm.tsx`

### Página principal (RSC)

```tsx
// src/app/(admin)/admin/members/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getMemberStatus } from '@/lib/members/status'
import { MemberStatusBadge } from '@/components/members/MemberStatusBadge'
import { AvatarUpload } from './AvatarUpload'
import { EditMemberForm } from './EditMemberForm'

export default async function MemberDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('profiles')
    .select(`
      id, full_name, email, phone, avatar_url, created_at,
      member_memberships (
        id, start_date, end_date,
        membership_plans ( name, price )
      ),
      payments ( id, amount, concept, status, payment_date, created_at )
    `)
    .eq('id', params.id)
    .eq('role', 'member')
    .single()

  if (!member) notFound()

  const memberships = member.member_memberships ?? []
  const latestMembership = memberships[0]
  const status = latestMembership ? getMemberStatus(latestMembership.end_date) : 'expired'

  return (
    <div className="px-4 lg:px-12 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-10">
        <AvatarUpload memberId={member.id} currentUrl={member.avatar_url} />
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-black font-headline tracking-tighter uppercase">{member.full_name}</h1>
            <MemberStatusBadge status={status} />
          </div>
          <p className="text-white/40 text-sm">{member.email}</p>
        </div>
      </div>

      {/* Tabs: Perfil | Membresía | Pagos */}
      <div className="space-y-8">
        {/* Perfil */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest text-white/40 font-headline mb-4">Perfil</h2>
          <EditMemberForm
            memberId={member.id}
            initialData={{ full_name: member.full_name, phone: member.phone ?? '' }}
          />
        </section>

        {/* Membresía */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest text-white/40 font-headline mb-4">Historial de Membresía</h2>
          <div className="space-y-2">
            {memberships.length === 0 && (
              <p className="text-white/30 text-sm">Sin membresías registradas.</p>
            )}
            {memberships.map((m) => (
              <div key={m.id} className="bg-[#1a1a1a] rounded-xl px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="font-headline font-bold uppercase tracking-tight">{m.membership_plans?.name ?? '—'}</p>
                  <p className="text-xs text-white/40">{m.start_date} → {m.end_date}</p>
                </div>
                <MemberStatusBadge status={getMemberStatus(m.end_date)} />
              </div>
            ))}
          </div>
        </section>

        {/* Pagos (read-only) */}
        <section>
          <h2 className="text-xs font-black uppercase tracking-widest text-white/40 font-headline mb-4">Pagos</h2>
          {(member.payments?.length ?? 0) === 0 ? (
            <p className="text-white/30 text-sm">Sin pagos registrados.</p>
          ) : (
            <div className="space-y-2">
              {member.payments?.map((p) => (
                <div key={p.id} className="bg-[#1a1a1a] rounded-xl px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-headline font-bold uppercase tracking-tight text-sm">{p.concept}</p>
                    <p className="text-xs text-white/40">{p.payment_date ?? p.created_at?.slice(0, 10)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">${p.amount} MXN</p>
                    <span className={`text-[10px] uppercase font-black ${p.status === 'paid' ? 'text-[#cafd00]' : 'text-[#fce047]'}`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
```

### EditMemberForm (Client Component)

```tsx
// src/app/(admin)/admin/members/[id]/EditMemberForm.tsx
'use client'
import { useTransition } from 'react'
import { updateMember } from '@/app/actions/members'

type Props = {
  memberId: string
  initialData: { full_name: string; phone: string }
}

export function EditMemberForm({ memberId, initialData }: Props) {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      await updateMember(memberId, formData)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2 font-headline">Nombre completo</label>
          <input name="full_name" defaultValue={initialData.full_name} className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00] transition-colors" />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-white/60 mb-2 font-headline">Teléfono</label>
          <input name="phone" defaultValue={initialData.phone} className="w-full bg-[#262626] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#cafd00] transition-colors" placeholder="+52 55 1234 5678" />
        </div>
      </div>
      <button type="submit" disabled={isPending} className="px-8 py-3 bg-[#cafd00] text-[#516700] font-headline font-black rounded-lg hover:bg-[#f3ffca] transition-colors disabled:opacity-50">
        {isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
```

### AvatarUpload (Client Component)

```tsx
// src/app/(admin)/admin/members/[id]/AvatarUpload.tsx
'use client'
import { useTransition, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateMemberAvatar } from '@/app/actions/members'

type Props = { memberId: string; currentUrl: string | null }

export function AvatarUpload({ memberId, currentUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    startTransition(async () => {
      const supabase = createClient()
      const path = `members/${memberId}/avatar`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        console.error(uploadError)
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await updateMemberAvatar(memberId, data.publicUrl)
    })
  }

  return (
    <div
      className="relative w-24 h-24 cursor-pointer group"
      onClick={() => inputRef.current?.click()}
    >
      {currentUrl ? (
        <img src={currentUrl} alt="Avatar" className="w-24 h-24 rounded-xl object-cover" />
      ) : (
        <div className="w-24 h-24 rounded-xl bg-[#262626] flex items-center justify-center">
          <span className="material-symbols-outlined text-white/30 text-4xl">person</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="material-symbols-outlined text-white text-xl">
          {isPending ? 'hourglass_empty' : 'photo_camera'}
        </span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
```

### Verificar

```bash
pnpm test
pnpm build
```

### Commit

```bash
git add src/app/\(admin\)/admin/members/\[id\]/
git commit -m "feat: build member detail page with profile edit, membership history and avatar upload"
```

---

## Task 9: Verificación final

```bash
pnpm test
# Expected: todos los tests pasan (incluyendo members.test.ts)

pnpm build
# Expected: BUILD SUCCESS sin errores de tipo
```

Si hay errores de TypeScript por los tipos generados de Supabase (por ejemplo, el select anidado no reconoce `membership_plans` como objeto sino como array), usar `[0]` o ajustar el query con `limit(1)` en el join.

### Commit final si hay ajustes

```bash
git add -A
git commit -m "fix: resolve TypeScript type errors in members module"
```

---

## Resumen de commits esperados

1. `test: add unit tests for member status logic and implement getMemberStatus`
2. `feat: add member Zod schemas with validation tests`
3. `feat: add supabase admin client with service role key`
4. `feat: implement member CRUD Server Actions with auth.admin and Zod validation`
5. `feat: build admin layout with sidebar navigation and mobile bottom nav`
6. `feat: build admin members list with status badges`
7. `feat: build member registration form with plan assignment`
8. `feat: build member detail page with profile edit, membership history and avatar upload`
