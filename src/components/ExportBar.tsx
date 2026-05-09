'use client'

import React, { useState, useCallback } from 'react'
import { TrackData, CardConfig } from '@/types'

type Props = {
  cardRef: React.RefObject<HTMLDivElement | null>
  track: TrackData
  config: CardConfig
  onConfigChange: (updates: Partial<CardConfig>) => void
}

type Busy = 'png' | 'jpg' | 'transparent' | 'clipboard' | null

const DlIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/>
  </svg>
)
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>
  </svg>
)
const AlphaIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2"/>
    <path d="M3 9h18M9 3v18"/>
  </svg>
)
const Spinner = () => (
  <span className="spin" style={{ display: 'inline-block', width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
)

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

// Convert every <img> src to a data URL so html-to-image never makes
// cross-origin requests during capture (which produce blank pixels).
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
    } catch {
      // leave src unchanged — proxy route usually prevents this path
    }
  }))
  return () => imgs.forEach((img, i) => { img.src = origSrcs[i] })
}

// Double rAF ensures React has fully committed and painted.
function waitForPaint(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

// Full readiness gate: paint + fonts + image decodes.
async function waitReady(el: HTMLElement): Promise<void> {
  await waitForPaint()
  await document.fonts.ready
  const imgs = Array.from(el.querySelectorAll<HTMLImageElement>('img'))
  await Promise.all(imgs.map(img => img.decode().catch(() => {})))
}

const supportsClipboard = typeof window !== 'undefined' && typeof ClipboardItem !== 'undefined'

export default function ExportBar({ cardRef, track, config, onConfigChange }: Props) {
  const [busy, setBusy] = useState<Busy>(null)
  const [toast, setToast] = useState<string | null>(null)

  const filename = `${safe(track.artist)}-${safe(track.title)}-framesound`

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  const exportPNG = useCallback(async () => {
    if (!cardRef.current || busy) return
    setBusy('png')
    showToast('Exporting PNG…')
    const el = cardRef.current
    await waitReady(el)
    const restore = await inlineImages(el)
    try {
      const { toPng } = await import('html-to-image')
      // No backgroundColor override — let the card render its own background naturally.
      const url = await toPng(el, { pixelRatio: 3 })
      const a = document.createElement('a')
      a.href = url; a.download = `${filename}.png`; a.click()
      showToast('Saved ✓')
    } catch (e) { console.error(e); showToast('Export failed') }
    finally { restore(); setBusy(null) }
  }, [cardRef, busy, filename])

  const exportJPG = useCallback(async () => {
    if (!cardRef.current || busy) return
    setBusy('jpg')
    showToast('Exporting JPG…')
    const el = cardRef.current
    await waitReady(el)
    const restore = await inlineImages(el)
    try {
      const { toJpeg } = await import('html-to-image')
      // JPEG has no alpha channel — flatten transparent areas to black.
      const url = await toJpeg(el, { quality: 0.95, pixelRatio: 2, backgroundColor: '#000000' })
      const a = document.createElement('a')
      a.href = url; a.download = `${filename}.jpg`; a.click()
      showToast('Saved ✓')
    } catch (e) { console.error(e); showToast('Export failed') }
    finally { restore(); setBusy(null) }
  }, [cardRef, busy, filename])

  const exportTransparent = useCallback(async () => {
    if (!cardRef.current || busy) return
    setBusy('transparent')
    showToast('Exporting Alpha PNG…')
    const prevBgStyle = config.bgStyle
    onConfigChange({ bgStyle: 'transparent' })
    // Give React time to re-render with the transparent background
    await new Promise(r => setTimeout(r, 160))
    const el = cardRef.current
    await waitReady(el)
    const restore = await inlineImages(el)
    try {
      const { toPng } = await import('html-to-image')
      const url = await toPng(el, { pixelRatio: 2 })
      const a = document.createElement('a')
      a.href = url; a.download = `${filename}-alpha.png`; a.click()
      showToast('Saved ✓')
    } catch (e) { console.error(e); showToast('Export failed') }
    finally {
      restore()
      onConfigChange({ bgStyle: prevBgStyle })
      setBusy(null)
    }
  }, [cardRef, busy, filename, config.bgStyle, onConfigChange])

  const copyClipboard = useCallback(async () => {
    if (!cardRef.current || busy) return
    setBusy('clipboard')
    const el = cardRef.current
    await waitReady(el)
    const restore = await inlineImages(el)
    try {
      const { toPng } = await import('html-to-image')
      const url = await toPng(el, { pixelRatio: 2 })
      const res = await fetch(url)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      showToast('Copied ✓')
    } catch (e) { console.error(e); showToast('Copy failed') }
    finally { restore(); setBusy(null) }
  }, [cardRef, busy])

  return (
    <div style={{
      borderTop: '1px solid var(--line)',
      padding: '14px 20px 16px',
      background: 'var(--bg)',
      flexShrink: 0,
      position: 'relative',
    }}>
      {toast && (
        <div style={{
          position: 'absolute', top: -44, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-3)', border: '1px solid var(--line-1)',
          borderRadius: 8, padding: '6px 14px',
          fontSize: 12.5, color: 'var(--fg-1)', whiteSpace: 'nowrap',
          pointerEvents: 'none', animation: 'fadeUp 0.2s ease both',
          boxShadow: '0 4px 12px oklch(0 0 0 / 0.3)',
        }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.06em' }}>EXPORT</span>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 6px',
            background: 'var(--accent-quiet)', color: 'var(--accent)',
            borderRadius: 4, fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
          }}>HD</span>
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-4)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 190, whiteSpace: 'nowrap' }}>
          {filename}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: supportsClipboard ? '1fr 1fr 1fr 46px' : '1fr 1fr 1fr', gap: 8 }}>
        <button className="btn" data-variant="primary" onClick={exportPNG} disabled={!!busy}
          style={{ height: 42, fontSize: 13, fontWeight: 600, gap: 6 }}>
          {busy === 'png' ? <Spinner /> : <DlIcon />}
          PNG
        </button>
        <button className="btn" onClick={exportJPG} disabled={!!busy}
          style={{ height: 42, fontSize: 13, gap: 6 }}>
          {busy === 'jpg' ? <Spinner /> : <DlIcon />}
          JPG
        </button>
        <button className="btn" onClick={exportTransparent} disabled={!!busy}
          title="Transparent background PNG"
          style={{ height: 42, fontSize: 13, gap: 6 }}>
          {busy === 'transparent' ? <Spinner /> : <AlphaIcon />}
          Alpha
        </button>
        {supportsClipboard && (
          <button className="btn" onClick={copyClipboard} disabled={!!busy}
            title="Copy to clipboard"
            style={{ height: 42, padding: 0, width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {busy === 'clipboard' ? <Spinner /> : <CopyIcon />}
          </button>
        )}
      </div>
    </div>
  )
}
