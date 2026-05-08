'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
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

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/>
  </svg>
)

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 14a4 4 0 0 1 0-5.6l3-3a4 4 0 1 1 5.6 5.6l-1.5 1.5"/>
    <path d="M14 10a4 4 0 0 1 0 5.6l-3 3a4 4 0 1 1-5.6-5.6L6.9 11.5"/>
  </svg>
)

function Logo() {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: 'linear-gradient(135deg, var(--accent) 0%, oklch(from var(--accent) calc(l - 0.12) c h) 100%)',
        display: 'grid', placeItems: 'center',
        boxShadow: '0 0 0 1px oklch(from var(--accent) l c h / 0.3)',
      }}>
        <div style={{ width: 12, height: 12, borderRadius: 2, background: 'oklch(0 0 0 / 0.85)' }} />
      </div>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontWeight: 700, letterSpacing: '-0.02em',
        fontSize: 17, color: 'var(--fg)',
      }}>FrameSound</span>
    </div>
  )
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [track, setTrack] = useState<TrackData | null>(null)
  const [config, setConfig] = useState<CardConfig>(defaultConfig)
  const [lyrics, setLyrics] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accentColor, setAccentColor] = useState<string | null>(null)

  const cardRef = useRef<HTMLDivElement>(null!)

  const updateConfig = useCallback((updates: Partial<CardConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  // Extract accent colour from album art with colorthief
  useEffect(() => {
    if (!track?.coverUrl) { setAccentColor(null); return }
    const coverUrl = track.coverUrl
    import('colorthief').then(({ getColorSync }) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const color = getColorSync(img)
          if (color) setAccentColor(color.hex())
        } catch { /* CORS or extraction failure — keep default */ }
      }
      // Use Next.js image proxy to avoid Spotify CDN CORS issues
      img.src = `/_next/image?url=${encodeURIComponent(coverUrl)}&w=64&q=75`
    }).catch(() => {/* ignore */ })
  }, [track?.coverUrl])

  const fetchTrack = useCallback(async (rawUrl: string) => {
    setLoading(true)
    setError(null)
    setLyrics(null)
    const result = await getTrackFromUrl(rawUrl)
    if (result.data) {
      setTrack(result.data)
      addRecentTrack(result.data)
      // Reset lyric quote when new track loads
      setConfig(prev => ({ ...prev, lyricQuote: '' }))
      getLyrics(result.data.artist, result.data.title).then(r => {
        setLyrics(r.lines.length > 0 ? r.lines : null)
      })
    } else {
      setError(result.error ?? 'Failed to fetch track')
    }
    setLoading(false)
  }, [])

  const handleUrlInput = (val: string) => {
    setUrl(val)
    if (val.includes('spotify.com/track/') || val.includes('spotify:track:')) {
      fetchTrack(val)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text')
    if (pasted.includes('spotify.com/track/') || pasted.includes('spotify:track:')) {
      e.preventDefault()
      setUrl(pasted)
      fetchTrack(pasted)
    }
  }

  const loadFromRecent = useCallback((t: TrackData) => {
    setTrack(t)
    setUrl(`https://open.spotify.com/track/${t.id}`)
    setConfig(prev => ({ ...prev, lyricQuote: '' }))
    setLyrics(null)
    getLyrics(t.artist, t.title).then(r => {
      setLyrics(r.lines.length > 0 ? r.lines : null)
    })
  }, [])

  const urlBar = (
    <div style={{ position: 'relative', width: '100%' }}>
      <div className="input" style={{ height: 52, paddingLeft: 16, paddingRight: 16, fontSize: 15 }}>
        <span style={{ color: 'var(--fg-3)', flexShrink: 0 }}><LinkIcon /></span>
        <input
          value={url}
          onChange={e => handleUrlInput(e.target.value)}
          onPaste={handlePaste}
          placeholder="Paste a Spotify track link…"
          spellCheck={false}
          style={{ fontSize: 15 }}
        />
        {loading && (
          <span className="spin" style={{
            display: 'inline-block', width: 16, height: 16,
            border: '2px solid var(--accent)', borderTopColor: 'transparent',
            borderRadius: '50%', flexShrink: 0,
          }} />
        )}
      </div>
    </div>
  )

  // ── EMPTY STATE ──────────────────────────────────────────────
  if (!track && !loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        {accentColor && <style>{`:root { --accent: ${accentColor}; }`}</style>}

        {/* Minimal nav */}
        <nav style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', borderBottom: '1px solid var(--line-soft)',
          background: 'var(--bg)', flexShrink: 0,
        }}>
          <Logo />
          <a href="https://github.com/clintdoesdev/FrameSound" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--fg-2)', display: 'flex', alignItems: 'center' }}>
            <GithubIcon />
          </a>
        </nav>

        {/* Centered empty state */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 24px',
        }}>
          <div style={{ marginBottom: 40, textAlign: 'center' }}>
            <Logo />
          </div>
          <div style={{ width: '100%', maxWidth: 560 }}>
            {urlBar}
            {error && (
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--danger)', textAlign: 'center' }}>{error}</div>
            )}
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--fg-3)', textAlign: 'center' }}>
              spotify.com/track/… links only
            </div>
          </div>
          <RecentTracks onSelect={loadFromRecent} />
        </div>
      </div>
    )
  }

  // ── LOADING STATE ────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        <nav style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', borderBottom: '1px solid var(--line-soft)',
          background: 'var(--bg)', flexShrink: 0,
        }}>
          <Logo />
          <a href="https://github.com/clintdoesdev/FrameSound" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--fg-2)', display: 'flex', alignItems: 'center' }}>
            <GithubIcon />
          </a>
        </nav>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: 560, marginBottom: 40 }}>{urlBar}</div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Card skeleton */}
            <div className="animate-pulse-slow" style={{
              width: 340, height: 340, borderRadius: 18,
              background: 'var(--bg-1)', border: '1px solid var(--line)',
            }} />
            {/* Controls skeleton */}
            <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[80, 60, 100, 70, 90, 55].map((w, i) => (
                <div key={i} className="animate-pulse-slow" style={{
                  height: 14, width: `${w}%`, borderRadius: 4, background: 'var(--bg-2)',
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── LOADED STATE ─────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {accentColor && <style>{`:root { --accent: ${accentColor}; }`}</style>}

      {/* Nav */}
      <nav style={{
        height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: '1px solid var(--line-soft)',
        background: 'var(--bg)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 20,
      }}>
        <Logo />
        <a href="https://github.com/clintdoesdev/FrameSound" target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--fg-2)', display: 'flex', alignItems: 'center' }}>
          <GithubIcon />
        </a>
      </nav>

      {/* Split layout */}
      <div style={{
        flex: 1, display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        maxWidth: 1280, margin: '0 auto', width: '100%',
        padding: '0',
      }}
        className="editor-layout"
      >
        {/* ── LEFT: Card + Audio + Recent ─────────────────── */}
        <div style={{
          flex: '0 0 auto',
          width: 'min(560px, 100%)',
          padding: '32px 24px 24px',
          display: 'flex', flexDirection: 'column', gap: 20,
          position: 'sticky', top: 56, maxHeight: 'calc(100vh - 56px)',
          overflowY: 'auto',
        }}
          className="scroll left-col"
        >
          {/* URL bar stays at top of left col */}
          <div>
            {urlBar}
            {error && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--danger)' }}>{error}</div>
            )}
          </div>

          {/* Card preview */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            background: 'var(--bg-1)', borderRadius: 12,
            border: '1px solid var(--line)',
            padding: 20,
          }}>
            {track && (
              <div style={{
                transform: 'scale(0.72)', transformOrigin: 'top center',
                transition: 'opacity 150ms ease',
              }}>
                <CardCanvas track={track} config={config} cardRef={cardRef} />
              </div>
            )}
          </div>

          {/* Audio preview */}
          {track?.previewUrl && <AudioPreview previewUrl={track.previewUrl} trackId={track.id} />}

          {/* Recent tracks */}
          <RecentTracks onSelect={loadFromRecent} />
        </div>

        {/* ── RIGHT: Lyrics + Customize + Export ──────────── */}
        <div style={{
          flex: 1, minWidth: 0,
          borderLeft: '1px solid var(--line)',
          display: 'flex', flexDirection: 'column',
          minHeight: 'calc(100vh - 56px)',
        }}>
          {/* Track meta strip */}
          {track && (
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--line-soft)',
              display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'var(--bg-2)' }}>
                {track.coverUrl && (
                  <Image src={track.coverUrl} alt={track.title} fill style={{ objectFit: 'cover' }} unoptimized />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 1 }}>{track.artist}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2, letterSpacing: '0.04em' }}>
                  {track.album.toUpperCase()} · {track.releaseYear} · {track.duration}
                </div>
              </div>
            </div>
          )}

          {/* Lyrics panel */}
          <div style={{ borderBottom: '1px solid var(--line-soft)', flexShrink: 0 }}>
            <LyricsPanel
              lines={lyrics ?? []}
              loading={false}
              onQuoteChange={q => updateConfig({ lyricQuote: q })}
            />
          </div>

          {/* Customize panel — scrollable */}
          <div className="scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            <CustomizePanel config={config} onChange={updateConfig} />
          </div>

          {/* Export bar — sticky at bottom */}
          {track && (
            <ExportBar cardRef={cardRef} track={track} config={config} onConfigChange={updateConfig} />
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .editor-layout { flex-direction: column !important; }
          .left-col {
            position: static !important;
            width: 100% !important;
            max-height: none !important;
            overflow-y: visible !important;
          }
        }
      `}</style>
    </div>
  )
}
