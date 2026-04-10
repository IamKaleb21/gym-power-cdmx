'use client'

import { useActionState } from 'react'
import { updateMemberProfile } from '@/app/actions/member-portal'

type Props = {
  initialData: {
    full_name: string
    phone: string
    avatar_url: string | null
  }
}

type ActionResult = Awaited<ReturnType<typeof updateMemberProfile>>

export function MemberProfileForm({ initialData }: Props) {
  const [state, formAction, isPending] = useActionState<ActionResult, FormData>(
    (_prevState, formData) => updateMemberProfile(formData),
    { success: false },
  )

  return (
    <main className="pt-8 px-6 max-w-md mx-auto">
      {/* Page Title */}
      <div className="mb-8">
        <h2 className="font-headline text-3xl font-bold tracking-tighter uppercase text-white">
          Edit Profile
        </h2>
        <p className="text-on-surface-variant text-sm mt-1">
          Update your personal information below.
        </p>
      </div>

      {/* Avatar Section */}
      <section className="mb-10 flex flex-col items-center">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full border-2 border-[#CCFF00] p-1 overflow-hidden">
            {initialData.avatar_url ? (
              <img
                src={initialData.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#212121] flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-gray-500">person</span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="absolute bottom-0 right-0 bg-[#CCFF00] text-[#121212] w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#121212] shadow-lg active:scale-90 transition-transform"
            aria-label="Change photo"
          >
            <span className="material-symbols-outlined font-bold text-xl">photo_camera</span>
          </button>
        </div>
        <p className="font-headline font-bold text-[#CCFF00] text-xs uppercase tracking-widest mt-4">
          Change Photo
        </p>
      </section>

      {/* Success / Error feedback */}
      {state?.success && (
        <p className="mb-4 text-[#CCFF00] text-sm font-bold">Profile updated successfully.</p>
      )}
      {state?.error && typeof state.error === 'string' && (
        <p className="mb-4 text-red-400 text-sm">{state.error}</p>
      )}

      {/* Form */}
      <form action={formAction} className="space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <label className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
            Full Name
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
              person
            </span>
            <input
              name="full_name"
              type="text"
              defaultValue={initialData.full_name}
              placeholder="Enter your name"
              className="w-full bg-surface-container-highest border border-[#212121] rounded-xl py-4 pl-12 pr-4 text-white font-headline font-medium focus:border-[#CCFF00] transition-colors focus:outline-none"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
            Phone Number
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
              phone_iphone
            </span>
            <input
              name="phone"
              type="tel"
              defaultValue={initialData.phone}
              placeholder="+52 ..."
              className="w-full bg-surface-container-highest border border-[#212121] rounded-xl py-4 pl-12 pr-4 text-white font-headline font-medium focus:border-[#CCFF00] transition-colors focus:outline-none"
            />
          </div>
        </div>

        {/* Location (read-only) */}
        <div className="space-y-2">
          <label className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
            Location
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl">
              location_on
            </span>
            <input
              type="text"
              value="CDMX, MEXICO"
              readOnly
              title="Location"
              className="w-full bg-surface-container border border-[#212121] rounded-xl py-4 pl-12 pr-4 text-gray-400 font-headline font-medium cursor-not-allowed focus:outline-none"
            />
          </div>
          <p className="text-[10px] text-gray-600 px-1 italic">
            Location is managed by gym branch assignment.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#CCFF00] text-[#121212] font-headline font-black py-5 rounded-xl uppercase tracking-widest mt-10 hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(204,255,0,0.2)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </form>

      {/* Danger Zone */}
      <div className="mt-12 mb-8 pt-8 border-t border-[#212121]">
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-between px-4 py-4 rounded-xl border border-error/20 bg-error/5 opacity-50 cursor-not-allowed"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error">delete</span>
            <span className="font-headline text-sm font-bold text-error uppercase tracking-tighter">
              Deactivate Membership
            </span>
          </div>
          <span className="material-symbols-outlined text-error/40">chevron_right</span>
        </button>
      </div>
    </main>
  )
}
