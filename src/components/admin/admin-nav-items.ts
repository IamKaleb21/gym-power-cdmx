export const ADMIN_NAV_ITEMS = [
  { href: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/admin/members', icon: 'group', label: 'Members' },
  { href: '/admin/classes', icon: 'calendar_today', label: 'Classes' },
  { href: '/admin/trainers', icon: 'fitness_center', label: 'Trainers' },
  { href: '/admin/payments', icon: 'payments', label: 'Payments' },
  { href: '/admin/scan', icon: 'qr_code_scanner', label: 'Scan' },
] as const

export type AdminNavItem = (typeof ADMIN_NAV_ITEMS)[number]
