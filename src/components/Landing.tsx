'use client'

import React, { useEffect, useRef } from 'react'

type Pos = { top?: string; left?: string; right?: string; bottom?: string }
type Float = { rotate: string; anim: 'float1' | 'float2' | 'float3'; dur: string; delay: string; depth: number; pos: Pos }

// Glass-panel floating cards (4 corners + 2 centre sides)
const GLASS_CARDS: (Float & { title: string; artist: string; gradient: string })[] = [
  { title: 'Blinding Lights', artist: 'The Weeknd', gradient: 'linear-gradient(145deg,#3d0066 0%,#c0003e 100%)',
    rotate: '-13deg', anim: 'float1', dur: '7s', delay: '0s', depth: 18, pos: { top: '13%', left: '3%' } },
  { title: 'As It Was', artist: 'Harry Styles', gradient: 'linear-gradient(145deg,#8b003f 0%,#f472b6 100%)',
    rotate: '10deg', anim: 'float2', dur: '8.5s', delay: '-3s', depth: 22, pos: { top: '10%', right: '3%' } },
  { title: 'Heat Waves', artist: 'Glass Animals', gradient: 'linear-gradient(145deg,#004a59 0%,#00bcd4 100%)',
    rotate: '7deg', anim: 'float3', dur: '9s', delay: '-5s', depth: 16, pos: { bottom: '15%', left: '2.5%' } },
  { title: 'Levitating', artist: 'Dua Lipa', gradient: 'linear-gradient(145deg,#b34400 0%,#fbbf24 100%)',
    rotate: '-8deg', anim: 'float1', dur: '6.5s', delay: '-2s', depth: 20, pos: { bottom: '12%', right: '2.5%' } },
  { title: 'MONTERO', artist: 'Lil Nas X', gradient: 'linear-gradient(145deg,#1a0040 0%,#7c3aed 100%)',
    rotate: '6deg', anim: 'float2', dur: '7.5s', delay: '-4.5s', depth: 12, pos: { top: '47%', left: '1%' } },
  { title: 'bad guy', artist: 'Billie Eilish', gradient: 'linear-gradient(145deg,#012817 0%,#16a34a 100%)',
    rotate: '-7deg', anim: 'float3', dur: '8s', delay: '-1.5s', depth: 14, pos: { top: '45%', right: '1%' } },
]

// Poster-style cards — full-bleed gradient art, text at the bottom
const POSTER_CARDS: (Float & { title: string; artist: string; gradient: string })[] = [
  { title: 'Kill Bill', artist: 'SZA', gradient: 'linear-gradient(160deg,#1e0f33 0%,#9333ea 55%,#db2777 100%)',
    rotate: '-11deg', anim: 'float1', dur: '9s', delay: '-6s', depth: 30, pos: { top: '20%', left: '19%' } },
  { title: 'Cruel Summer', artist: 'Taylor Swift', gradient: 'linear-gradient(160deg,#172554 0%,#2563eb 50%,#06b6d4 100%)',
    rotate: '9deg', anim: 'float2', dur: '10s', delay: '-3s', depth: 34, pos: { top: '18%', right: '19%' } },
  { title: 'Espresso', artist: 'Sabrina Carpenter', gradient: 'linear-gradient(160deg,#431407 0%,#ea580c 60%,#fbbf24 100%)',
    rotate: '-5deg', anim: 'float3', dur: '8.5s', delay: '-7.5s', depth: 28, pos: { bottom: '22%', left: '19%' } },
  { title: 'vampire', artist: 'Olivia Rodrigo', gradient: 'linear-gradient(160deg,#27141d 0%,#9f1239 55%,#f43f5e 100%)',
    rotate: '7deg', anim: 'float1', dur: '9.5s', delay: '-4s', depth: 32, pos: { bottom: '20%', right: '19%' } },
]

// Minimal horizontal "now playing" strips
const STRIP_CARDS: (Float & { title: string; artist: string; color: string })[] = [
  { title: 'INDUSTRY BABY', artist: 'Lil Nas X', color: 'linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)',
    rotate: '-4deg', anim: 'float2', dur: '8s', delay: '-5.5s', depth: 24, pos: { top: '70%', left: '3.5%' } },
  { title: 'About Damn Time', artist: 'Lizzo', color: 'linear-gradient(135deg,#3d1a00 0%,#b91c1c 100%)',
    rotate: '3deg', anim: 'float3', dur: '7.5s', delay: '-2.5s', depth: 26, pos: { top: '68%', right: '3.5%' } },
]

const Note = ({ size, alpha }: { size: number; alpha: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={`rgba(255,255,255,${alpha})`} aria-hidden>
    <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zM21 16c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
  </svg>
)

function FloatWrap({ f, children }: { f: Float; children: React.ReactNode }) {
  return (
    <div className="float" aria-hidden style={{ ...f.pos, ['--depth' as string]: f.depth }}>
      <div className="float-inner" style={{
        ['--card-transform' as string]: `rotate(${f.rotate})`,
        ['--anim' as string]: f.anim, ['--dur' as string]: f.dur, ['--delay' as string]: f.delay,
      }}>
        {children}
      </div>
    </div>
  )
}

export function Logo({ size = 28, label = true }: { size?: number; label?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <span aria-hidden style={{
        width: size, height: size, borderRadius: size * 0.26, flex: 'none',
        background: 'linear-gradient(135deg, var(--accent) 0%, color-mix(in oklab, var(--accent) 70%, black) 100%)',
        display: 'grid', placeItems: 'center',
        boxShadow: '0 0 0 1px color-mix(in oklab, var(--accent) 35%, transparent), inset 0 1px 0 rgba(255,255,255,0.35)',
      }}>
        <span style={{ width: size * 0.42, height: size * 0.42, borderRadius: size * 0.08, background: 'rgba(0,0,0,0.85)' }} />
      </span>
      {label && (
        <span className="display" style={{ fontWeight: 700, fontSize: size * 0.6, color: 'var(--text)', letterSpacing: '-0.02em' }}>FrameSound</span>
      )}
    </span>
  )
}

type Props = {
  /** The hero search field (owned by the page). */
  search: React.ReactNode
  error?: React.ReactNode
  recent: React.ReactNode
  onBatch: () => void
  children?: React.ReactNode
}

export default function Landing({ search, error, recent, onBatch, children }: Props) {
  const root = useRef<HTMLDivElement>(null)

  // Pointer parallax: cards drift a few px against the cursor, deeper ones more.
  // Written straight to CSS variables so moving the mouse never re-renders React.
  useEffect(() => {
    const el = root.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--mx', ((e.clientX / innerWidth) * 2 - 1).toFixed(3))
        el.style.setProperty('--my', ((e.clientY / innerHeight) * 2 - 1).toFixed(3))
      })
    }
    addEventListener('pointermove', onMove)
    return () => { cancelAnimationFrame(raf); removeEventListener('pointermove', onMove) }
  }, [])

  return (
    <div ref={root} className="app landing">
      <div className="hero-grid" />

      {/* Ambient colour — gives the glass cards something to blur */}
      <div className="blob" style={{ top: '5%', left: '-8%', width: 460, height: 460, background: 'radial-gradient(circle, oklch(0.55 0.22 300 / 0.26) 0%, transparent 65%)' }} />
      <div className="blob" style={{ top: '-8%', right: '-6%', width: 420, height: 420, background: 'radial-gradient(circle, oklch(0.62 0.22 350 / 0.24) 0%, transparent 65%)', animationDelay: '-6s', animationDuration: '26s' }} />
      <div className="blob" style={{ bottom: '2%', left: '-6%', width: 400, height: 400, background: 'radial-gradient(circle, oklch(0.68 0.16 195 / 0.24) 0%, transparent 65%)', animationDelay: '-11s', animationDuration: '24s' }} />
      <div className="blob" style={{ bottom: '0%', right: '-8%', width: 440, height: 440, background: 'radial-gradient(circle, oklch(0.74 0.17 75 / 0.2) 0%, transparent 65%)', animationDelay: '-3s', animationDuration: '28s' }} />
      <div className="blob" style={{ top: '28%', left: '50%', marginLeft: -340, width: 680, height: 320, background: 'radial-gradient(ellipse, color-mix(in oklab, var(--accent) 16%, transparent) 0%, transparent 70%)', filter: 'blur(60px)', animationDuration: '18s' }} />

      {GLASS_CARDS.map(c => (
        <FloatWrap key={c.title} f={c}>
          <div className="demo-glass">
            <div style={{
              width: '100%', aspectRatio: '1 / 1', borderRadius: 9, background: c.gradient, marginBottom: 8,
              boxShadow: '0 8px 22px -5px rgba(0,0,0,0.52)', display: 'grid', placeItems: 'center',
            }}>
              <Note size={24} alpha={0.28} />
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 }}>{c.title}</div>
            <div style={{ fontSize: 9, opacity: 0.65, marginTop: 2 }}>{c.artist}</div>
            <div className="demo-progress"><i style={{ ['--p-dur' as string]: `${parseFloat(c.dur) + 4}s`, animationDelay: c.delay }} /></div>
          </div>
        </FloatWrap>
      ))}

      {POSTER_CARDS.map(c => (
        <FloatWrap key={c.title} f={c}>
          <div className="demo-poster">
            <div style={{ position: 'absolute', inset: 0, background: c.gradient }} />
            <div style={{ position: 'absolute', top: '38%', left: '50%', transform: 'translate(-50%,-50%)' }}>
              <Note size={20} alpha={0.22} />
            </div>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 9px 9px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em' }}>{c.title}</div>
              <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>{c.artist}</div>
            </div>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(100% 45% at 30% 0%, rgba(255,255,255,0.22) 0%, transparent 55%)' }} />
          </div>
        </FloatWrap>
      ))}

      {STRIP_CARDS.map(c => (
        <FloatWrap key={c.title} f={c}>
          <div className="demo-strip">
            <div style={{ width: 52, flexShrink: 0, background: c.color, display: 'grid', placeItems: 'center' }}>
              <Note size={15} alpha={0.3} />
            </div>
            <div style={{ flex: 1, minWidth: 0, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
                <div style={{ fontSize: 9, opacity: 0.5, marginTop: 2 }}>{c.artist}</div>
              </div>
              <div className="eq" style={{ height: 12 }}><i /><i /><i /><i /></div>
            </div>
          </div>
        </FloatWrap>
      ))}

      <nav className="landing-nav slide-down" aria-label="Main">
        <Logo />
        <button type="button" className="btn" data-variant="ghost" onClick={onBatch}
          title="Export a playlist or album as a zip">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3.5" y="8" width="17" height="12.5" rx="3" /><path d="M6.5 5h11M9 2.5h6" />
          </svg>
          <span className="hide-sm">Batch export</span>
        </button>
      </nav>

      <main className="hero">
        <div className="scale-in" style={{ marginBottom: 22 }}>
          <Logo size={34} label={false} />
        </div>

        <h1 className="display fade-up" style={{
          fontWeight: 700, fontSize: 'clamp(40px, 6.8vw, 72px)',
          lineHeight: 1.04, textAlign: 'center', margin: '0 0 16px', animationDelay: '0.08s',
        }}>
          Turn Spotify<br />
          <span style={{
            background: 'linear-gradient(100deg, var(--text) 10%, var(--accent-text) 55%, #f472b6 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          }}>into art.</span>
        </h1>
        <p className="fade-up" style={{
          fontSize: 16, color: 'var(--text-2)', textAlign: 'center',
          maxWidth: 400, margin: '0 0 38px', lineHeight: 1.65, animationDelay: '0.16s',
        }}>
          Paste a track link to generate a beautiful shareable card in seconds.
        </p>

        <div className="fade-up" style={{ width: '100%', maxWidth: 560, animationDelay: '0.24s' }}>
          {search}
          {error}
          <div className="mono" style={{
            marginTop: 14, fontSize: 11, color: 'var(--text-3)', textAlign: 'center',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            7 presets · lyric quotes · HD export
          </div>
        </div>

        <div className="fade-in" style={{ marginTop: 28, maxWidth: '100%', animationDelay: '0.36s' }}>
          {recent}
        </div>
      </main>

      <footer className="landing-foot">
        <div>created by <span style={{ color: 'var(--text)', fontWeight: 700, letterSpacing: '0.06em' }}>CLINTDOESDEV.</span></div>
        <div>
          want to work with him?{' '}
          <a href="https://clintdoesdev.site" target="_blank" rel="noopener noreferrer">check out his portfolio ↗</a>
        </div>
      </footer>
      {children}
    </div>
  )
}
