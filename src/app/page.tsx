'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { getTrackFromUrl } from '@/actions/spotify'
import { getLyrics } from '@/actions/lyrics'
import { TrackData, CardConfig, defaultConfig } from '@/types'
import CardCanvas from '@/components/CardCanvas'
import LyricsPanel from '@/components/LyricsPanel'
import CustomizePanel from '@/components/CustomizePanel'
import ExportBar from '@/components/ExportBar'
import AudioPreview from '@/components/AudioPreview'
import RecentTracks, { addRecentTrack } from '@/components/RecentTracks'
import LandingPage, { Logo } from '@/components/LandingPage'

// Icons
const BackIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 6-6 6 6 6"/>
  </svg>
)
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9 1.7 1.7 0 0 0 4.3 7.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
  </svg>
)
const DlIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/>
  </svg>
)
const LinkIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 14a4 4 0 0 1 0-5.6l3-3a4 4 0 1 1 5.6 5.6l-1.5 1.5"/>
    <path d="M14 10a4 4 0 0 1 0 5.6l-3 3a4 4 0 1 1-5.6-5.6L6.9 11.5"/>
  </svg>
)

function EditorHeader({ onBack, onExport, busy }: { onBack: () => void; onExport: () => void; busy: boolean }) {
  return (
    <header style={{
      height: 'var(--header-h)', flexShrink: 0,
      borderBottom: '1px solid var(--line)',
      background: 'var(--bg)',
      display: 'grid', gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center', padding: '0 16px', gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn" data-variant="ghost" data-size="sm" onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <BackIcon /><span>Back</span>
        </button>
        <div style={{ width: 1, height: 18, background: 'var(--line)' }} />
        <Logo />
        <div className="mono" style={{
          fontSize: 11, color: 'var(--fg-3)', padding: '3px 7px',
          background: 'var(--bg-inset)', border: '1px solid var(--line)',
          borderRadius: 4, letterSpacing: '0.04em',
        }}>/editor</div>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {['Card', 'Lyrics', 'Export', 'History'].map((t, i) => (
          <button key={t} className="btn" data-variant="ghost" data-size="sm"
            style={{ color: i === 0 ? 'var(--fg)' : 'var(--fg-2)', background: i === 0 ? 'var(--bg-2)' : 'transparent' }}>
            {t}
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 99, background: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-quiet)' }} />
          AUTOSAVED · 0s
        </div>
        <button className="btn" data-variant="ghost" data-icon-only="true" data-size="sm"><SettingsIcon /></button>
        <button className="btn" data-variant="primary" data-size="sm" onClick={onExport} disabled={busy}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <DlIcon /><span>Export</span>
        </button>
      </div>
    </header>
  )
}

function URLBar({ url, onChange, loading, isLive }: {
  url: string; onChange: (v: string) => void; loading: boolean; isLive: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 16px', height: 'var(--header-h)',
      borderBottom: '1px solid var(--line)',
      background: 'var(--bg)',
      position: 'sticky', top: 0, zIndex: 5, flexShrink: 0,
    }}>
      <div style={{ flex: 1, maxWidth: 680 }}>
        <div className="input" style={{ height: 36 }}>
          <span style={{ color: 'var(--fg-3)' }}><LinkIcon /></span>
          <input
            value={url}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste a Spotify track URL…"
            spellCheck={false}
          />
          {loading && (
            <span className="spin" style={{
              display: 'inline-block', width: 14, height: 14,
              border: '2px solid var(--accent)', borderTopColor: 'transparent',
              borderRadius: '50%', flexShrink: 0,
            }} />
          )}
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-2)' }}>
        <span style={{
          display: 'inline-block', width: 6, height: 6, borderRadius: 99,
          background: isLive ? 'var(--accent)' : 'var(--fg-3)',
          boxShadow: isLive ? '0 0 0 3px var(--accent-quiet)' : 'none',
        }} />
        <span className="mono" style={{ fontSize: 11, letterSpacing: '0.04em' }}>
          {loading ? 'FETCHING…' : isLive ? 'TRACK · LIVE' : 'PASTE TO BEGIN'}
        </span>
      </div>
    </div>
  )
}

function EmptyStage() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16, color: 'var(--fg-3)',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: 'var(--bg-1)', border: '1px solid var(--line)',
        display: 'grid', placeItems: 'center', fontSize: 28,
      }}>♫</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, color: 'var(--fg-2)', fontWeight: 500 }}>Paste a Spotify URL to begin</div>
        <div style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4 }}>Supports track, album, and playlist links</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['5 card presets', 'Lyric quotes', 'PNG 3× export'].map(f => (
          <span key={f} className="mono" style={{
            fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em',
            padding: '4px 10px', background: 'var(--bg-1)',
            border: '1px solid var(--line)', borderRadius: 999,
          }}>{f}</span>
        ))}
      </div>
    </div>
  )
}

export default function Home() {
  const [view, setView] = useState<'landing' | 'editor'>('landing')
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [track, setTrack] = useState<TrackData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lyrics, setLyrics] = useState<string[]>([])
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const [selectedLines, setSelectedLines] = useState<string[]>([])
  const [customQuote, setCustomQuote] = useState('')
  const [config, setConfig] = useState<CardConfig>(defaultConfig)
  const [exportBusy, setExportBusy] = useState(false)

  const cardRef = useRef<HTMLDivElement>(null!)

  const fetchTrack = useCallback(async (url: string) => {
    setLoading(true)
    setError(null)
    setTrack(null)
    setLyrics([])
    setSelectedLines([])
    setCustomQuote('')
    const result = await getTrackFromUrl(url)
    if (result.data) {
      setTrack(result.data)
      addRecentTrack(result.data)
      setLyricsLoading(true)
      const lr = await getLyrics(result.data.artist, result.data.title)
      setLyrics(lr.lines)
      setLyricsLoading(false)
    } else {
      setError(result.error ?? 'Failed to fetch track')
    }
    setLoading(false)
  }, [])

  const handleUrlChange = (val: string) => {
    setSpotifyUrl(val)
    if (val.includes('spotify.com/track/') || val.includes('spotify:track:')) {
      fetchTrack(val)
    }
  }

  const handleLineSelect = (line: string) => {
    setSelectedLines((prev) =>
      prev.includes(line)
        ? prev.filter((l) => l !== line)
        : prev.length < 2 ? [...prev, line] : [prev[1], line]
    )
  }

  const effectiveSelectedLines = customQuote.trim()
    ? [customQuote.trim()]
    : selectedLines

  const handleExportPNG = async () => {
    if (!cardRef.current || exportBusy) return
    setExportBusy(true)
    try {
      const dti = (await import('dom-to-image-more')).default
      const url = await dti.toPng(cardRef.current, { scale: 3 })
      const a = document.createElement('a')
      a.href = url
      a.download = `framesound-card.png`
      a.click()
    } catch (e) { console.error(e) }
    finally { setExportBusy(false) }
  }

  if (view === 'landing') {
    return <LandingPage onOpenEditor={() => setView('editor')} />
  }

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', color: 'var(--fg)', overflow: 'hidden',
    }}>
      <EditorHeader onBack={() => setView('landing')} onExport={handleExportPNG} busy={exportBusy} />

      <RecentTracks onSelect={(t) => {
        setTrack(t)
        setSpotifyUrl(`https://open.spotify.com/track/${t.id}`)
        setLyricsLoading(true)
        getLyrics(t.artist, t.title).then((r) => {
          setLyrics(r.lines)
          setLyricsLoading(false)
        })
      }} />

      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* LEFT PANE — Customize */}
        <aside style={{
          width: 'var(--pane-w-l)',
          borderRight: '1px solid var(--line)',
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg)', minHeight: 0, flexShrink: 0,
        }}>
          <div style={{ padding: '14px var(--pad-x) 12px', borderBottom: '1px solid var(--line-soft)' }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              <span className="dot" /> CUSTOMIZE
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.4 }}>
              Style your card live.
              <span style={{ color: 'var(--fg-3)' }}> Changes render instantly.</span>
            </div>
          </div>
          <CustomizePanel config={config} onChange={(u) => setConfig((p) => ({ ...p, ...u }))} />
          <div style={{
            borderTop: '1px solid var(--line-soft)', padding: '10px var(--pad-x)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 11, color: 'var(--fg-3)', flexShrink: 0,
          }}>
            <span className="mono">cfg.json</span>
            <span className="mono">{Object.keys(config).length} keys</span>
          </div>
        </aside>

        {/* CENTER — URL bar + card stage */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <URLBar url={spotifyUrl} onChange={handleUrlChange} loading={loading} isLive={!!track} />

          {error && (
            <div style={{ padding: '8px 16px', background: 'oklch(0.66 0.18 25 / 0.12)', borderBottom: '1px solid oklch(0.66 0.18 25 / 0.3)' }}>
              <span style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</span>
            </div>
          )}

          {/* Stage */}
          <div className="stage-bg grid-bg" style={{
            flex: 1, minHeight: 0, position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {/* Stage annotations */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', letterSpacing: '0.04em' }}>
                STAGE · 1×
              </div>
              <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', letterSpacing: '0.04em' }}>
                PREVIEW
              </div>
              {track && (
                <div style={{ position: 'absolute', bottom: 16, left: 16, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', letterSpacing: '0.04em' }}>
                  EXPORTS @ 3×
                </div>
              )}
            </div>

            {loading ? (
              <div className="animate-pulse-slow" style={{
                width: 340, height: 340,
                background: 'var(--bg-1)', borderRadius: 18,
                border: '1px solid var(--line)',
              }} />
            ) : track ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 32 }}>
                <div style={{ transform: 'scale(0.75)', transformOrigin: 'top center' }}>
                  <CardCanvas
                    track={track}
                    config={config}
                    selectedLines={effectiveSelectedLines}
                    cardRef={cardRef}
                  />
                </div>
                <div className="mono" style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--fg-3)' }}>
                  <span>{config.preset.toUpperCase()}</span>
                  <span style={{ width: 3, height: 3, background: 'var(--fg-4)', borderRadius: 99 }} />
                  <span>{config.size}</span>
                  <span style={{ width: 3, height: 3, background: 'var(--fg-4)', borderRadius: 99 }} />
                  <span>EXPORTS @ 3×</span>
                </div>
              </div>
            ) : (
              <EmptyStage />
            )}
          </div>
        </div>

        {/* RIGHT PANE — Track info + Audio + Lyrics + Export */}
        <aside style={{
          width: 'var(--pane-w-r)',
          borderLeft: '1px solid var(--line)',
          display: 'flex', flexDirection: 'column',
          background: 'var(--bg)', minHeight: 0, flexShrink: 0,
        }}>
          {/* Track meta header */}
          {track ? (
            <div style={{ padding: '14px var(--pad-x)', borderBottom: '1px solid var(--line-soft)', display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
              <div style={{ width: 48, height: 48, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'var(--bg-2)' }}>
                {track.coverUrl && (
                  <Image src={track.coverUrl} alt={track.title} fill style={{ objectFit: 'cover' }} unoptimized />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 1 }}>{track.artist}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginTop: 3, letterSpacing: '0.04em' }}>
                  {track.album.toUpperCase()} · {track.releaseYear}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '14px var(--pad-x)', borderBottom: '1px solid var(--line-soft)', flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em' }}>LYRICS + EXPORT</div>
              <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4 }}>
                Paste a Spotify URL to fetch track data.
              </div>
            </div>
          )}

          {/* Audio preview */}
          {track?.previewUrl && <AudioPreview previewUrl={track.previewUrl} />}

          {/* Lyrics */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <LyricsPanel
              lines={lyrics}
              loading={lyricsLoading}
              selectedLines={selectedLines}
              onSelect={handleLineSelect}
              customQuote={customQuote}
              onCustomQuote={setCustomQuote}
            />
          </div>

          {/* Export bar */}
          {track && <ExportBar cardRef={cardRef} track={track} />}
          {!track && (
            <div style={{ padding: '12px var(--pad-x)', background: 'var(--bg-1)', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em', marginBottom: 8 }}>EXPORT</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, opacity: 0.4 }}>
                <button className="btn" data-variant="primary" data-size="sm" disabled>PNG · 3×</button>
                <button className="btn" data-size="sm" disabled>JPG · 2×</button>
                <button className="btn" data-size="sm" disabled>Trans. PNG</button>
                <button className="btn" data-size="sm" disabled>Copy</button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
