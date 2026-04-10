'use client'

import QRCode from 'react-qr-code'

type QRDisplayProps = {
  memberId: string
  memberName: string
}

export function QRDisplay({ memberId, memberName }: QRDisplayProps) {
  return (
    <div className="flex flex-col items-center px-5 pt-8 pb-4">
      <div className="mb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Tu check-in</p>
        <h1 className="text-2xl font-black font-headline text-[#CCFF00] tracking-tight uppercase">
          Código QR
        </h1>
        <p className="mt-2 text-sm text-gray-400 font-body max-w-full truncate px-1">{memberName}</p>
      </div>

      <div className="w-full max-w-[min(220px,calc(100vw-2.5rem))] p-4 sm:p-6 bg-white rounded-2xl shadow-[0_0_40px_rgba(204,255,0,0.15)] border border-[#CCFF00]/30 [&_svg]:h-auto [&_svg]:max-w-full [&_svg]:w-full">
        <QRCode value={memberId} size={220} level="M" />
      </div>

      <p className="mt-6 text-center text-xs text-gray-500 max-w-xs font-body leading-relaxed">
        Muestra este código en recepción para validar tu acceso. No compartas capturas en redes
        públicas.
      </p>
    </div>
  )
}
