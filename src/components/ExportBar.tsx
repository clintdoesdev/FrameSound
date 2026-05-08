'use client'

import React, { useState } from 'react'
import { TrackData } from '@/types'

type Props = {
  cardRef: React.RefObject<HTMLDivElement>
  track: TrackData
}

type State = 'idle' | 'transparent' | 'png' | 'jpg' | 'clipboard'

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

function safe(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
}

export default function ExportBar({ cardRef, track }: Props) {
  const [state, setState] = useState<State>('idle')
  const busy = state !== 'idle'
  const filename = `${safe(track.artist)}-${safe(track.title)}-framesound`

  const exportPNG = async () => {
    if (!cardRef.current || busy) return
    setState('png')
    try {
      const dti = (await import('dom-to-image-more')).default
      const url = await dti.toPng(cardRef.current, { scale: 3 })
      const a = document.createElement('a')
      a.href = url; a.download = `${filename}.png`; a.click()
    } catch (e) { console.error(e) }
    finally { setState('idle') }
  }

  const exportJPG = async () => {
    if (!cardRef.current || busy) return
    setState('jpg')
    try {
      const dti = (await import('dom-to-image-more')).default
      const url = await dti.toJpeg(cardRef.current, { quality: 0.95, scale: 2 })
      const a = document.createElement('a')
      a.href = url; a.download = `${filename}.jpg`; a.click()
    } catch (e) { console.error(e) }
    finally { setState('idle') }
  }

  const exportTransparent = async () => {
    if (!cardRef.current || busy) return
    setState('transparent')
    try {
      const dti = (await import('dom-to-image-more')).default
      const blob = await dti.toBlob(cardRef.current, { bgcolor: null })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${filename}-transparent.png`; a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
    finally { setState('idle') }
  }

  const copyClipboard = async () => {
    if (!cardRef.current || busy) return
    setState('clipboard')
    try {
      const dti = (await import('dom-to-image-more')).default
      const blob = await dti.toBlob(cardRef.current, { scale: 2 })
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    } catch (e) { console.error(e) }
    finally { setState('idle') }
  }

  return (
    <div style={{
      borderTop: '1px solid var(--line)',
      padding: '12px var(--pad-x)',
      background: 'var(--bg-1)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em' }}>EXPORT</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>
          {filename.slice(0, 22)}{filename.length > 22 ? '…' : ''}.png
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <button className="btn" data-variant="primary" data-size="sm" onClick={exportPNG} disabled={busy}>
          {state === 'png' ? <span className="spin" style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid', borderTopColor: 'transparent', borderRadius: '50%' }} /> : <DlIcon />}
          <span>PNG · 3×</span>
        </button>
        <button className="btn" data-size="sm" onClick={exportJPG} disabled={busy}>
          {state === 'jpg' ? '…' : <DlIcon />}
          <span>JPG · 2×</span>
        </button>
        <button className="btn" data-size="sm" onClick={exportTransparent} disabled={busy}>
          {state === 'transparent' ? '…' : <DlIcon />}
          <span>Trans. PNG</span>
        </button>
        <button className="btn" data-size="sm" onClick={copyClipboard} disabled={busy}>
          {state === 'clipboard' ? '…' : <CopyIcon />}
          <span>Copy</span>
        </button>
      </div>
    </div>
  )
}
