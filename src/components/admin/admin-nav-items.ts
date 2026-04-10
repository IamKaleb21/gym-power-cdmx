export const ADMIN_NAV_ITEMS = [
  { href: '/admin/dashboard', icon: 'dashboard', label: 'Métricas' },
  { href: '/admin/members', icon: 'group', label: 'Miembros' },
  { href: '/admin/classes', icon: 'calendar_today', label: 'Clases' },
  { href: '/admin/trainers', icon: 'fitness_center', label: 'Entrenadores' },
  { href: '/admin/payments', icon: 'payments', label: 'Pagos' },
  { href: '/admin/scan', icon: 'qr_code_scanner', label: 'Escanear' },
] as const

export type AdminNavItem = (typeof ADMIN_NAV_ITEMS)[number]
