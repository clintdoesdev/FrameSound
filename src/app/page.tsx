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
import Landing, { Logo } from '@/components/Landing'
import { GlassTabs } from '@/components/glass/Controls'
import {
  LiquidGlassProvider, Glass, useColorScheme, useGlassSupport, useMediaQuery, type Theme,
} from '@/lib/liquid-glass/LiquidGlass'
import { paintEditor, loadImage } from '@/lib/wallpaper'

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

const LinkIcon = () => (
  <svg viewBox="0 0 24 24" {...stroke} strokeWidth={1.8}>
    <path d="M10 14a4 4 0 0 1 0-5.6l3-3a4 4 0 1 1 5.6 5.6l-1.5 1.5" />
    <path d="M14 10a4 4 0 0 1 0 5.6l-3 3a4 4 0 1 1-5.6-5.6L6.9 11.5" />
  </svg>
)

/** Dark or light text, whichever reads better on the given colour. */
function inkFor(hex: string): string {
  const n = parseInt(hex.slice(1), 16)
  const lin = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  const lum = 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  return lum > 0.2 ? '#0a0a0c' : '#ffffff'
}

// Order matches the settings panel, so the 1–7 shortcuts line up with the grid.
const PRESET_ORDER: CardConfig['preset'][] =
  ['glass', 'bezel', 'bloom', 'ticket', 'tag', 'profile', 'player']

// ── Backdrop for the glass ─────────────────────────────────────
// The editor's album-art backdrop. Repaints when the theme, artwork or viewport
// changes; a fresh canvas each time lets the provider notice by identity.
function useWallpaper(active: boolean, coverUrl: string | null | undefined, accent: string | null, theme: Theme) {
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
    if (!size || !active) return
    const [w, h] = size
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanvas(paintEditor(theme, w, h, art, accent))
  }, [active, size, theme, art, accent])

  return active ? canvas : null

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
  const onLanding = !track && !loading
  // WebGL glass only where nothing scrolls beneath it: the fixed desktop editor.
  // Anywhere else a canvas redrawn per frame trails the scroll and wobbles, so
  // those layouts use CSS glass.
  const desktop = useMediaQuery('(min-width: 900px) and (pointer: fine)')
  const wallpaper = useWallpaper(!onLanding, track?.coverUrl, accentColor, theme)

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
      document.querySelector<HTMLInputElement>('.hero-input input, .search input')?.focus()
    }
  }

  const heroSearch = (
    <TrackSearch onSelect={selectSearchResult} query={url}>
      <div className="hero-input glass">
        <LinkIcon />
        <input
          value={url}
          onChange={e => handleUrlInput(e.target.value)}
          onPaste={handlePaste}
          placeholder="Search or paste a Spotify link…"
          aria-label="Search a song, or paste a Spotify link"
          spellCheck={false}
          autoComplete="off"
          autoFocus
        />
        <button type="button" className="btn btn-glow" data-variant="primary" onClick={pasteFromClipboard}
          style={{ height: 44, borderRadius: 12, flexShrink: 0 }}>
          <PasteIcon /> Paste
        </button>
      </div>
    </TrackSearch>
  )

  const editorSearch = (
    <TrackSearch onSelect={selectSearchResult} query={url}>
      <Glass className="search">
        <SearchIcon />
        <input
          value={url}
          onChange={e => handleUrlInput(e.target.value)}
          onPaste={handlePaste}
          placeholder="Search or paste a Spotify link"
          aria-label="Search a song, or paste a Spotify link"
          spellCheck={false}
          autoComplete="off"
        />
        {loading && <span className="spinner" style={{ color: 'var(--accent-text)', marginRight: 10 }} aria-label="Loading" />}
      </Glass>
    </TrackSearch>
  )

  const errorNote = error && (
    <p role="alert" style={{ margin: '10px 0 0', fontSize: 13, color: 'var(--danger)', textAlign: 'center' }}>{error}</p>
  )

  const batchSheet = batchOpen && (
    <BatchExport config={config} accentColor={accentColor} onClose={() => setBatchOpen(false)} />
  )

  // The album colour re-tints the whole UI; ink is picked for contrast on it.
  const accentStyle = accentColor && /^#[0-9a-f]{6}$/i.test(accentColor) && (
    <style>{`:root { --accent: ${accentColor}; --accent-ink: ${inkFor(accentColor)}; }`}</style>
  )

  let screen: React.ReactNode

  // ── EMPTY STATE ──────────────────────────────────────────────
  if (onLanding) {
    screen = (
      <Landing
        search={heroSearch}
        error={errorNote}
        recent={<RecentTracks onSelect={loadFromRecent} />}
        onBatch={() => setBatchOpen(true)}
      >
        {batchSheet}
      </Landing>
    )
  }

  // ── LOADING STATE ────────────────────────────────────────────
  else if (loading) {
    screen = (
      <div className="app editor" aria-busy="true">
        <header className="top">
          <Glass as="nav" className="nav-bar" aria-label="Main">
            <span style={{ paddingLeft: 6 }}><Logo size={26} /></span>
          </Glass>
        </header>
        <div className="editor-main">
          <section className="stage">
            {editorSearch}
            <div className="stage-card">
              <div className="card-fit pulse" style={{ ['--ar' as string]: '0.8', aspectRatio: '4 / 5', borderRadius: 28, background: 'var(--surface-2)' }} />
            </div>
          </section>
          <Glass as="aside" material="sheet" className="sheet">
            <div className="sheet-head">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="pulse" style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--surface-2)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div className="pulse" style={{ height: 12, width: '64%', borderRadius: 6, background: 'var(--surface-2)' }} />
                  <div className="pulse" style={{ height: 10, width: '40%', borderRadius: 6, background: 'var(--surface-2)' }} />
                </div>
              </div>
              <div className="pulse" style={{ height: 46, borderRadius: 14, background: 'var(--surface)' }} />
            </div>
            <div className="sheet-scroll">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[120, 150, 110].map((h, i) => (
                  <div key={i} className="pulse" style={{ height: h, borderRadius: 14, background: 'var(--surface)', animationDelay: `${i * 0.12}s` }} />
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
            ><BackIcon /> <span className="hide-sm">Back</span></button>
            <span className="nav-sep" />
            <span className="nav-logo" style={{ marginLeft: 4, minWidth: 0 }}><Logo size={24} /></span>
            <span style={{ flex: 1 }} />
            <button type="button" className="icon-btn" onClick={undo} disabled={!canUndo}
              title="Undo (⌘Z)" aria-label="Undo"><UndoIcon /></button>
            <button type="button" className="icon-btn" onClick={redo} disabled={!canRedo}
              title="Redo (⇧⌘Z)" aria-label="Redo"><UndoIcon flip /></button>
            <span className="nav-sep" />
            <button type="button" className="bar-btn" onClick={copyShareLink}
              title="Copy a link to this card" aria-label="Copy share link">
              <ShareIcon /> <span className="hide-sm">{shareCopied ? 'Link copied' : 'Share'}</span>
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
              {editorSearch}
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
                  <div style={{ width: 44, height: 44, borderRadius: 11, overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'var(--surface-2)' }}>
                    {track.coverUrl && (
                      <Image src={track.coverUrl} alt="" fill sizes="44px" style={{ objectFit: 'cover' }} unoptimized />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="eyebrow" style={{ marginBottom: 4 }}>Now editing</div>
                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {track.artist} · {track.releaseYear} · {track.duration}
                    </div>
                  </div>
                </div>
              )}
              <GlassTabs label="Settings" items={PANEL_TABS} value={tab} onChange={setTab} />
            </div>

            <div className="sheet-scroll scroll" role="tabpanel" aria-label={tab}>
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
    <LiquidGlassProvider source={wallpaper} theme={theme} enabled={desktop && !onLanding}>
      {accentStyle}
      {!onLanding && <WallpaperFallback canvas={wallpaper} />}
      {screen}
    </LiquidGlassProvider>
  )
}
