'use client'

import { useState, useRef, useCallback } from 'react'
import { TrackData, CardConfig } from '@/types'
import CardCanvas from './CardCanvas'
import { getTracksFromCollectionUrl } from '@/actions/spotify'

type Props = {
  config: CardConfig
  accentColor?: string | null
  onClose: () => void
}

function safe(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

const nextFrame = () =>
  new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())))

export default function BatchExport({ config, accentColor, onClose }: Props) {
  const [url, setUrl] = useState('')
  const [tracks, setTracks] = useState<TrackData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The track currently mounted in the hidden stage, by index.
  const [renderIdx, setRenderIdx] = useState<number | null>(null)
  const [done, setDone] = useState(0)
  const [running, setRunning] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null!)

  const load = useCallback(async () => {
    setLoading(true); setError(null); setTracks([])
    const r = await getTracksFromCollectionUrl(url)
    if (r.error) setError(r.error)
    setTracks(r.data)
    setLoading(false)
  }, [url])

  const run = useCallback(async () => {
    if (tracks.length === 0 || running) return
    setRunning(true); setDone(0); setError(null)
    try {
      const [{ toPng }, JSZipMod] = await Promise.all([
        import('html-to-image'),
        import('jszip'),
      ])
      const JSZip = JSZipMod.default
      const zip = new JSZip()

      // Cards are rendered one at a time into a hidden stage: mounting all of
      // them at once would mean hundreds of simultaneous image decodes.
      let failed = 0
      for (let i = 0; i < tracks.length; i++) {
        setRenderIdx(i)
        await nextFrame()
        const el = stageRef.current
        if (!el) { failed++; continue }
        await document.fonts.ready
        await Promise.all(
          Array.from(el.querySelectorAll('img')).map(img => img.decode().catch(() => {}))
        )
        try {
          const dataUrl = await toPng(el, { pixelRatio: 2 })
          zip.file(
            `${String(i + 1).padStart(2, '0')}-${safe(tracks[i].artist)}-${safe(tracks[i].title)}.png`,
            dataUrl.split(',')[1],
            { base64: true },
          )
        } catch (err) {
          // One unrenderable cover shouldn't cost the whole batch.
          console.error('Skipped track', tracks[i].title, err)
          failed++
        }
        setDone(i + 1)
      }

      if (failed === tracks.length) throw new Error('No cards could be rendered')
      if (failed > 0) setError(`${failed} of ${tracks.length} card${failed === 1 ? '' : 's'} could not be rendered and were skipped.`)

      const blob = await zip.generateAsync({ type: 'blob' })
      const href = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = href
      a.download = 'framesound-cards.zip'
      a.click()
      URL.revokeObjectURL(href)
    } catch (e) {
      console.error('Batch export failed:', e)
      setError(e instanceof Error ? e.message.slice(0, 80) : 'Export failed')
    } finally {
      setRunning(false)
      setRenderIdx(null)
    }
  }, [tracks, running])

  const pct = tracks.length ? Math.round((done / tracks.length) * 100) : 0

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget && !running) onClose() }}>
      <div style={{
        width: 'min(460px, 100%)', maxHeight: '86vh', overflowY: 'auto',
        background: 'var(--panel)', border: '1px solid var(--panel-line)',
        borderRadius: 18, padding: 18,
      }} className="scroll">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--fg)' }}>Batch export</h2>
          <button
            type="button" onClick={onClose} disabled={running} aria-label="Close"
            style={{ background: 'transparent', border: 0, cursor: running ? 'not-allowed' : 'pointer', color: 'var(--fg-3)', fontSize: 16 }}
          >✕</button>
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.5 }}>
          Paste a playlist or album link. Every track is rendered with your current
          design and downloaded as a zip. Up to 50 tracks.
        </p>

        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') load() }}
            placeholder="Playlist or album link…"
            spellCheck={false}
            disabled={running}
            style={{
              flex: 1, height: 34, borderRadius: 9, border: 0, padding: '0 10px',
              background: 'var(--panel-well)', color: 'var(--fg)', fontSize: 12.5, outline: 'none',
            }}
          />
          <button
            type="button" onClick={load} disabled={loading || running || !url.trim()}
            className="btn" data-variant="primary"
            style={{ height: 34, borderRadius: 9, fontSize: 12.5 }}
          >{loading ? 'Loading…' : 'Load'}</button>
        </div>

        {error && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--danger)' }}>{error}</div>}

        {tracks.length > 0 && (
          <>
            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--fg-2)' }}>
              {tracks.length} track{tracks.length === 1 ? '' : 's'} ready
            </div>
            <div className="scroll" style={{ maxHeight: 170, overflowY: 'auto', marginTop: 8 }}>
              {tracks.map((t, i) => (
                <div key={`${t.id}-${i}`} style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                  padding: '5px 0', fontSize: 12,
                  color: running && i < done ? 'var(--accent)' : 'var(--fg-2)',
                }}>
                  <span className="tnum" style={{ width: 20, color: 'var(--fg-4)' }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title} — {t.artist}
                  </span>
                  {running && i < done && <span>✓</span>}
                </div>
              ))}
            </div>

            {running && (
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--panel-well-2)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: accentColor ?? 'var(--accent)', transition: 'width 200ms' }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--fg-3)' }}>
                  Rendering {done} of {tracks.length}…
                </div>
              </div>
            )}

            <button
              type="button" onClick={run} disabled={running}
              className="btn" data-variant="primary"
              style={{ width: '100%', marginTop: 14, height: 38, borderRadius: 10, justifyContent: 'center' }}
            >{running ? 'Exporting…' : `Export ${tracks.length} cards as zip`}</button>
          </>
        )}

        {/* Hidden render stage — offscreen rather than display:none, which would
            collapse layout and break html-to-image. */}
        <div aria-hidden style={{ position: 'fixed', left: -99999, top: 0, width: 520, pointerEvents: 'none' }}>
          {renderIdx !== null && tracks[renderIdx] && (
            <CardCanvas
              ref={stageRef}
              track={tracks[renderIdx]}
              config={config}
              exportMode
              accentColor={accentColor}
            />
          )}
        </div>
      </div>
    </div>
  )
}
