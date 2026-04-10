# Fase 7 — Dashboard Analítico: Design Doc

## Objetivo

Reemplazar el placeholder de `/admin/dashboard` con un panel de retención de miembros: 4 KPI cards, selector de rango (3m/6m/12m) vía URL, y gráfico de barras mensual con Recharts.

---

## Decisiones

### Sin Server Action — RSC puro
Los datos son de solo lectura. El RSC fetcha directamente con `createAdminClient()` y pasa props calculados a los Client Components. No hay mutaciones.

### Rango via `searchParams` (YAGNI)
`?range=3m | 6m | 12m` (default `6m`). Evita un date picker JS complejo. `RangeSelector` hace `router.push(?range=...)`.

### Recharts en lugar de Tremor
`@tremor/react` v3 fue diseñado para Tailwind v3; este proyecto usa Tailwind v4. Alto riesgo de conflictos de utilidades. Recharts permite control total sobre colores y estilos para coincidir con el design system existente.

### Lógica pura en `utils.ts` (TDD)
`calculateRetentionRate` y `getRetentionMetrics` son funciones puras — fácil de testear con Vitest sin mocks de Supabase.

### Fuente de datos
- `member_memberships (start_date, end_date, member_id)` — para activos, altas, bajas por mes.
- Sin query adicional para `profiles` — el conteo de activos se deriva del rango de membresías.

### Fórmulas
- **Activos al final del periodo:** `COUNT WHERE start_date <= endDate AND end_date >= endDate`
- **Nuevas altas en el periodo:** `COUNT WHERE start_date BETWEEN startDate AND endDate`
- **Bajas en el periodo:** `COUNT WHERE end_date BETWEEN startDate AND endDate AND end_date < TODAY`
- **Tasa de retención:** `((activos_fin - nuevas_altas) / activos_inicio) * 100`, retorna 0 si `activos_inicio === 0`

---

## Componentes

### `page.tsx` (RSC)
- Lee `searchParams.range`
- Calcula `startDate` / `endDate` en CDMX timezone
- Fetch `member_memberships` completo con `createAdminClient()`
- Llama `getRetentionMetrics(memberships, startDate, endDate)`
- Renderiza KPI cards inline + `<RangeSelector>` + `<RetentionChart>`

### `RangeSelector.tsx` (Client)
- 3 botones: `3M`, `6M`, `12M`
- Activo: `bg-[#cafd00] text-[#0e0e0e] font-black`
- Inactivo: `bg-surface-container-high text-white/60 hover:text-white`
- `useRouter().push(?range=Xm)`

### `RetentionChart.tsx` (Client)
- Props: `data: Array<{ month: string; new: number; active: number }>`
- `<ResponsiveContainer width="100%" height={280}>`
- `<BarChart>` con dos series: barras `new` en `#cafd00`, `active` en `#262626`
- `<CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />`
- `<XAxis>` y `<YAxis>` en `fill="#adaaaa"` (on-surface-variant)
- `<Tooltip>` con `contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }}`
- `<Legend>` con texto blanco

---

## Layout visual

```
┌─ ANALYTICS ─────────────────────────────── [3M] [6M] [12M] ─┐
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Activos  │  │ N. Altas │  │   Bajas  │  │ Retención  │  │
│  │  #cafd00 │  │  #cafd00 │  │  #error  │  │  #cafd00   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│                                                               │
│  ┌─ Nuevas altas por mes ─────────────────────────────────┐  │
│  │  BarChart Recharts — barras #cafd00 sobre fondo dark   │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

## Archivos

```
src/
  lib/analytics/utils.ts                   ← funciones puras
  tests/retention.test.ts                  ← 5 tests TDD
  app/(admin)/admin/dashboard/
    page.tsx                               ← RSC (reemplaza placeholder)
    RangeSelector.tsx                      ← Client Component
    RetentionChart.tsx                     ← Client Component (Recharts)
```
