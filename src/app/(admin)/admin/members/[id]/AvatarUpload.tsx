'use client'
import { useTransition, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateMemberAvatar } from '@/app/actions/members'

type Props = { memberId: string; currentUrl: string | null }

export function AvatarUpload({ memberId, currentUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    startTransition(async () => {
      const supabase = createClient()
      const path = `members/${memberId}/avatar`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) {
        console.error(uploadError)
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      await updateMemberAvatar(memberId, data.publicUrl)
    })
  }

  return (
    <div
      className="relative w-24 h-24 cursor-pointer group"
      onClick={() => inputRef.current?.click()}
    >
      {currentUrl ? (
        <img src={currentUrl} alt="Avatar del miembro" className="w-24 h-24 rounded-xl object-cover" />
      ) : (
        <div className="w-24 h-24 rounded-xl bg-[#262626] flex items-center justify-center">
          <span className="material-symbols-outlined text-white/30 text-4xl">person</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="material-symbols-outlined text-white text-xl">
          {isPending ? 'hourglass_empty' : 'photo_camera'}
        </span>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
