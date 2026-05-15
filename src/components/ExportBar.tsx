'use client'

import React, { useState, useCallback } from 'react'
import { TrackData, CardConfig } from '@/types'

type Props = {
  cardRef: React.RefObject<HTMLDivElement | null>
  track: TrackData
  config: CardConfig
  onConfigChange: (updates: Partial<CardConfig>) => void
  accentColor?: string | null
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
const Spinner = () => (
  <span style={{
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid currentColor', borderTopColor: 'transparent',
    borderRadius: '50%', animation: 'exportSpin 0.7s linear infinite',
  }} />
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

const supportsClipboard = typeof window !== 'undefined' && typeof ClipboardItem !== 'undefined'

export default function ExportBar({ cardRef, track, config, onConfigChange, accentColor }: Props) {
  const [busy, setBusy] = useState<Busy>(null)
  const [toast, setToast] = useState<string | null>(null)

  const filename = `${safe(track.artist)}-${safe(track.title)}-framesound`

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 1800)
  }

  const exportPNG = useCallback(async () => {
    if (!cardRef.current || busy) return
    setBusy('png')
    const el = cardRef.current
    await waitReady(el)
    const restore = await inlineImages(el)
    try {
      const { toPng } = await import('html-to-image')
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
    const el = cardRef.current
    await waitReady(el)
    const restore = await inlineImages(el)
    try {
      const { toJpeg } = await import('html-to-image')
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
    const prevBgStyle = config.bgStyle
    onConfigChange({ bgStyle: 'transparent' })
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
    finally { restore(); onConfigChange({ bgStyle: prevBgStyle }); setBusy(null) }
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

  const btnBase = (isActive: boolean): React.CSSProperties => ({
    flex: 1, height: 48, borderRadius: 8, border: 0,
    cursor: isActive ? 'default' : 'pointer',
    background: isActive ? '#252525' : '#1a1a1a',
    color: 'rgba(255,255,255,0.75)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
    transform: isActive ? 'scale(0.97)' : 'scale(1)',
    transition: 'transform 100ms, background 120ms',
    opacity: busy && !isActive ? 0.4 : 1,
  })

  const labelSty: React.CSSProperties = {
    fontFamily: 'var(--font-syne)', fontSize: 10, fontWeight: 600,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  }

  const toastBg = accentColor ?? 'var(--accent)'

  return (
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '8px 12px',
      background: '#0d0d0d',
      height: 64,
      flexShrink: 0,
      position: 'relative',
      display: 'flex', alignItems: 'center',
    }}>
      <style>{`
        @keyframes exportSpin { to { transform: rotate(360deg); } }
        @keyframes slideUpToast {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {toast && (
        <div style={{
          position: 'absolute', bottom: 72, left: '50%',
          transform: 'translateX(-50%)',
          background: toastBg,
          color: '#fff', borderRadius: 8, padding: '8px 18px',
          fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
          pointerEvents: 'none',
          animation: 'slideUpToast 0.2s ease both',
          boxShadow: '0 4px 16px rgba(0,0,0,0.45)',
          zIndex: 50,
        }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, width: '100%' }}>
        <button style={btnBase(busy === 'png')} onClick={exportPNG} disabled={!!busy}>
          {busy === 'png' ? <Spinner /> : <DlIcon />}
          <span style={labelSty}>PNG 3×</span>
        </button>
        <button style={btnBase(busy === 'jpg')} onClick={exportJPG} disabled={!!busy}>
          {busy === 'jpg' ? <Spinner /> : <DlIcon />}
          <span style={labelSty}>JPG 2×</span>
        </button>
        <button style={btnBase(busy === 'transparent')} onClick={exportTransparent} disabled={!!busy}>
          {busy === 'transparent' ? <Spinner /> : <AlphaIcon />}
          <span style={labelSty}>Alpha</span>
        </button>
        {supportsClipboard && (
          <button
            style={{ ...btnBase(busy === 'clipboard'), flex: 'none', width: 48 }}
            onClick={copyClipboard} disabled={!!busy}
            title="Copy to clipboard"
          >
            {busy === 'clipboard' ? <Spinner /> : <CopyIcon />}
          </button>
        )}
      </div>
    </div>
  )
}
