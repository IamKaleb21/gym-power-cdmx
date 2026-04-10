import Link from 'next/link'
import { ADMIN_NAV_ITEMS } from '@/components/admin/admin-nav-items'
import { AdminBottomNav } from '@/components/admin/AdminBottomNav'
import { AdminNav } from '@/components/admin/AdminNav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      {/* TopAppBar — solo móvil: marca (en desktop el sidebar ya lleva la marca) */}
      <header className="flex items-center w-full px-8 h-20 fixed top-0 z-50 bg-[#0e0e0e]/70 backdrop-blur-xl lg:hidden">
        <span className="text-xl font-black text-[#cafd00] font-headline uppercase tracking-tighter">
          GYM POWER CDMX
        </span>
      </header>

      {/* Sidebar — desktop, fixed, lg+ */}
      <aside className="fixed h-screen w-64 left-0 top-0 bg-[#0e0e0e] flex flex-col pt-8 pb-8 px-4 z-40 hidden lg:flex">
        {/* Logo / brand */}
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-[#cafd00] flex items-center justify-center rounded-sm">
            <span className="material-symbols-outlined text-[#0e0e0e] font-black">bolt</span>
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-[#cafd00] font-headline uppercase leading-none">
              GYM POWER
            </h2>
            <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold font-headline">
              ADMIN PORTAL
            </p>
          </div>
        </div>

        {/* Nav items (client component for active state) */}
        <AdminNav items={[...ADMIN_NAV_ITEMS]} />

        {/* Add Member CTA */}
        <Link
          href="/admin/members/new"
          className="mt-auto bg-[#cafd00] text-[#516700] font-headline font-black py-4 rounded-sm flex items-center justify-center gap-2 hover:bg-[#f3ffca] transition-colors active:scale-[0.98]"
        >
          <span className="material-symbols-outlined">person_add</span>
          Add Member
        </Link>
      </aside>

      {/* Main content area */}
      <main className="lg:ml-64 pt-24 pb-21 lg:pb-8 lg:pt-8">{children}</main>

      <AdminBottomNav items={ADMIN_NAV_ITEMS} />
    </div>
  )
}
