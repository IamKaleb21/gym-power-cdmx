# Fase 6 — Módulo de Finanzas: Design Doc

## Objetivo

Registro manual de pagos por admin, vista global con métricas financieras, y cambio de status paid↔pending. El historial por miembro ya existe en `/member/payments` (Fase 3).

---

## Decisiones

### Form de registro en página única
El stitch `03-admin-payments-unified.html` integra el form en el `aside` derecho de la lista — no como ruta separada `/admin/payments/new`. Seguimos este layout exacto.

### Member selector
`<select>` con todos los miembros (full_name + email) cargado en el RSC — suficiente para el volumen de un gimnasio, sin necesidad de autocomplete JS.

### Campo `due_date` condicional
Solo aparece cuando el admin selecciona status "Pending" en el form. Controlado por `useState` en `RegisterPaymentForm`.

### `created_by`
El Server Action `registerPayment` obtiene `auth.uid()` con `createClient()` (session) para registrar quién creó el pago — cumple el schema.

### Métricas del hero
- **MRR**: `SUM(amount) WHERE status='paid' AND payment_date >= primer día del mes actual`
- **Average Ticket**: `MRR / count(paid this month)`
- **Adeudos**: `SUM(amount) WHERE status='pending'`
- **Cuentas pendientes**: `COUNT WHERE status='pending'`
- Churn Rate: placeholder estático (no hay datos suficientes en el schema para calcularlo)

### ToggleStatusButton
Client Component inline en cada fila de transacción — llama `updatePaymentStatus(id, nuevoStatus)` y hace `router.refresh()`. Sin navegación.

### Indicador de saldo en `/admin/members/[id]`
Agregar un badge con el total de adeudos pendientes en la sección de pagos del perfil del miembro (sin nueva query — ya se cargan los pagos en esa página).

---

## Stitch de referencia

- Admin: `docs/stitch/03-admin-payments-unified.html`
- Miembro: `docs/stitch/13-member-payment-history.html` (ya implementado en Fase 3)
