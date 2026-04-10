'use client'

import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

type QRScannerProps = {
  onDecode: (text: string) => void
  paused: boolean
}

export function QRScanner({ onDecode, paused }: QRScannerProps) {
  const instanceRef = useRef<Html5Qrcode | null>(null)
  const onDecodeRef = useRef(onDecode)
  const pausedRef = useRef(paused)

  useLayoutEffect(() => {
    onDecodeRef.current = onDecode
  }, [onDecode])

  useLayoutEffect(() => {
    pausedRef.current = paused
  }, [paused])

  const reactId = useId().replace(/:/g, '')
  const readerId = `admin-qr-reader-${reactId}`

  useEffect(() => {
    const html5 = new Html5Qrcode(readerId, { verbose: false })
    instanceRef.current = html5

    const qrbox = (viewfinderWidth: number, viewfinderHeight: number) => {
      const edge = Math.min(viewfinderWidth, viewfinderHeight, 320)
      const size = Math.floor(edge * 0.75)
      return { width: size, height: size }
    }

    html5
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox },
        (decoded) => {
          if (!pausedRef.current) onDecodeRef.current(decoded)
        },
        () => {},
      )
      .catch(() => {
        /* camera permission / no camera — manual ID still works */
      })

    return () => {
      instanceRef.current = null
      if (html5.isScanning) {
        html5.stop().then(() => html5.clear()).catch(() => html5.clear())
      } else {
        html5.clear()
      }
    }
  }, [readerId])

  useEffect(() => {
    const h = instanceRef.current
    if (!h?.isScanning) return
    if (paused) h.pause(true)
    else h.resume()
  }, [paused])

  return (
    <div
      id={readerId}
      className="relative z-0 w-full h-full min-h-[220px] rounded-lg overflow-hidden bg-black [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
    />
  )
}
