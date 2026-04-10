import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { compressForDisplay } from '@/lib/trainers/availability'

export default async function TrainersPage() {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trainers } = await (supabase as any)
    .from('trainers')
    .select('*, trainer_availability(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const activeCount = trainers?.length ?? 0
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slotsOpen = trainers?.reduce((sum: number, t: any) => sum + (t.trainer_availability?.length ?? 0), 0) ?? 0

  return (
    <div className="px-8 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h1 className="font-headline text-5xl md:text-7xl font-black text-white leading-none tracking-tighter uppercase mb-4">
              ELITE <span className="text-[#cafd00] italic">COACHES</span>
            </h1>
            <p className="text-white/60 font-body max-w-lg text-lg">
              Managing the technical force behind Gym Power CDMX. High-performance oversight and roster optimization.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-[#131313] px-6 py-4 rounded-lg border-l-4 border-[#cafd00]">
              <span className="block text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">
                Active Trainers
              </span>
              <span className="text-3xl font-headline font-black text-white leading-none">{activeCount}</span>
            </div>
            <div className="bg-[#131313] px-6 py-4 rounded-lg border-l-4 border-[#484847]">
              <span className="block text-[10px] text-white/40 uppercase font-bold tracking-widest mb-1">
                Slots Open
              </span>
              <span className="text-3xl font-headline font-black text-white leading-none">{slotsOpen}</span>
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Trainer Cards */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {((trainers as any[]) ?? []).map((trainer: any) => {
            const chips = compressForDisplay(trainer.trainer_availability ?? [])

            return (
              <div key={trainer.id} className="bg-[#131313] overflow-hidden group">
                {/* Photo */}
                <div className="relative h-64 overflow-hidden">
                  {trainer.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={trainer.avatar_url}
                      alt={trainer.full_name}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#262626] flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/20" style={{ fontSize: '96px' }}>
                        person
                      </span>
                    </div>
                  )}
                  {/* Specialty badge */}
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#262626] text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm">
                      {trainer.specialty}
                    </span>
                  </div>
                  {/* Name overlay */}
                  <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#131313] to-transparent">
                    <h2 className="text-3xl font-headline font-black text-white tracking-tighter uppercase leading-none">
                      {trainer.full_name}
                    </h2>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  <p className="text-white/60 text-sm leading-relaxed mb-6 font-body">
                    {trainer.bio ?? (
                      <span className="text-white/30 italic">Sin bio registrada.</span>
                    )}
                  </p>

                  {/* Weekly availability */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-[#cafd00] uppercase tracking-[0.2em] flex items-center gap-2">
                      <span className="w-8 h-[1px] bg-[#cafd00]" /> WEEKLY AVAILABILITY
                    </h3>
                    {chips.length === 0 ? (
                      <p className="text-white/30 text-xs font-headline uppercase tracking-widest">
                        Sin disponibilidad
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {chips.slice(0, 4).map((chip, i) => {
                          const isAccent = i === Math.min(chips.length, 4) - 1
                          return (
                            <div
                              key={i}
                              className={`p-2 rounded-sm text-center ${
                                isAccent
                                  ? 'bg-[#cafd00]/10 border border-[#cafd00]/20'
                                  : 'bg-[#262626]'
                              }`}
                            >
                              <span
                                className={`block text-[10px] font-bold uppercase mb-1 ${
                                  isAccent ? 'text-[#cafd00]/60' : 'text-white/40'
                                }`}
                              >
                                {chip.day}
                              </span>
                              <span
                                className={`text-[11px] font-mono font-bold ${
                                  isAccent ? 'text-[#cafd00]' : 'text-white'
                                }`}
                              >
                                {chip.range}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex justify-between items-center">
                  <button className="text-white/40 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                  <Link
                    href={`/admin/trainers/${trainer.id}`}
                    className="text-[12px] font-headline font-bold uppercase text-[#cafd00] border-b border-[#cafd00]/30 hover:border-[#cafd00] transition-all pb-1"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>
            )
          })}

          {/* CTA Card — Recruit new trainer */}
          <div className="bg-[#cafd00] p-8 flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <span className="text-[10px] font-black text-[#4a5e00] uppercase tracking-widest mb-4 block">
                MANAGEMENT ACTIONS
              </span>
              <h2 className="text-4xl font-headline font-black text-[#4a5e00] tracking-tighter uppercase mb-6 leading-[0.9]">
                RECRUIT NEW ELITE TALENT
              </h2>
              <Link
                href="/admin/trainers/new"
                className="bg-[#4a5e00] text-[#cafd00] px-6 py-3 font-headline font-black uppercase tracking-tighter flex items-center gap-2 group-hover:scale-105 transition-transform w-fit"
              >
                <span className="material-symbols-outlined">add_circle</span>
                OPEN DIRECTORY
              </Link>
            </div>
            <span className="absolute -right-12 -bottom-12 text-[180px] font-black text-[#4a5e00]/10 font-headline pointer-events-none group-hover:text-[#4a5e00]/20 transition-colors select-none">
              GP
            </span>
          </div>

          {/* Activity Log Card */}
          <div className="bg-[#131313] p-6 md:col-span-2 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-[10px] font-black text-[#cafd00] uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-8 h-[1px] bg-[#cafd00]" /> RECENT ACTIVITY
              </h3>
              <span className="text-[10px] text-white/40 font-bold uppercase">LIVE FEED</span>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-[#262626] flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-[#cafd00]">edit_calendar</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">Marco Vega updated Saturday block</p>
                    <p className="text-[10px] text-white/40 uppercase font-bold">2 HOURS AGO</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-white/60">#MV-9021</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded bg-[#262626] flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm text-[#ff7351]">person_add</span>
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">New trainer profile created: Sofia Luna</p>
                    <p className="text-[10px] text-white/40 uppercase font-bold">YESTERDAY</p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-white/60">#SL-4412</span>
              </div>
            </div>
            <button className="mt-auto w-full py-4 text-center text-white/40 font-headline font-bold text-[10px] uppercase tracking-widest hover:text-white transition-colors">
              View All Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
