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
      background: 'rgba(0,0,0,0.32)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      animation: 'fadeIn 0.2s ease both',
    }} role="dialog" aria-modal="true" aria-labelledby="batch-title" onClick={e => { if (e.target === e.currentTarget && !running) onClose() }}>
      <div style={{
        width: 'min(460px, 100%)', maxHeight: '86vh', overflowY: 'auto',
        borderRadius: 28, padding: '18px 20px 20px',
        animation: 'popIn 0.35s cubic-bezier(.2,.9,.25,1.05) both',
      }} className="scroll material">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 id="batch-title" className="display" style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Batch export</h2>
          <button
            type="button" onClick={onClose} disabled={running} aria-label="Close"
            style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--fill)', color: 'var(--text-2)', display: 'grid', placeItems: 'center' }}
          >
            <svg viewBox="0 0 14 14" width="12" height="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l8 8M11 3l-8 8" /></svg>
          </button>
        </div>
        <p className="footnote" style={{ margin: '4px 0 14px' }}>
          Paste a playlist or album link. Every track is rendered with your current
          design and downloaded as a zip. Up to 50 tracks.
        </p>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="field"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') load() }}
            placeholder="Playlist or album link…"
            spellCheck={false}
            disabled={running}
            aria-label="Playlist or album link"
          />
          <button
            type="button" onClick={load} disabled={loading || running || !url.trim()}
            className="btn" data-variant="gray"
          >{loading ? 'Loading…' : 'Load'}</button>
        </div>

        {error && <div style={{ marginTop: 10, fontSize: 13, color: 'var(--red)' }}>{error}</div>}

        {tracks.length > 0 && (
          <>
            <div className="group-title" style={{ marginTop: 18, padding: 0 }}>
              {tracks.length} track{tracks.length === 1 ? '' : 's'} ready
            </div>
            <div className="scroll group-body" style={{ maxHeight: 200, overflowY: 'auto', marginTop: 6, padding: '4px 12px' }}>
              {tracks.map((t, i) => (
                <div key={`${t.id}-${i}`} style={{
                  display: 'flex', gap: 8, alignItems: 'center',
                  padding: '7px 0', fontSize: 13,
                  color: running && i < done ? 'var(--text)' : 'var(--text-2)',
                }}>
                  <span className="tnum" style={{ width: 20, color: 'var(--text-3)' }}>{i + 1}</span>
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.title} — {t.artist}
                  </span>
                  {running && i < done && (
                    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="var(--tint)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-label="Done"><path d="M3 8l4 4 6-7" /></svg>
                  )}
                </div>
              ))}
            </div>

            {running && (
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--fill-2)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--tint)', transition: 'width 200ms' }} />
                </div>
                <div className="caption" style={{ marginTop: 6 }}>
                  Rendering {done} of {tracks.length}…
                </div>
              </div>
            )}

            <button
              type="button" onClick={run} disabled={running}
              className="btn" data-variant="primary"
              style={{ width: '100%', marginTop: 16 }}
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
