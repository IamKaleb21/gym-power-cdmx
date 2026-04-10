'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { AdminNavItem } from './admin-nav-items'

export function AdminBottomNav({ items }: { items: readonly AdminNavItem[] }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegación administración"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0e0e0e]/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-2xl lg:hidden"
    >
      <div className="flex w-full items-stretch px-0.5 py-2 sm:px-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-sm px-0.5 py-1.5 transition-colors active:scale-[0.98] sm:px-1 ${
                active
                  ? 'bg-[#cafd00] text-[#0e0e0e]'
                  : 'text-white/50 hover:text-[#cafd00]'
              }`}
            >
              <span
                className="material-symbols-outlined shrink-0 text-[20px] sm:text-[22px]"
                aria-hidden
              >
                {item.icon}
              </span>
              <span className="w-full text-center font-headline text-[7px] font-bold uppercase leading-tight tracking-tight sm:text-[8px] sm:tracking-widest">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
