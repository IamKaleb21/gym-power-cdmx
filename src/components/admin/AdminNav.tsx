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
