'use client'

import React, { useState, useCallback } from 'react'
import { TrackData, CardConfig } from '@/types'

type Props = {
  cardRef: React.RefObject<HTMLDivElement>
  track: TrackData
  config: CardConfig
  onConfigChange: (updates: Partial<CardConfig>) => void
}

type Busy = 'png' | 'jpg' | 'transparent' | 'clipboard' | null

const DlIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/>
  </svg>
)
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>
  </svg>
)
const Spinner = () => (
  <span className="spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
)

function safe(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

const supportsClipboard = typeof window !== 'undefined' && typeof ClipboardItem !== 'undefined'

export default function ExportBar({ cardRef, track, config, onConfigChange }: Props) {
  const [busy, setBusy] = useState<Busy>(null)
  const [toast, setToast] = useState<string | null>(null)

  const filename = `${safe(track.artist)}-${safe(track.title)}-framesound`

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const exportPNG = useCallback(async () => {
    if (!cardRef.current || busy) return
    setBusy('png')
    showToast('Downloading…')
    try {
      const dti = (await import('dom-to-image-more')).default
      const url = await dti.toPng(cardRef.current, { scale: 3 })
      const a = document.createElement('a')
      a.href = url; a.download = `${filename}.png`; a.click()
    } catch (e) { console.error(e) }
    finally { setBusy(null) }
  }, [cardRef, busy, filename])

  const exportJPG = useCallback(async () => {
    if (!cardRef.current || busy) return
    setBusy('jpg')
    showToast('Downloading…')
    try {
      const dti = (await import('dom-to-image-more')).default
      const url = await dti.toJpeg(cardRef.current, { quality: 0.95, scale: 2 })
      const a = document.createElement('a')
      a.href = url; a.download = `${filename}.jpg`; a.click()
    } catch (e) { console.error(e) }
    finally { setBusy(null) }
  }, [cardRef, busy, filename])

  const exportTransparent = useCallback(async () => {
    if (!cardRef.current || busy) return
    setBusy('transparent')
    showToast('Downloading…')
    const prevBgStyle = config.bgStyle
    onConfigChange({ bgStyle: 'transparent' })
    // Wait for React to re-render with transparent background
    await new Promise(r => setTimeout(r, 120))
    try {
      const dti = (await import('dom-to-image-more')).default
      const blob = await dti.toBlob(cardRef.current, { bgcolor: null })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${filename}-transparent.png`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
    finally {
      onConfigChange({ bgStyle: prevBgStyle })
      setBusy(null)
    }
  }, [cardRef, busy, filename, config.bgStyle, onConfigChange])

  const copyClipboard = useCallback(async () => {
    if (!cardRef.current || busy) return
    setBusy('clipboard')
    try {
      const dti = (await import('dom-to-image-more')).default
      const blob = await dti.toBlob(cardRef.current, { scale: 2 })
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      showToast('Copied!')
    } catch (e) { console.error(e); showToast('Copy failed') }
    finally { setBusy(null) }
  }, [cardRef, busy])

  return (
    <div style={{
      borderTop: '1px solid var(--line)',
      padding: '12px 20px',
      background: 'var(--bg-1)',
      flexShrink: 0,
      position: 'relative',
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--bg-3)', border: '1px solid var(--line-1)',
          borderRadius: 6, padding: '5px 12px',
          fontSize: 12, color: 'var(--fg-1)', whiteSpace: 'nowrap',
          pointerEvents: 'none',
          animation: 'fadeUp 0.18s ease both',
        }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em' }}>EXPORT</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>
          {filename.slice(0, 24)}{filename.length > 24 ? '…' : ''}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: supportsClipboard ? '1fr 1fr 1fr 44px' : '1fr 1fr 1fr', gap: 6 }}>
        <button className="btn" data-variant="primary" data-size="sm" onClick={exportPNG} disabled={!!busy}>
          {busy === 'png' ? <Spinner /> : <DlIcon />}
          PNG HD
        </button>
        <button className="btn" data-size="sm" onClick={exportJPG} disabled={!!busy}>
          {busy === 'jpg' ? <Spinner /> : <DlIcon />}
          JPG
        </button>
        <button className="btn" data-size="sm" onClick={exportTransparent} disabled={!!busy}>
          {busy === 'transparent' ? <Spinner /> : <DlIcon />}
          Trans.
        </button>
        {supportsClipboard && (
          <button className="btn" data-size="sm" data-icon-only="true" onClick={copyClipboard} disabled={!!busy} title="Copy to clipboard">
            {busy === 'clipboard' ? <Spinner /> : <CopyIcon />}
          </button>
        )}
      </div>
    </div>
  )
}
