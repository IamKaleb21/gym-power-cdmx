'use client'

import { useCallback, useRef, useState } from 'react'
import { validateMemberByUUID, type ValidateQRResult } from '@/app/actions/qr'
import { QRScanner } from './QRScanner'
import { MemberResultPanel } from './MemberResultPanel'

export function ScannerShell() {
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<ValidateQRResult | null>(null)
  const [paused, setPaused] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualValue, setManualValue] = useState('')
  const busy = useRef(false)

  const runValidation = useCallback(async (raw: string) => {
    if (busy.current) return
    busy.current = true
    setLoading(true)
    setLastResult(null)
    try {
      const result = await validateMemberByUUID(raw)
      setLastResult(result)
      setPaused(true)
    } finally {
      setLoading(false)
      busy.current = false
    }
  }, [])

  const handleRefresh = useCallback(() => {
    setLastResult(null)
    setPaused(false)
    busy.current = false
  }, [])

  const handleDecode = useCallback(
    (text: string) => {
      if (paused || loading || busy.current) return
      void runValidation(text)
    },
    [paused, loading, runValidation],
  )

  const submitManual = useCallback(() => {
    const v = manualValue.trim()
    if (!v) return
    setManualOpen(false)
    setManualValue('')
    void runValidation(v)
  }, [manualValue, runValidation])

  return (
    <>
      <div className="flex flex-col lg:flex-row min-h-[calc(100dvh-6rem)] lg:max-h-[calc(100dvh-6rem)] overflow-hidden bg-[#0e0e0e]">
        <section className="flex-1 relative flex flex-col items-stretch justify-center p-4 lg:p-8 min-h-[50vh] lg:min-h-0">
          <div className="absolute top-4 left-4 lg:top-8 lg:left-8 z-10 pointer-events-none">
            <h1 className="font-headline text-3xl lg:text-4xl font-black text-white leading-none uppercase tracking-tight">
              Access
              <br />
              <span className="text-[#cafd00]">Scanner</span>
            </h1>
            <p className="mt-2 text-[10px] font-body tracking-widest text-white/40 uppercase">
              Terminal · check-in
            </p>
          </div>

          <div className="relative w-full max-w-2xl mx-auto mt-24 lg:mt-16 aspect-square lg:aspect-video bg-[#131313] overflow-hidden rounded-lg shadow-2xl">
            <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6 lg:p-8">
              <div className="scanner-frame absolute inset-0" />
              <div className="scanner-frame-bottom absolute inset-0" />
              <div className="scan-line" />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#cafd00] animate-pulse" />
                <span className="text-[10px] font-mono text-[#cafd00] uppercase tracking-tighter">
                  Live
                </span>
              </div>
            </div>
            <QRScanner onDecode={handleDecode} paused={paused || loading} />
          </div>

          <div className="mt-8 w-full max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex-1 py-4 bg-[#262626] text-white font-headline font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#2c2c2c] active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Manual refresh
            </button>
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className="flex-1 py-4 bg-[#cafd00] text-[#516700] font-headline font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-[#f3ffca] active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-lg">keyboard</span>
              ID manual
            </button>
          </div>
        </section>

        <MemberResultPanel loading={loading} lastResult={lastResult} onRefresh={handleRefresh} />
      </div>

      {manualOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="manual-id-title"
        >
          <div className="w-full max-w-md bg-[#1a1a1a] border border-[#484847]/40 rounded-lg p-6 shadow-2xl">
            <h2 id="manual-id-title" className="font-headline text-lg font-black uppercase text-white mb-2">
              ID del miembro
            </h2>
            <p className="text-sm text-white/60 mb-4 font-body">Pega el UUID del perfil (QR).</p>
            <input
              type="text"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitManual()}
              className="w-full px-3 py-3 rounded-md bg-[#0e0e0e] border border-[#484847]/50 text-white font-mono text-sm outline-none focus:border-[#cafd00]"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              autoFocus
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setManualOpen(false)
                  setManualValue('')
                }}
                className="px-4 py-2 text-sm text-white/70 hover:text-white font-body"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitManual}
                className="px-4 py-2 bg-[#cafd00] text-[#516700] font-headline font-bold text-sm uppercase rounded-sm hover:bg-[#f3ffca]"
              >
                Validar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
