'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  href: string
  icon: string
  label: string
}

const NAV_ITEMS: NavItem[] = [
  { href: '/member/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/member/classes', icon: 'event_note', label: 'Classes' },
  { href: '/member/payments', icon: 'payments', label: 'Payments' },
  { href: '/member/qr', icon: 'qr_code_2', label: 'QR' },
  { href: '/member/profile', icon: 'person', label: 'Profile' },
]

export function MemberNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-[#121212] border-t border-[#212121] rounded-t-lg shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
      {NAV_ITEMS.map(({ href, icon, label }) => {
        const isActive = pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-200 ${
              isActive
                ? 'text-[#CCFF00] bg-[#212121] rounded-xl px-2 py-1'
                : 'text-gray-500 hover:text-gray-300 hover:bg-[#212121] px-2 py-1 rounded-xl'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {icon}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider mt-0.5 font-body">
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
