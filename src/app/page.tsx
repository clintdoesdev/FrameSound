'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { getTrackFromUrl } from '@/actions/spotify'
import { getLyrics } from '@/actions/lyrics'
import { TrackData, CardConfig, defaultConfig } from '@/types'
import CardCanvas, { sizeMap } from '@/components/CardCanvas'
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

const BackIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
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

type DemoCard = {
  title: string; artist: string; gradient: string
  rotate: string; anim: string; dur: string; delay: string
  pos: { top?: string; left?: string; right?: string; bottom?: string }
}

// Glass-panel floating cards (4 corners + 2 center sides)
const DEMO_CARDS: DemoCard[] = [
  { title: 'Blinding Lights', artist: 'The Weeknd',
    gradient: 'linear-gradient(145deg,#3d0066 0%,#c0003e 100%)',
    rotate: '-13deg', anim: 'float1', dur: '7s', delay: '0s',
    pos: { top: '13%', left: '3%' } },
  { title: 'As It Was', artist: 'Harry Styles',
    gradient: 'linear-gradient(145deg,#8b003f 0%,#f472b6 100%)',
    rotate: '10deg', anim: 'float2', dur: '8.5s', delay: '-3s',
    pos: { top: '10%', right: '3%' } },
  { title: 'Heat Waves', artist: 'Glass Animals',
    gradient: 'linear-gradient(145deg,#004a59 0%,#00bcd4 100%)',
    rotate: '7deg', anim: 'float3', dur: '9s', delay: '-5s',
    pos: { bottom: '15%', left: '2.5%' } },
  { title: 'Levitating', artist: 'Dua Lipa',
    gradient: 'linear-gradient(145deg,#b34400 0%,#fbbf24 100%)',
    rotate: '-8deg', anim: 'float1', dur: '6.5s', delay: '-2s',
    pos: { bottom: '12%', right: '2.5%' } },
  { title: 'MONTERO', artist: 'Lil Nas X',
    gradient: 'linear-gradient(145deg,#1a0040 0%,#7c3aed 100%)',
    rotate: '6deg', anim: 'float2', dur: '7.5s', delay: '-4.5s',
    pos: { top: '47%', left: '1%' } },
  { title: 'bad guy', artist: 'Billie Eilish',
    gradient: 'linear-gradient(145deg,#012817 0%,#16a34a 100%)',
    rotate: '-7deg', anim: 'float3', dur: '8s', delay: '-1.5s',
    pos: { top: '45%', right: '1%' } },
]

// Poster-style cards — full-bleed gradient art, text at bottom
type DemoPosterCard = {
  title: string; artist: string; gradient: string
  rotate: string; anim: string; dur: string; delay: string
  pos: { top?: string; left?: string; right?: string; bottom?: string }
}

const DEMO_POSTER_CARDS: DemoPosterCard[] = [
  { title: 'Kill Bill', artist: 'SZA',
    gradient: 'linear-gradient(160deg,#1e0f33 0%,#9333ea 55%,#db2777 100%)',
    rotate: '-11deg', anim: 'float1', dur: '9s', delay: '-6s',
    pos: { top: '20%', left: '19%' } },
  { title: 'Cruel Summer', artist: 'Taylor Swift',
    gradient: 'linear-gradient(160deg,#172554 0%,#2563eb 50%,#06b6d4 100%)',
    rotate: '9deg', anim: 'float2', dur: '10s', delay: '-3s',
    pos: { top: '18%', right: '19%' } },
  { title: 'Espresso', artist: 'Sabrina Carpenter',
    gradient: 'linear-gradient(160deg,#431407 0%,#ea580c 60%,#fbbf24 100%)',
    rotate: '-5deg', anim: 'float3', dur: '8.5s', delay: '-7.5s',
    pos: { bottom: '22%', left: '19%' } },
  { title: 'vampire', artist: 'Olivia Rodrigo',
    gradient: 'linear-gradient(160deg,#27141d 0%,#9f1239 55%,#f43f5e 100%)',
    rotate: '7deg', anim: 'float1', dur: '9.5s', delay: '-4s',
    pos: { bottom: '20%', right: '19%' } },
]

// Minimal horizontal cards — dark panel, coloured side thumbnail
type DemoMinCard = {
  title: string; artist: string; color: string
  rotate: string; anim: string; dur: string; delay: string
  pos: { top?: string; left?: string; right?: string; bottom?: string }
}

const DEMO_MIN_CARDS: DemoMinCard[] = [
  { title: 'INDUSTRY BABY', artist: 'Lil Nas X',
    color: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)',
    rotate: '-4deg', anim: 'float2', dur: '8s', delay: '-5.5s',
    pos: { top: '70%', left: '3.5%' } },
  { title: 'About Damn Time', artist: 'Lizzo',
    color: 'linear-gradient(135deg,#3d1a00 0%,#b91c1c 100%)',
    rotate: '3deg', anim: 'float3', dur: '7.5s', delay: '-2.5s',
    pos: { top: '68%', right: '3.5%' } },
]

const MusicNote = () => (
  <svg viewBox="0 0 24 24" width="36" height="36" fill="rgba(255,255,255,0.28)">
    <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zM21 16c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/>
  </svg>
)

function DemoBgCard({ title, artist, gradient, rotate, anim, dur, delay, pos }: DemoCard) {
  return (
    <div
      className="demo-bg-card"
      style={{
        position: 'absolute', width: 178,
        background: 'linear-gradient(135deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.06) 48%,rgba(255,255,255,0.12) 100%)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.24)',
        borderRadius: 22, padding: 12,
        boxShadow: '0 1px 0 rgba(255,255,255,0.50) inset,0 22px 48px -12px rgba(0,0,0,0.42),0 8px 18px -6px rgba(0,0,0,0.25)',
        pointerEvents: 'none', color: 'white', zIndex: 2,
        ['--card-transform' as string]: `rotate(${rotate})`,
        animation: `${anim} ${dur} ease-in-out ${delay} infinite`,
        ...pos,
      }}
    >
      <div style={{
        position: 'absolute', inset: 1, borderRadius: 21, pointerEvents: 'none',
        background: 'radial-gradient(110% 50% at 20% 0%,rgba(255,255,255,0.30) 0%,rgba(255,255,255,0) 50%)',
        mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode'],
      }} />
      <div style={{
        width: '100%', aspectRatio: '1/1', borderRadius: 13,
        background: gradient, marginBottom: 11,
        boxShadow: '0 12px 32px -6px rgba(0,0,0,0.52)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <MusicNote />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{title}</div>
      <div style={{ fontSize: 11, opacity: 0.65, marginTop: 3 }}>{artist}</div>
    </div>
  )
}

function DemoPosterCardView({ title, artist, gradient, rotate, anim, dur, delay, pos }: DemoPosterCard) {
  return (
    <div
      className="demo-bg-card"
      style={{
        position: 'absolute', width: 148, height: 198,
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 24px 52px -10px rgba(0,0,0,0.55),0 8px 18px -6px rgba(0,0,0,0.30)',
        pointerEvents: 'none', zIndex: 2,
        ['--card-transform' as string]: `rotate(${rotate})`,
        animation: `${anim} ${dur} ease-in-out ${delay} infinite`,
        ...pos,
      }}
    >
      {/* Full-bleed art */}
      <div style={{ position: 'absolute', inset: 0, background: gradient }} />
      {/* Music note */}
      <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)' }}>
        <svg viewBox="0 0 24 24" width="30" height="30" fill="rgba(255,255,255,0.22)">
          <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zM21 16c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/>
        </svg>
      </div>
      {/* Bottom gradient + text */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
        padding: '28px 12px 12px',
        color: 'white',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{artist}</div>
      </div>
      {/* Specular */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(100% 45% at 30% 0%,rgba(255,255,255,0.22) 0%,transparent 55%)',
      }} />
    </div>
  )
}

function DemoMinCardView({ title, artist, color, rotate, anim, dur, delay, pos }: DemoMinCard) {
  return (
    <div
      className="demo-bg-card"
      style={{
        position: 'absolute', width: 196, height: 68,
        borderRadius: 14, overflow: 'hidden',
        background: 'rgba(14,14,18,0.82)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.10)',
        boxShadow: '0 14px 32px -8px rgba(0,0,0,0.50)',
        display: 'flex', alignItems: 'stretch',
        pointerEvents: 'none', zIndex: 2, color: 'white',
        ['--card-transform' as string]: `rotate(${rotate})`,
        animation: `${anim} ${dur} ease-in-out ${delay} infinite`,
        ...pos,
      }}
    >
      {/* Colour strip */}
      <div style={{ width: 68, flexShrink: 0, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="rgba(255,255,255,0.30)">
          <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zM21 16c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z"/>
        </svg>
      </div>
      {/* Text */}
      <div style={{ flex: 1, padding: '0 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontSize: 10, opacity: 0.5, marginTop: 2 }}>{artist}</div>
      </div>
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

  // cardRef → hidden off-screen export card (what dom-to-image captures)
  const cardRef = useRef<HTMLDivElement>(null!)

  const updateConfig = useCallback((updates: Partial<CardConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }, [])

  // Extract accent colour from album art with colorthief
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const heroUrlBar = (
    <div style={{ position: 'relative', width: '100%' }}>
      <div className="input" style={{
        height: 62, paddingLeft: 20, paddingRight: 8, fontSize: 16,
        borderRadius: 16, border: '1px solid var(--line)',
        boxShadow: '0 4px 24px oklch(from var(--accent) l c h / 0.08)',
      }}>
        <span style={{ color: 'var(--fg-3)', flexShrink: 0 }}><LinkIcon /></span>
        <input
          value={url}
          onChange={e => handleUrlInput(e.target.value)}
          onPaste={handlePaste}
          placeholder="Paste a Spotify track link…"
          spellCheck={false}
          autoFocus
          style={{ fontSize: 16 }}
        />
        <button
          className="btn btn-glow"
          data-variant="primary"
          data-size="sm"
          onClick={() => url && fetchTrack(url)}
          style={{ flexShrink: 0, borderRadius: 10, height: 44 }}
        >
          Generate →
        </button>
      </div>
    </div>
  )

  // ── EMPTY STATE ──────────────────────────────────────────────
  if (!track && !loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--hero-bg)', position: 'relative', overflow: 'hidden' }}>
        {accentColor && <style>{`:root { --accent: ${accentColor}; }`}</style>}
        <style>{`
          .demo-bg-card { display: block; }
          @media (max-width: 700px) { .demo-bg-card { display: none; } }
        `}</style>

        {/* Dot-grid background */}
        <div className="hero-grid" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

        {/* Ambient color blobs — give glass cards something to blur */}
        <div style={{ position: 'absolute', top: '5%', left: '-8%', width: 460, height: 460,
          borderRadius: '50%', background: 'radial-gradient(circle,oklch(0.55 0.22 300 / 0.20) 0%,transparent 65%)',
          filter: 'blur(90px)', zIndex: 1, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '-8%', right: '-6%', width: 400, height: 400,
          borderRadius: '50%', background: 'radial-gradient(circle,oklch(0.60 0.22 340 / 0.18) 0%,transparent 65%)',
          filter: 'blur(80px)', zIndex: 1, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '4%', left: '-6%', width: 380, height: 380,
          borderRadius: '50%', background: 'radial-gradient(circle,oklch(0.65 0.18 195 / 0.18) 0%,transparent 65%)',
          filter: 'blur(80px)', zIndex: 1, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '2%', right: '-8%', width: 420, height: 420,
          borderRadius: '50%', background: 'radial-gradient(circle,oklch(0.72 0.18 75 / 0.16) 0%,transparent 65%)',
          filter: 'blur(85px)', zIndex: 1, pointerEvents: 'none' }} />
        {/* Center accent glow behind hero content */}
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: 640, height: 300,
          borderRadius: '50%', background: 'radial-gradient(ellipse,oklch(from var(--accent) l c h / 0.10) 0%,transparent 70%)',
          filter: 'blur(60px)', zIndex: 1, pointerEvents: 'none' }} />

        {/* Floating demo music cards */}
        {DEMO_CARDS.map((card, i) => <DemoBgCard key={i} {...card} />)}
        {DEMO_POSTER_CARDS.map((card, i) => <DemoPosterCardView key={i} {...card} />)}
        {DEMO_MIN_CARDS.map((card, i) => <DemoMinCardView key={i} {...card} />)}

        {/* Frosted nav */}
        <nav style={{
          position: 'relative', zIndex: 10,
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', borderBottom: '1px solid var(--line-soft)',
          background: 'oklch(from var(--hero-bg) l c h / 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          flexShrink: 0,
        }}>
          <div className="slide-down"><Logo /></div>
          <a href="https://github.com/clintdoesdev/FrameSound" target="_blank" rel="noopener noreferrer"
            className="slide-down"
            style={{ color: 'var(--fg-2)', display: 'flex', alignItems: 'center', animationDelay: '0.05s' }}>
            <GithubIcon />
          </a>
        </nav>

        {/* Hero center content */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '48px 24px 64px',
          position: 'relative', zIndex: 10,
        }}>
          {/* Logo mark */}
          <div className="scale-in" style={{ marginBottom: 20 }}>
            <Logo />
          </div>

          {/* Headline */}
          <h1 className="fade-up" style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: 'clamp(38px, 6.5vw, 68px)', letterSpacing: '-0.038em',
            lineHeight: 1.06, color: 'var(--fg)', textAlign: 'center',
            margin: '0 0 14px', animationDelay: '0.10s',
          }}>
            Turn Spotify<br />into art.
          </h1>
          <p className="fade-up" style={{
            fontSize: 16, color: 'var(--fg-2)', textAlign: 'center',
            maxWidth: 380, marginBottom: 40, lineHeight: 1.65,
            animationDelay: '0.18s',
          }}>
            Paste a track link to generate a beautiful shareable card in seconds.
          </p>

          {/* Hero URL input with glowing CTA */}
          <div className="fade-up" style={{ width: '100%', maxWidth: 560, animationDelay: '0.26s' }}>
            {heroUrlBar}
            {error && (
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--danger)', textAlign: 'center' }}>{error}</div>
            )}
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--fg-3)', textAlign: 'center' }}>
              spotify.com/track/… links only
            </div>
          </div>

          {/* Recent tracks */}
          <div className="fade-in" style={{ animationDelay: '0.38s' }}>
            <RecentTracks onSelect={loadFromRecent} />
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          position: 'relative', zIndex: 10,
          padding: '18px 24px 22px',
          borderTop: '1px solid var(--line-soft)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 12, color: 'var(--fg-3)', letterSpacing: '0.04em' }}>
            created by <span style={{ color: 'var(--fg-1)', fontWeight: 700, letterSpacing: '0.06em' }}>CLINTDOESDEV.</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>
            want to work with him?{' '}
            <a
              href="https://clintdoesdev.site"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
            >
              check out his portfolio ↗
            </a>
          </div>
        </footer>
      </div>
    )
  }

  // ── LOADING STATE ────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
        {/* Nav */}
        <nav style={{
          height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 24px', borderBottom: '1px solid var(--line-soft)',
          background: 'var(--bg)', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="animate-pulse-slow" style={{ width: 72, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)' }} />
            <Logo />
          </div>
        </nav>

        {/* Editor two-column skeleton */}
        <div style={{ display: 'flex', flex: 1, maxWidth: 1280, margin: '0 auto', width: '100%' }} className="editor-layout">
          {/* Left column */}
          <div style={{ flex: 1, padding: '32px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}
            className="left-col">
            {/* URL bar shimmer */}
            <div className="animate-pulse-slow" style={{
              height: 52, borderRadius: 14,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.07)',
            }} />
            {/* Card glass placeholder */}
            <div style={{
              borderRadius: 22, padding: 20,
              background: 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.09)',
            }}>
              <div className="animate-pulse-slow" style={{
                width: '100%', aspectRatio: '1 / 1', borderRadius: 16,
                background: 'rgba(255,255,255,0.07)',
              }} />
            </div>
            {/* Audio bar shimmer */}
            <div className="animate-pulse-slow" style={{
              height: 52, borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }} />
          </div>

          {/* Right column */}
          <div style={{
            width: 340, flexShrink: 0,
            borderLeft: '1px solid var(--line)',
            display: 'flex', flexDirection: 'column',
          }} className="right-col">
            {/* Track meta shimmer */}
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <div className="animate-pulse-slow" style={{
                width: 36, height: 36, borderRadius: 6,
                background: 'rgba(255,255,255,0.09)', flexShrink: 0,
              }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div className="animate-pulse-slow" style={{ height: 11, width: '68%', borderRadius: 6, background: 'rgba(255,255,255,0.09)' }} />
                <div className="animate-pulse-slow" style={{ height: 9, width: '44%', borderRadius: 6, background: 'rgba(255,255,255,0.05)', animationDelay: '0.1s' }} />
              </div>
            </div>
            {/* Settings section glass blocks */}
            {([110, 155, 195, 135] as number[]).map((h, i) => (
              <div key={i} className="animate-pulse-slow" style={{
                margin: '8px 10px',
                height: h,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.07)',
                animationDelay: `${i * 0.12}s`,
              }} />
            ))}
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .editor-layout { flex-direction: column !important; }
            .left-col { width: 100% !important; }
            .right-col { width: 100% !important; border-left: none !important; border-top: 1px solid var(--line) !important; }
          }
        `}</style>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => { setTrack(null); setUrl(''); setError(null); setLyrics(null) }}
            className="btn"
            data-variant="ghost"
            style={{ gap: 6, padding: '0 10px', height: 32, fontSize: 12, borderRadius: 8 }}
          >
            <BackIcon /> Back
          </button>
          <Logo />
        </div>
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
        animation: 'fadeIn 0.35s ease both',
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

          {/* Hidden export card — explicit w/h so dom-to-image resolves dimensions without CSS aspectRatio */}
          {track && (() => {
            const { width: exportW, height: exportH } = sizeMap[config.size]
            return (
              <div aria-hidden style={{ position: 'fixed', left: -10000, top: -10000, pointerEvents: 'none', width: exportW, height: exportH }}>
                <CardCanvas ref={cardRef} track={track} config={config} exportMode />
              </div>
            )
          })()}

          {/* Card preview — fills container, aspect ratio maintained by the card itself */}
          <div style={{
            background: 'var(--bg-1)', borderRadius: 12,
            border: '1px solid var(--line)',
            padding: 20, overflow: 'hidden',
          }}>
            {track && <CardCanvas track={track} config={config} />}
          </div>

          {/* Audio preview */}
          {track?.previewUrl && <AudioPreview previewUrl={track.previewUrl} trackId={track.id} />}

          {/* Recent tracks */}
          <RecentTracks onSelect={loadFromRecent} />
        </div>

        {/* ── RIGHT: Lyrics + Customize + Export ──────────── */}
        <div style={{
          width: 340, flexShrink: 0,
          borderLeft: '1px solid var(--line)',
          display: 'flex', flexDirection: 'column',
          height: 'calc(100vh - 56px)',
          position: 'sticky', top: 56,
          overflow: 'hidden',
        }} className="right-col">
          {/* Track meta strip */}
          {track && (
            <div style={{
              padding: '12px 20px', borderBottom: '1px solid var(--line-soft)',
              display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0, position: 'relative', background: 'var(--bg-2)' }}>
                {track.coverUrl && (
                  <Image src={track.coverUrl} alt={track.title} fill style={{ objectFit: 'cover' }} unoptimized />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-syne)', fontSize: 13, fontWeight: 600, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.title}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)', marginTop: 2 }}>{track.artist}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 1 }}>
                  {track.releaseYear} · {track.duration}
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
            <CustomizePanel config={config} onChange={updateConfig} accentColor={accentColor} />
          </div>

          {/* Export bar — sticky at bottom */}
          {track && (
            <ExportBar cardRef={cardRef} track={track} config={config} onConfigChange={updateConfig} accentColor={accentColor} />
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
          .right-col {
            width: 100% !important;
            height: auto !important;
            position: static !important;
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  )
}
