'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { getTrackFromUrl } from '@/actions/spotify'
import { getLyrics } from '@/actions/lyrics'
import { TrackData, CardConfig, defaultConfig } from '@/types'
import CardCanvas from '@/components/CardCanvas'
import LyricsPanel from '@/components/LyricsPanel'
import CustomizePanel, { PANEL_TABS, type PanelTab } from '@/components/CustomizePanel'
import ExportBar from '@/components/ExportBar'
import AudioPreview from '@/components/AudioPreview'
import RecentTracks, { addRecentTrack } from '@/components/RecentTracks'
import { useConfigHistory } from '@/lib/useConfigHistory'
import { decodeConfig, buildShareUrl } from '@/lib/permalink'
import TrackSearch from '@/components/TrackSearch'
import BatchExport from '@/components/BatchExport'
import { GlassTabs } from '@/components/glass/Controls'
import {
  LiquidGlassProvider, Glass, useColorScheme, useGlassSupport, type Theme,
} from '@/lib/liquid-glass/LiquidGlass'
import { paintLanding, paintEditor, loadImage } from '@/lib/wallpaper'

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const BackIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2.2}><path d="M15 5l-7 7 7 7" /></svg>
)
const UndoIcon = ({ flip }: { flip?: boolean }) => (
  <svg viewBox="0 0 24 24" {...stroke} style={flip ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </svg>
)
const ShareIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke}>
    <path d="M8 9.5H6.5a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-7.5a2 2 0 0 0-2-2H16" /><path d="M12 14V3" /><path d="m8 6.5 4-4 4 4" />
  </svg>
)
const StackIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke}>
    <rect x="3.5" y="8" width="17" height="12.5" rx="3" /><path d="M6.5 5h11M9 2.5h6" />
  </svg>
)
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} strokeWidth={2}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
)
const PasteIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} width="16" height="16">
    <rect x="7" y="4" width="13" height="16" rx="3" /><path d="M7 7.5H6a2 2 0 0 0-2 2V19a2 2 0 0 0 2 2h1" />
  </svg>
)

// Order matches the settings panel, so the 1–7 shortcuts line up with the grid.
const PRESET_ORDER: CardConfig['preset'][] =
  ['glass', 'bezel', 'bloom', 'ticket', 'tag', 'profile', 'player']

function Logo({ size = 28, label = true }: { size?: number; label?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span aria-hidden style={{
        width: size, height: size, borderRadius: size * 0.28, flex: 'none',
        background: 'linear-gradient(135deg, #5e5ce6 0%, #bf5af2 55%, #ff375f 100%)',
        display: 'grid', placeItems: 'center',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.12)',
      }}>
        <span style={{ width: size * 0.42, height: size * 0.42, borderRadius: size * 0.1, background: 'rgba(255,255,255,0.92)' }} />
      </span>
      {label && (
        <span className="display" style={{ fontWeight: 700, fontSize: size * 0.62, color: 'var(--text)' }}>FrameSound</span>
      )}
    </span>
  )
}

// ── Backdrop for the glass ─────────────────────────────────────
// Repaints when the mode, theme, artwork or viewport changes. A fresh canvas
// each time lets the provider notice the change by identity.
function useWallpaper(mode: 'landing' | 'editor', coverUrl: string | null | undefined, accent: string | null, theme: Theme) {
  const [size, setSize] = useState<[number, number] | null>(null)
  const [art, setArt] = useState<HTMLImageElement | null>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined
    const measure = () => setSize(prev => {
      const next: [number, number] = [innerWidth, innerHeight]
      // Mobile URL bars nudge the height constantly; only repaint on real changes.
      return prev && Math.abs(prev[0] - next[0]) < 2 && Math.abs(prev[1] - next[1]) < 120 ? prev : next
    })
    const onResize = () => { clearTimeout(t); t = setTimeout(measure, 150) }
    measure()
    addEventListener('resize', onResize)
    return () => { clearTimeout(t); removeEventListener('resize', onResize) }
  }, [])

  useEffect(() => {
    let alive = true
    // Remote art goes through the same-origin proxy, so WebGL may read the pixels.
    const src = coverUrl && (/^https?:/i.test(coverUrl) ? `/api/proxy-image?url=${encodeURIComponent(coverUrl)}` : coverUrl)
    if (src) loadImage(src).then(img => { if (alive) setArt(img) })
    else Promise.resolve().then(() => { if (alive) setArt(null) })
    return () => { alive = false }
  }, [coverUrl])

  useEffect(() => {
    if (!size) return
    const [w, h] = size
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanvas(mode === 'landing' ? paintLanding(theme, w, h, accent) : paintEditor(theme, w, h, art, accent))
  }, [mode, size, theme, art, accent])

  return canvas
}

/** Without WebGL2 the wallpaper is shown as a plain CSS background instead. */
function WallpaperFallback({ canvas }: { canvas: HTMLCanvasElement | null }) {
  const supported = useGlassSupport()
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (supported === false && canvas) setUrl(canvas.toDataURL('image/jpeg', 0.85))
  }, [supported, canvas])
  if (supported !== false || !url) return null
  return <div className="wallpaper-fallback" aria-hidden style={{ backgroundImage: `url(${url})` }} />
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [track, setTrack] = useState<TrackData | null>(null)
  const { config, update: updateConfig, resetHere, undo, redo, canUndo, canRedo } = useConfigHistory(defaultConfig)
  const [lyrics, setLyrics] = useState<string[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accentColor, setAccentColor] = useState<string | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [tab, setTab] = useState<PanelTab>('style')
  const theme = useColorScheme()
  const wallpaper = useWallpaper(!track && !loading ? 'landing' : 'editor', track?.coverUrl, accentColor, theme)

  // cardRef → hidden off-screen export card (what dom-to-image captures)
  const cardRef = useRef<HTMLDivElement>(null!)
  // ExportBar refreshes this every render, so the shortcut always calls the
  // current closure rather than a stale one captured at mount.
  const exportActions = useRef<{ exportPng: () => void } | null>(null)
  // Loading a track keeps the user's styling but starts a fresh undo timeline,
  // so undo can't walk back into a different song's state.
  const startNewTrack = useCallback(() => {
    resetHere({ lyricQuote: '' })
  }, [resetHere])

  // Stable reference — LyricsPanel depends on this identity in a useEffect;
  // an inline arrow here would change every render and loop indefinitely.
  const handleQuoteChange = useCallback((q: string) => {
    updateConfig({ lyricQuote: q })
  }, [updateConfig])

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)
      const mod = e.metaKey || e.ctrlKey

      if (mod && e.key.toLowerCase() === 'z') {
        if (typing) return
        e.preventDefault()
        if (e.shiftKey) redo(); else undo()
        return
      }
      if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        exportActions.current?.exportPng()
        return
      }
      if (typing || mod || e.altKey) return
      // 1–7 jump straight to a preset
      const n = Number(e.key)
      if (n >= 1 && n <= PRESET_ORDER.length) {
        e.preventDefault()
        updateConfig({ preset: PRESET_ORDER[n - 1] })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, updateConfig])

  // Extract accent colour from album art with colorthief
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!track?.coverUrl) { setAccentColor(null); return }
    const coverUrl = track.coverUrl
    import('colorthief').then(({ getColorSync, getPaletteSync }) => {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const color = getColorSync(img)
          if (!color) return
          const { r, g, b } = color.rgb()
          const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
          if (lum >= 0.15 && lum <= 0.85) {
            setAccentColor(color.hex()); return
          }
          if (lum < 0.15) {
            // dominant color too dark — scan palette for most vibrant bright color
            try {
              const palette = getPaletteSync(img, { colorCount: 8 })
              const viable = (palette ?? [])
                .map(c => { const { r: pr, g: pg, b: pb } = c.rgb(); return { hex: c.hex(), lum: (0.299*pr+0.587*pg+0.114*pb)/255, sat: Math.max(pr,pg,pb)-Math.min(pr,pg,pb) } })
                .filter(c => c.lum > 0.2 && c.sat > 30)
                .sort((a,b) => b.sat - a.sat)
              setAccentColor(viable.length > 0 ? viable[0].hex : '#1db954')
            } catch { setAccentColor('#1db954') }
            return
          }
          // too light — darken 30%
          const { r: r2, g: g2, b: b2 } = color.rgb()
          setAccentColor(`#${[r2,g2,b2].map(v=>Math.round(v*0.7).toString(16).padStart(2,'0')).join('')}`)
        } catch { }
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
      startNewTrack()
      getLyrics(result.data.artist, result.data.title).then(r => {
        setLyrics(r.lines.length > 0 ? r.lines : null)
      })
    } else {
      setError(result.error ?? 'Failed to fetch track')
    }
    setLoading(false)
  }, [startNewTrack])

  // ── Restore a shared card from the URL ────────────────────────
  const restoredRef = useRef(false)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    const { config: shared, trackId } = decodeConfig(window.location.search)
    // Order matters: loading a track calls startNewTrack(), which clears the
    // lyric quote. Apply the shared config after that settles, or the restored
    // quote is wiped by the very fetch that the link asked for.
    if (trackId) {
      fetchTrack(`https://open.spotify.com/track/${trackId}`).then(() => {
        if (Object.keys(shared).length) resetHere(shared)
      })
    } else if (Object.keys(shared).length) {
      resetHere(shared)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const copyShareLink = useCallback(() => {
    navigator.clipboard.writeText(buildShareUrl(config, track?.id)).then(
      () => {
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 1600)
      },
      () => { /* clipboard blocked — nothing useful to fall back to here */ },
    )
  }, [config, track?.id])

  const selectSearchResult = useCallback((t: TrackData) => {
    setTrack(t)
    addRecentTrack(t)
    setUrl('')
    setError(null)
    startNewTrack()
    setLyrics(null)
    getLyrics(t.artist, t.title).then(r => {
      setLyrics(r.lines.length > 0 ? r.lines : null)
    })
  }, [startNewTrack])

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
    startNewTrack()
    setLyrics(null)
    getLyrics(t.artist, t.title).then(r => {
      setLyrics(r.lines.length > 0 ? r.lines : null)
    })
  }, [startNewTrack])

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) handleUrlInput(text)
    } catch {
      // Clipboard read denied — focus the field so the user can paste manually
      document.querySelector<HTMLInputElement>('.search input')?.focus()
    }
  }

  const searchBar = (hero: boolean) => (
    <TrackSearch onSelect={selectSearchResult} query={url}>
      <Glass className="search" style={hero ? { height: 60, paddingLeft: 22 } : undefined}>
        <SearchIcon />
        <input
          value={url}
          onChange={e => handleUrlInput(e.target.value)}
          onPaste={handlePaste}
          placeholder="Search or paste a Spotify link"
          aria-label="Search a song, or paste a Spotify link"
          spellCheck={false}
          autoComplete="off"
          autoFocus={hero}
        />
        {loading ? (
          <span className="spinner" style={{ color: 'var(--tint)', marginRight: 12 }} aria-label="Loading" />
        ) : hero ? (
          <button type="button" className="btn" data-variant="primary" onClick={pasteFromClipboard}
            style={{ borderRadius: 999, minHeight: 44, padding: '0 18px' }}>
            <PasteIcon /> Paste
          </button>
        ) : null}
      </Glass>
    </TrackSearch>
  )

  const errorNote = error && (
    <p role="alert" style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--red)', textAlign: 'center' }}>{error}</p>
  )

  const batchSheet = batchOpen && (
    <BatchExport config={config} accentColor={accentColor} onClose={() => setBatchOpen(false)} />
  )

  let screen: React.ReactNode

  // ── EMPTY STATE ──────────────────────────────────────────────
  if (!track && !loading) {
    screen = (
      <div className="app landing">
        <header className="top">
          <Glass as="nav" className="nav-bar" aria-label="Main">
            <span style={{ paddingLeft: 10 }}><Logo /></span>
            <span style={{ flex: 1 }} />
            <button type="button" className="bar-btn" onClick={() => setBatchOpen(true)}
              title="Export a playlist or album as a zip">
              <StackIcon /> <span className="hide-sm">Batch export</span>
            </button>
          </Glass>
        </header>

        <main className="hero">
          <h1 className="display fade-up" style={{
            fontWeight: 700, fontSize: 'clamp(40px, 7vw, 72px)', letterSpacing: '-0.035em',
            lineHeight: 1.04, textAlign: 'center', margin: '0 0 14px', animationDelay: '0.05s',
          }}>
            Turn Spotify<br />into art.
          </h1>
          <p className="fade-up" style={{
            fontSize: 17, color: 'var(--text-2)', textAlign: 'center',
            maxWidth: 400, margin: '0 0 36px', lineHeight: 1.45, animationDelay: '0.12s',
          }}>
            Paste a track link and get a liquid-glass card, ready to share in seconds.
          </p>

          <div className="fade-up" style={{ width: '100%', maxWidth: 580, animationDelay: '0.2s' }}>
            {searchBar(true)}
            {errorNote}
            <p className="footnote" style={{ margin: '12px 0 0', textAlign: 'center' }}>
              Search by name, or paste a track link
            </p>
          </div>

          <div className="fade-in" style={{ marginTop: 28, maxWidth: '100%', animationDelay: '0.32s' }}>
            <RecentTracks onSelect={loadFromRecent} />
          </div>
        </main>

        <footer className="landing-foot">
          <span>created by <b style={{ color: 'var(--text)', letterSpacing: '0.04em' }}>CLINTDOESDEV.</b></span>
          <span>
            want to work with him?{' '}
            <a href="https://clintdoesdev.site" target="_blank" rel="noopener noreferrer">check out his portfolio ↗</a>
          </span>
        </footer>
        {batchSheet}
      </div>
    )
  }

  // ── LOADING STATE ────────────────────────────────────────────
  else if (loading) {
    screen = (
      <div className="app editor" aria-busy="true">
        <header className="top">
          <Glass as="nav" className="nav-bar" aria-label="Main">
            <span style={{ paddingLeft: 10 }}><Logo /></span>
          </Glass>
        </header>
        <div className="editor-main">
          <section className="stage">
            {searchBar(false)}
            <div className="stage-card">
              <div className="card-fit pulse" style={{ ['--ar' as string]: '0.8', aspectRatio: '4 / 5', borderRadius: 28, background: 'var(--fill)' }} />
            </div>
          </section>
          <Glass as="aside" material="sheet" className="sheet">
            <div className="sheet-head">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="pulse" style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--fill)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div className="pulse" style={{ height: 12, width: '64%', borderRadius: 6, background: 'var(--fill)' }} />
                  <div className="pulse" style={{ height: 10, width: '40%', borderRadius: 6, background: 'var(--fill)' }} />
                </div>
              </div>
            </div>
            <div className="sheet-scroll">
              <div className="panel-stack">
                {[120, 150, 110].map((h, i) => (
                  <div key={i} className="pulse" style={{ height: h, borderRadius: 14, background: 'var(--row)', animationDelay: `${i * 0.12}s` }} />
                ))}
              </div>
            </div>
          </Glass>
        </div>
      </div>
    )
  }

  // ── LOADED STATE ─────────────────────────────────────────────
  else {
    const aspect = config.preset === 'player' ? 1 : 0.8
    screen = (
      <div className="app editor">
        <header className="top">
          <Glass as="nav" className="nav-bar" aria-label="Editor">
            <button
              type="button" className="bar-btn"
              onClick={() => { setTrack(null); setUrl(''); setError(null); setLyrics(null) }}
            ><BackIcon /> Back</button>
            <span className="hide-sm" style={{ marginLeft: 6 }}><Logo size={24} /></span>
            <span style={{ flex: 1 }} />
            <button type="button" className="icon-btn" onClick={undo} disabled={!canUndo}
              title="Undo (⌘Z)" aria-label="Undo"><UndoIcon /></button>
            <button type="button" className="icon-btn" onClick={redo} disabled={!canRedo}
              title="Redo (⇧⌘Z)" aria-label="Redo"><UndoIcon flip /></button>
            <button type="button" className="bar-btn" onClick={copyShareLink}
              title="Copy a link to this card" aria-label="Copy share link">
              <ShareIcon /> <span className="hide-sm">{shareCopied ? 'Copied' : 'Share'}</span>
            </button>
            <button type="button" className="bar-btn" onClick={() => setBatchOpen(true)}
              title="Export a playlist or album as a zip">
              <StackIcon /> <span className="hide-sm">Batch</span>
            </button>
          </Glass>
        </header>

        <div className="editor-main">
          {/* ── Stage: search, card, preview ─────────────────── */}
          <section className="stage" aria-label="Preview">
            <div>
              {searchBar(false)}
              {errorNote}
            </div>

            <div className="stage-card">
              <div className="card-fit" style={{ ['--ar' as string]: String(aspect) }}>
                {track && (
                  <CardCanvas ref={cardRef} track={track} config={config} exportMode accentColor={accentColor} />
                )}
              </div>
            </div>

            <div className="stage-foot">
              {track?.previewUrl && <AudioPreview previewUrl={track.previewUrl} trackId={track.id} />}
              <RecentTracks onSelect={loadFromRecent} />
            </div>
          </section>

          {/* ── Sheet: settings + export ─────────────────────── */}
          <Glass as="aside" material="sheet" className="sheet" aria-label="Customize">
            <div className="sheet-head">
              {track && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'var(--fill)' }}>
                    {track.coverUrl && (
                      <Image src={track.coverUrl} alt="" fill sizes="44px" style={{ objectFit: 'cover' }} unoptimized />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {track.artist} · {track.releaseYear} · {track.duration}
                    </div>
                  </div>
                </div>
              )}
              <GlassTabs label="Settings" items={PANEL_TABS} value={tab} onChange={setTab} />
            </div>

            <div className="sheet-scroll scroll" data-glass-clip role="tabpanel" aria-label={tab}>
              <CustomizePanel
                tab={tab}
                config={config}
                onChange={updateConfig}
                lyrics={
                  <LyricsPanel
                    lines={lyrics ?? []}
                    loading={false}
                    value={config.lyricQuote}
                    onQuoteChange={handleQuoteChange}
                  />
                }
              />
            </div>

            {track && (
              <div className="sheet-foot">
                <ExportBar cardRef={cardRef} track={track} config={config} onConfigChange={updateConfig} actionsRef={exportActions} />
              </div>
            )}
          </Glass>
        </div>
        {batchSheet}
      </div>
    )
  }

  return (
    <LiquidGlassProvider source={wallpaper} theme={theme}>
      <WallpaperFallback canvas={wallpaper} />
      {screen}
    </LiquidGlassProvider>
  )
}
