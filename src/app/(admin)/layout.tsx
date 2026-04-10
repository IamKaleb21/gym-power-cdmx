import Link from 'next/link'
import { AdminNav } from '@/components/admin/AdminNav'

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/admin/members', icon: 'group', label: 'Members' },
  { href: '/admin/classes', icon: 'calendar_today', label: 'Classes' },
  { href: '/admin/trainers', icon: 'fitness_center', label: 'Trainers' },
  { href: '/admin/payments', icon: 'payments', label: 'Payments' },
  { href: '/admin/scan', icon: 'qr_code_scanner', label: 'Scan' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white">
      {/* TopAppBar — fixed, full width */}
      <header className="flex justify-between items-center w-full px-8 h-20 fixed top-0 z-50 bg-[#0e0e0e]/70 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          {/* Logo visible only on mobile */}
          <span className="text-xl font-black text-[#cafd00] font-headline uppercase tracking-tighter lg:hidden">
            GYM POWER CDMX
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center bg-[#131313] px-3 py-1.5 rounded-lg border border-white/10">
            <span className="material-symbols-outlined text-white/50 text-sm mr-2">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 text-sm w-48 font-body placeholder-gray-500 outline-none"
              placeholder="Search..."
              type="text"
            />
          </div>
          <button className="text-gray-400 hover:text-[#f3ffca] transition-colors scale-95 active:scale-[0.98]">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      {/* Sidebar — desktop, fixed, lg+ */}
      <aside className="fixed h-screen w-64 left-0 top-0 bg-[#0e0e0e] flex flex-col py-8 px-4 z-40 hidden lg:flex">
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
        <AdminNav items={NAV_ITEMS} />

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
      <main className="lg:ml-64 pt-24 pb-20 lg:pb-8">{children}</main>

      {/* Bottom nav — mobile only */}
      <nav className="fixed bottom-0 w-full flex justify-around items-center px-4 py-3 lg:hidden bg-[#0e0e0e]/80 backdrop-blur-2xl z-50 rounded-t-lg shadow-[0_-4px_30px_rgba(202,253,0,0.1)]">
        <Link
          href="/admin/members/new"
          className="flex flex-col items-center justify-center text-white/50 hover:text-[#cafd00] transition-colors"
        >
          <span className="material-symbols-outlined">person_add</span>
          <span className="font-headline text-[10px] uppercase font-bold tracking-widest">Add</span>
        </Link>
        <Link
          href="/admin/members"
          className="flex flex-col items-center justify-center text-white/50 hover:text-[#cafd00] transition-colors"
        >
          <span className="material-symbols-outlined">group</span>
          <span className="font-headline text-[10px] uppercase font-bold tracking-widest">Members</span>
        </Link>
        <Link
          href="/admin/dashboard"
          className="flex flex-col items-center justify-center bg-[#cafd00] text-[#0e0e0e] rounded-sm px-4 py-1 scale-110"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="font-headline text-[10px] uppercase font-bold tracking-widest">Home</span>
        </Link>
        <Link
          href="/admin/scan"
          className="flex flex-col items-center justify-center text-white/50 hover:text-[#cafd00] transition-colors"
        >
          <span className="material-symbols-outlined">qr_code_scanner</span>
          <span className="font-headline text-[10px] uppercase font-bold tracking-widest">Scan</span>
        </Link>
      </nav>
    </div>
  )
}
