'use client'

import React, { useState } from 'react'
import { TrackData } from '@/types'

type Props = {
  cardRef: React.RefObject<HTMLDivElement>
  track: TrackData
}

type LoadingState = 'idle' | 'transparent' | 'png' | 'jpg' | 'clipboard'

function getFilename(track: TrackData, ext: string): string {
  const safe = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
  return `${safe(track.artist)}-${safe(track.title)}-framesound.${ext}`
}

export default function ExportBar({ cardRef, track }: Props) {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')

  const exportTransparent = async () => {
    if (!cardRef.current) return
    setLoadingState('transparent')
    try {
      const domtoimage = (await import('dom-to-image-more')).default
      const blob = await domtoimage.toBlob(cardRef.current, { bgcolor: null })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = getFilename(track, 'png')
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert('Export failed. This may be due to image CORS. Try a different track.')
    } finally {
      setLoadingState('idle')
    }
  }

  const exportPNG = async () => {
    if (!cardRef.current) return
    setLoadingState('png')
    try {
      const domtoimage = (await import('dom-to-image-more')).default
      const dataUrl = await domtoimage.toPng(cardRef.current, { scale: 3 })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = getFilename(track, 'png')
      a.click()
    } catch (e) {
      console.error(e)
      alert('Export failed.')
    } finally {
      setLoadingState('idle')
    }
  }

  const exportJPG = async () => {
    if (!cardRef.current) return
    setLoadingState('jpg')
    try {
      const domtoimage = (await import('dom-to-image-more')).default
      const dataUrl = await domtoimage.toJpeg(cardRef.current, { quality: 0.95, scale: 2 })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = getFilename(track, 'jpg')
      a.click()
    } catch (e) {
      console.error(e)
      alert('Export failed.')
    } finally {
      setLoadingState('idle')
    }
  }

  const copyToClipboard = async () => {
    if (!cardRef.current) return
    setLoadingState('clipboard')
    try {
      const domtoimage = (await import('dom-to-image-more')).default
      const blob = await domtoimage.toBlob(cardRef.current, { scale: 2 })
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setLoadingState('idle')
    } catch (e) {
      console.error(e)
      alert('Copy failed. Try downloading instead.')
    } finally {
      setLoadingState('idle')
    }
  }

  const busy = loadingState !== 'idle'

  const btnBase: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    cursor: busy ? 'not-allowed' : 'pointer',
    opacity: busy ? 0.6 : 1,
    transition: 'all 150ms',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: 'none',
  }

  return (
    <div
      style={{
        background: 'rgba(9,9,11,0.9)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #27272a',
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#f4f4f5' }}>{track.title}</div>
        <div style={{ fontSize: 11, color: '#71717a' }}>{track.artist}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          onClick={exportTransparent}
          disabled={busy}
          style={{
            ...btnBase,
            background: 'transparent',
            border: '1px solid #3f3f46',
            color: '#d4d4d8',
          }}
        >
          {loadingState === 'transparent' ? '…' : 'Transparent PNG'}
        </button>
        <button
          onClick={exportPNG}
          disabled={busy}
          style={{ ...btnBase, background: '#f4f4f5', color: '#09090b' }}
        >
          {loadingState === 'png' ? '…' : 'PNG HD'}
        </button>
        <button
          onClick={exportJPG}
          disabled={busy}
          style={{ ...btnBase, background: '#3f3f46', color: '#f4f4f5' }}
        >
          {loadingState === 'jpg' ? '…' : 'JPG'}
        </button>
        <button
          onClick={copyToClipboard}
          disabled={busy}
          style={{
            ...btnBase,
            background: 'transparent',
            border: '1px solid #3f3f46',
            color: '#d4d4d8',
            padding: '8px 12px',
          }}
          title="Copy to clipboard"
        >
          {loadingState === 'clipboard' ? '…' : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
