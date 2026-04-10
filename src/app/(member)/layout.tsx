import Link from 'next/link'
import { MemberNav } from '@/components/member/MemberNav'

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-on-background min-h-screen pb-24">
      {/* TopAppBar */}
      <nav className="flex justify-between items-center px-6 h-16 w-full bg-[#121212] border-b border-[#212121] sticky top-0 z-50">
        <Link href="/member/dashboard" className="flex items-center gap-2 text-[#CCFF00]">
          <span className="material-symbols-outlined">fitness_center</span>
          <span className="font-headline font-bold tracking-widest text-xl uppercase">
            GYM PORTAL
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-gray-400">notifications</span>
        </div>
      </nav>

      {/* Main content */}
      <main>{children}</main>

      {/* Bottom nav */}
      <MemberNav />
    </div>
  )
}
