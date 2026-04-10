# Fase 8 — QR Check-in: Design Doc

## Objetivo

QR personal por miembro en el portal móvil + scanner de validación en recepción admin. El QR codifica el `profiles.id` (UUID) del miembro; el scanner lo valida contra membresía activa y saldo pendiente.

---

## Decisiones

### El QR es simplemente el UUID del perfil
No se necesita tabla adicional. `profiles.id` es único, opaco para el miembro y suficiente para la validación. YAGNI.

### Lógica de acceso pura en `src/lib/qr/access.ts`
`getAccessStatus({ endDate, pendingBalance, today })` → `'granted' | 'denied'` con su `denyReason`. Testeable con Vitest sin mocks de Supabase.

### Server Action con admin client
`validateMemberByUUID` usa `createAdminClient()` para que el recepcionista (logueado como admin) pueda ver cualquier perfil, membresía y pagos sin restricción de RLS.

### Scanner: `html5-qrcode` (ya instalado)
Se inicializa en `useEffect` en un `<div id="qr-reader">`. Al detectar un UUID, llama el Server Action y actualiza el panel derecho. Botón "ID Input" permite ingresar UUID manualmente.

### Sin descarga de QR (YAGNI)
`react-qr-code` renderiza SVG; exportar PNG requiere canvas hack. No es necesario para el flujo de recepción.

### Feedback visual DENY / GRANT ACCESS
Botones del stitch son puramente visuales:
- `granted` → GRANT ACCESS en `bg-[#cafd00]`, DENY apagado
- `denied` → DENY ACCESS en `bg-error`, GRANT apagado

---

## Flujo de datos

```
[Miembro abre /member/qr]
  → RSC obtiene user con createClient()
  → Renderiza <QRDisplay uuid={user.id} name={profile.full_name} />
  → react-qr-code SVG centrado en pantalla

[Admin en /admin/scan]
  → html5-qrcode detecta UUID en cámara (o manual)
  → llama validateMemberByUUID(uuid) Server Action
  → Server Action: profiles + member_memberships + payments (parallel)
  → getAccessStatus() calcula granted/denied
  → MemberResultPanel muestra resultado
```

---

## Lógica de acceso

```
granted si:
  - end_date >= today  (membresía vigente)
  - pendingBalance === 0

denied si:
  - end_date < today   → denyReason: 'Membresía vencida'
  - pendingBalance > 0 → denyReason: 'Adeudo pendiente: $X MXN'
  - sin membresía      → denyReason: 'Sin membresía registrada'
```

---

## Archivos

```
src/
  lib/qr/access.ts                             ← getAccessStatus() pura
  tests/qr-checkin.test.ts                     ← 5 tests TDD
  app/
    actions/qr.ts                              ← validateMemberByUUID() Server Action
    (admin)/admin/scan/
      page.tsx                                 ← RSC shell (layout split h-screen)
      QRScanner.tsx                            ← Client: html5-qrcode + ID Input
      MemberResultPanel.tsx                    ← Client: idle/loading/granted/denied
    (member)/member/qr/
      page.tsx                                 ← RSC: fetch perfil + render QRDisplay
      QRDisplay.tsx                            ← Client: react-qr-code SVG
  components/member/MemberNav.tsx              ← Modify: añadir tab QR
```

---

## Stitch de referencia

- Admin scanner: `docs/stitch/01-admin-scan-unified.html`
- Member QR: diseño propio mobile-first (no hay stitch para esta vista)
