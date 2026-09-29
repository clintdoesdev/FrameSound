'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { TrackData, CardConfig } from '@/types'

type Props = {
  cardRef: React.RefObject<HTMLDivElement | null>
  track: TrackData
  config: CardConfig
  onConfigChange: (updates: Partial<CardConfig>) => void
  /** Lets the page trigger an export from a keyboard shortcut. */
  actionsRef?: React.MutableRefObject<{ exportPng: () => void } | null>
}

type Busy = 'png' | 'jpg' | 'transparent' | 'clipboard' | null

const DlIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/>
  </svg>
)
const AlphaIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
    <rect x="3" y="3" width="9" height="9" fill="currentColor" opacity="0.15"/>
    <rect x="12" y="12" width="9" height="9" fill="currentColor" opacity="0.15"/>
    <rect x="12" y="3" width="9" height="9" fill="currentColor" opacity="0.38"/>
    <rect x="3" y="12" width="9" height="9" fill="currentColor" opacity="0.38"/>
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeOpacity="0.5" strokeWidth="1.5" fill="none"/>
  </svg>
)
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>
  </svg>
)
const Spinner = () => <span className="spinner" aria-hidden />

function safe(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
async function inlineImages(el: HTMLElement): Promise<() => void> {
  const imgs = Array.from(el.querySelectorAll<HTMLImageElement>('img'))
  const origSrcs = imgs.map(i => i.src)
  await Promise.all(imgs.map(async (img) => {
    const src = img.src
    if (!src || src.startsWith('data:')) return
    try {
      const res = await fetch(src, { credentials: 'omit' })
      const blob = await res.blob()
      const dataUrl = await blobToDataUrl(blob)
      img.src = dataUrl
      if (!img.complete) await new Promise<void>(r => { img.onload = () => r(); img.onerror = () => r() })
    } catch { /* proxy route prevents this path */ }
  }))
  return () => imgs.forEach((img, i) => { img.src = origSrcs[i] })
}
function waitForPaint(): Promise<void> {
  return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}
async function waitReady(el: HTMLElement): Promise<void> {
  await waitForPaint()
  await document.fonts.ready
  const imgs = Array.from(el.querySelectorAll<HTMLImageElement>('img'))
  await Promise.all(imgs.map(img => img.decode().catch(() => {})))
}

// Target canvas per export size. `tight` keeps the card's own bounds; the rest
// letterbox the card into a platform aspect so it can be posted without a crop.
const SIZE_RATIO: Record<Exclude<CardConfig['exportSize'], 'tight'>, number | null> = {
  auto:   1,        // legacy behaviour: padded square
  square: 1,        // 1:1 feed post
  story:  9 / 16,   // 9:16 story / reel
  wide:   16 / 9,   // 16:9 link preview
}

async function compose(
  cardDataUrl: string,
  bg: string | null,
  size: CardConfig['exportSize'],
  format: 'png' | 'jpeg',
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const w = img.width
      const h = img.height
      const canvas = document.createElement('canvas')

      if (size === 'tight') {
        canvas.width = w
        canvas.height = h
      } else {
        const ratio = SIZE_RATIO[size] ?? 1
        // Pad by 10% of the card's long edge, then grow whichever axis the
        // target aspect needs — so the card is never cropped, only framed.
        const pad = Math.round(Math.max(w, h) * 0.10)
        const cw = w + pad * 2
        const ch = h + pad * 2
        canvas.width = Math.round(Math.max(cw, ch * ratio))
        canvas.height = Math.round(Math.max(ch, cw / ratio))
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('no 2d ctx')); return }
      if (bg) {
        ctx.fillStyle = bg
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img,
        Math.round((canvas.width - w) / 2),
        Math.round((canvas.height - h) / 2))
      resolve(canvas.toDataURL(`image/${format}`, quality))
    }
    img.onerror = () => reject(new Error('img load failed'))
    img.src = cardDataUrl
  })
}

const supportsClipboard = typeof window !== 'undefined' && typeof ClipboardItem !== 'undefined'

// Exports are sized against this reference width, not the on-screen size, so
// "3×" means the same pixels whether the preview is 340px or 470px wide.
const REF_W = 470

export default function ExportBar({ cardRef, track, config, onConfigChange, actionsRef }: Props) {
  const [busy, setBusy] = useState<Busy>(null)
  const [toast, setToast] = useState<string | null>(null)

  const filename = `${safe(track.artist)}-${safe(track.title)}-framesound`

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  const render = useCallback(async (scale: number): Promise<string> => {
    const el = cardRef.current!
    await waitReady(el)
    const restore = await inlineImages(el)
    try {
      const { toPng } = await import('html-to-image')
      return await toPng(el, { pixelRatio: (scale * REF_W) / Math.max(1, el.offsetWidth) })
    } finally { restore() }
  }, [cardRef])

  const run = useCallback(async (kind: Exclude<Busy, null>, job: () => Promise<string>) => {
    if (!cardRef.current) { showToast('No card to export'); return }
    if (busy) return
    setBusy(kind)
    try {
      showToast(await job())
    } catch (e) {
      console.error(`${kind} export failed:`, e)
      const msg = e instanceof Error ? e.message.slice(0, 50) : 'Unknown error'
      showToast(`Failed: ${msg}`)
    } finally { setBusy(null) }
  }, [cardRef, busy])

  const download = (url: string, name: string) => {
    const a = document.createElement('a')
    a.href = url; a.download = name; a.click()
  }

  const exportPNG = useCallback(() => run('png', async () => {
    const url = await compose(await render(3), '#000000', config.exportSize, 'png', 1)
    download(url, `${filename}.png`)
    return 'Saved'
  }), [run, render, config.exportSize, filename])

  const exportJPG = useCallback(() => run('jpg', async () => {
    const url = await compose(await render(2), '#000000', config.exportSize, 'jpeg', 0.92)
    download(url, `${filename}.jpg`)
    return 'Saved'
  }), [run, render, config.exportSize, filename])

  const exportTransparent = useCallback(() => run('transparent', async () => {
    const prevBgStyle = config.bgStyle
    onConfigChange({ bgStyle: 'transparent' })
    try {
      await new Promise(r => setTimeout(r, 160))
      const url = await compose(await render(2), null, config.exportSize, 'png', 1)
      download(url, `${filename}-alpha.png`)
      return 'Saved'
    } finally { onConfigChange({ bgStyle: prevBgStyle }) }
  }), [run, render, config.bgStyle, config.exportSize, filename, onConfigChange])

  const copyClipboard = useCallback(() => run('clipboard', async () => {
    const url = await compose(await render(2), '#000000', config.exportSize, 'png', 1)
    const blob = await (await fetch(url)).blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return 'Copied'
  }), [run, render, config.exportSize])

  // No dep array on purpose: refresh the published closure every render so the
  // shortcut never fires a stale `busy` capture.
  useEffect(() => {
    if (actionsRef) actionsRef.current = { exportPng: exportPNG }
  })

  return (
    <div style={{ position: 'relative', display: 'flex', gap: 8, alignItems: 'center' }}>
      {toast && (
        <div role="status" className="material" style={{
          position: 'absolute', bottom: 'calc(100% + 12px)', left: '50%',
          transform: 'translateX(-50%)', borderRadius: 999,
          padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none',
          animation: 'popIn 0.3s cubic-bezier(.2,.9,.25,1.1) both', zIndex: 50,
        }}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="var(--accent-text)" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l4 4 6-7"/></svg>
          {toast}
        </div>
      )}

      <button type="button" className="btn" data-variant="primary" onClick={exportPNG} disabled={!!busy}
        style={{ flex: 1, minHeight: 44 }} title="Download PNG (⌘E)">
        {busy === 'png' ? <Spinner /> : <DlIcon />} Export PNG
      </button>
      <button type="button" className="btn" onClick={exportJPG} disabled={!!busy}
        style={{ minHeight: 44, padding: '0 12px' }} title="Download JPG (2×)">
        {busy === 'jpg' ? <Spinner /> : 'JPG'}
      </button>
      <button type="button" className="btn" onClick={exportTransparent} disabled={!!busy}
        style={{ minHeight: 44, width: 44, padding: 0 }} title="Transparent PNG" aria-label="Transparent PNG">
        {busy === 'transparent' ? <Spinner /> : <AlphaIcon />}
      </button>
      {supportsClipboard && (
        <button type="button" className="btn" onClick={copyClipboard} disabled={!!busy}
          style={{ minHeight: 44, width: 44, padding: 0 }} title="Copy to clipboard" aria-label="Copy to clipboard">
          {busy === 'clipboard' ? <Spinner /> : <CopyIcon />}
        </button>
      )}
    </div>
  )
}
