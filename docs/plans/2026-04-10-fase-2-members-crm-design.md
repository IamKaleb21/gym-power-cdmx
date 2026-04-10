# Fase 2 — Módulo de Miembros (CRM): Design Doc

**Fecha:** 2026-04-10
**Rama:** `feat/fase-2-members-crm`

---

## Objetivo

CRUD completo de miembros con estado de membresía visual, integrado con Supabase Auth para que cada miembro registrado pueda acceder al portal en la Fase 3.

---

## Decisiones de diseño

### Patrón de datos
RSC para lecturas (datos en el render inicial sin estados de carga) + Server Actions solo para mutaciones (create, update, delete). Revalidación con `revalidatePath`. Este patrón es consistente con el setup de Fase 1.

### Creación de miembro
Crea una cuenta Supabase Auth mediante `auth.admin.createUser` (service role). El trigger `handle_new_user` genera automáticamente el registro en `profiles`. El Server Action luego actualiza `phone` en profiles e inserta la membresía inicial en `member_memberships`.

No se usa `supabase.auth.signUp` porque requeriría cookies de sesión del usuario final; `auth.admin.createUser` permite creación server-side sin sesión del miembro.

### Cliente admin (service role)
`src/lib/supabase/admin.ts` — cliente creado con `SUPABASE_SERVICE_ROLE_KEY`. Solo importable desde Server Actions o archivos de servidor. Nunca desde Client Components.

### Estado de membresía
Calculado como función pura en `src/lib/members/status.ts`, sin dependencias de framework. La lógica es:
- `end_date < hoy` → `expired`
- `end_date <= hoy + 7 días` → `expiring_soon`
- `else` → `active`

El cálculo ocurre en el servidor al hacer la query (no como columna almacenada), consistente con el diseño del schema.

---

## Estructura de archivos nueva

```
src/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx                    ← sidebar + topbar compartido
│   │   └── admin/
│   │       └── members/
│   │           ├── page.tsx              ← RSC: lista de miembros
│   │           ├── new/page.tsx          ← formulario de creación
│   │           └── [id]/page.tsx         ← detalle/edición/membresía
│   └── actions/
│       └── members.ts                    ← Server Actions CRUD
├── components/
│   └── members/
│       └── MemberStatusBadge.tsx
├── lib/
│   ├── supabase/
│   │   └── admin.ts                      ← cliente service role
│   ├── validations/
│   │   └── member.schema.ts              ← Zod schemas
│   └── members/
│       └── status.ts                     ← lógica pura de estado
└── tests/
    └── members.test.ts                   ← unit tests TDD
```

---

## Flujo de creación de miembro

```
Admin llena form → createMember(formData)
  → zod.safeParse (valida)
  → auth.admin.createUser(email, password, user_metadata)
  → trigger handle_new_user → INSERT profiles
  → UPDATE profiles SET phone=...
  → INSERT member_memberships (plan_id, start/end_date)
  → revalidatePath('/admin/members')
```

---

## Páginas y componentes

### Layout admin (`(admin)/layout.tsx`)
Calco de `docs/stitch/06-admin-members-unified.html`:
- Sidebar fijo desktop (lg+): logo, nav items con ítem activo en `#cafd00` + borde izquierdo
- TopAppBar con blur, búsqueda, notificaciones, avatar
- Bottom nav mobile
- FAB "Add Member" en mobile

### `/admin/members` (lista)
- Título `Members.` Space Grotesk 8xl, contadores activos/por vencer
- Grid 12-col: Member Identity | Status | Plan Type | Contact | Actions
- Filas: foto grayscale→color en hover, `MemberStatusBadge`, plan+fecha renovación, teléfono
- Paginación con estilo Stitch

### `MemberStatusBadge`
| Estado | Color texto | bg/border |
|---|---|---|
| active | `#cafd00` | `primary-container/10` + `border-primary-container/20` |
| expiring_soon | `#fce047` | `tertiary-container/10` + `border-tertiary-container/20` |
| expired | `#ff7351` | `error/10` + `border-error/20` |

### `/admin/members/new`
- 2 columnas: datos de cuenta (nombre, email, contraseña temporal) + membresía (plan, fecha inicio, fecha fin calculada)
- Teléfono opcional
- Fecha de fin se calcula automáticamente al seleccionar plan (`start_date + plan.duration_days`)

### `/admin/members/[id]`
- Header: avatar (con upload via Storage), nombre, `#GP-CDMX-XXXX`, MemberStatusBadge
- Tabs:
  - **Perfil** — editar full_name, email, phone
  - **Membresía** — plan actual, historial, renovar/asignar nuevo plan
  - **Pagos** — tabla read-only (registros de payments del miembro; creación en Fase 6)

### Avatar upload
Client Component en la página `[id]`. Usa `supabase.storage.from('avatars').upload('members/{id}/avatar', file)`. Al completar, llama Server Action `updateMemberAvatar(memberId, publicUrl)` que actualiza `profiles.avatar_url`.

---

## Zod schemas

```ts
// createMemberSchema
{
  full_name: z.string().min(2),
  email: z.string().email(),
  temp_password: z.string().min(8),
  phone: z.string().optional(),
  plan_id: z.string().uuid(),
  start_date: z.string(),  // ISO date
}

// updateMemberSchema — partial sin password
// Membresía es opcional (puede editarse sin cambiar plan)
```

---

## TDD — tests previos a implementación

`src/tests/members.test.ts`:
- `getMemberStatus`: retorna `active` si `end_date > hoy`
- `getMemberStatus`: retorna `expiring_soon` si `end_date <= hoy + 7 días`
- `getMemberStatus`: retorna `expired` si `end_date < hoy`
- `createMemberSchema.safeParse`: falla si falta `full_name`, `email`, `plan_id`
- `createMemberSchema.safeParse`: falla si `email` no es válido
- `createMemberSchema.safeParse`: falla si `temp_password` < 8 caracteres

---

## Commits esperados

```
test: add unit tests for member status logic and Zod schemas
feat: add admin supabase client and member Zod validations
feat: implement member CRUD Server Actions (create, update, delete)
feat: build admin layout with sidebar navigation
feat: build admin members list with status badges and pagination
feat: build member create and detail/edit pages with plan assignment
feat: add avatar upload to member detail via Supabase Storage
```
