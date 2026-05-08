'use client'

import React, { useState, useRef } from 'react'
import CardCanvasImpl from '@/components/CardCanvas'
import { TrackData, CardConfig, defaultConfig } from '@/types'

type Props = { onOpenEditor: () => void }

/* ─── Demo data for preview cards ─────────────────────────── */
const DEMO: TrackData = {
  id: 'demo', title: 'Long Static', artist: 'Field Axis',
  album: 'Range / Vapor', coverUrl: null, releaseYear: '2024',
  duration: 218000, previewUrl: null, trackNumber: 1,
}

function DemoCard({ preset, tintHue, size }: { preset: CardConfig['preset']; tintHue: number; size: CardConfig['size'] }) {
  const ref = useRef<HTMLDivElement>(null!)
  return (
    <CardCanvasImpl
      track={DEMO}
      config={{ ...defaultConfig, preset, tintHue, size, padding: 24, borderRadius: 16 }}
      selectedLines={['the room exhales / a slower year arrives']}
      cardRef={ref}
    />
  )
}

/* ─── Icons ────────────────────────────────────────────────── */
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 6 6 6-6 6"/>
  </svg>
)
const ArrowRight = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
  </svg>
)
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/>
  </svg>
)
const MenuIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 6h18M3 12h18M3 18h18"/>
  </svg>
)
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
)

/* ─── Logo ─────────────────────────────────────────────────── */
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <div style={{
        width: size, height: size, borderRadius: Math.round(size * 0.28),
        background: 'linear-gradient(135deg, var(--accent) 0%, #2ba87a 100%)',
        display: 'grid', placeItems: 'center',
        boxShadow: '0 0 0 1px rgba(62,207,142,0.3)',
        flexShrink: 0,
      }}>
        <div style={{
          width: size * 0.45, height: size * 0.45, borderRadius: 2,
          background: 'rgba(0,0,0,0.85)',
        }} />
      </div>
      <span style={{ fontWeight: 700, letterSpacing: '-0.02em', fontSize: size * 0.82, color: 'var(--fg)' }}>
        FrameSound
      </span>
    </div>
  )
}

/* ─── Nav ──────────────────────────────────────────────────── */
function Navbar({ onOpenEditor }: { onOpenEditor: () => void }) {
  const [open, setOpen] = useState(false)
  const links = ['Presets', 'How it works', 'GitHub']

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(10,10,10,0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--line)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', height: 60,
      }}>
        <Logo size={20} />

        {/* Desktop nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hidden md:flex">
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} style={{
              padding: '6px 12px', fontSize: 14, fontWeight: 500,
              color: 'var(--fg-2)', textDecoration: 'none', borderRadius: 8,
              transition: 'color 120ms',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--fg)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--fg-2)' }}
            >{l}</a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Desktop CTA */}
          <button
            className="btn hidden md:inline-flex"
            data-variant="primary"
            data-size="sm"
            onClick={onOpenEditor}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Open editor <ArrowRight />
          </button>

          {/* Mobile hamburger */}
          <button
            className="md:hidden"
            onClick={() => setOpen(!open)}
            style={{
              background: 'transparent', border: 0, cursor: 'pointer',
              color: 'var(--fg-1)', padding: 4, display: 'flex',
            }}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{
          background: 'var(--bg-1)', borderTop: '1px solid var(--line)',
          padding: '12px 20px 20px',
        }}>
          {links.map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              onClick={() => setOpen(false)}
              style={{
                display: 'block', padding: '12px 0',
                fontSize: 15, fontWeight: 500, color: 'var(--fg-1)',
                textDecoration: 'none',
                borderBottom: '1px solid var(--line-soft)',
              }}
            >{l}</a>
          ))}
          <button
            className="btn"
            data-variant="primary"
            data-size="lg"
            onClick={() => { setOpen(false); onOpenEditor() }}
            style={{ display: 'flex', width: '100%', justifyContent: 'center', marginTop: 16, gap: 8 }}
          >
            Open editor <ArrowRight />
          </button>
        </div>
      )}
    </nav>
  )
}

/* ─── Hero ─────────────────────────────────────────────────── */
function Hero({ onOpenEditor }: { onOpenEditor: () => void }) {
  return (
    <section style={{ padding: '72px 20px 80px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Badge pill */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <a href="#how-it-works" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '7px 16px',
          background: 'var(--bg-2)',
          border: '1px solid var(--line-1)',
          borderRadius: 999,
          fontSize: 13, fontWeight: 500,
          color: 'var(--fg-1)',
          textDecoration: 'none',
          transition: 'border-color 150ms',
        }}>
          <span style={{ color: 'var(--accent)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>NEW</span>
          Lyric quotes + 5 card presets
          <ChevronRight />
        </a>
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: 'clamp(38px, 8vw, 68px)',
        fontWeight: 800,
        lineHeight: 1.08,
        letterSpacing: '-0.03em',
        margin: '0 0 24px',
        textAlign: 'center',
        color: 'var(--fg)',
      }}>
        Turn any Spotify track<br />
        into a{' '}
        <span style={{ color: 'var(--accent)' }}>shareable card.</span>
      </h1>

      {/* Subtext */}
      <p style={{
        fontSize: 'clamp(15px, 2.5vw, 18px)',
        color: 'var(--fg-2)',
        lineHeight: 1.65,
        textAlign: 'center',
        margin: '0 auto 40px',
        maxWidth: 540,
        fontWeight: 400,
      }}>
        Paste a Spotify link. Get beautiful export-ready artwork with lyrics, album art,
        and typography — in seconds. No login. No watermark.
      </p>

      {/* CTAs */}
      <div style={{
        display: 'flex', gap: 12, justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        <button
          className="btn"
          data-variant="primary"
          data-size="xl"
          onClick={onOpenEditor}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minWidth: 200 }}
        >
          Open editor <ArrowRight />
        </button>
        <a
          href="https://github.com/clintdoesdev/FrameSound"
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          data-size="xl"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <GithubIcon /> View on GitHub
        </a>
      </div>

      {/* Trust badges */}
      <div style={{
        display: 'flex', gap: 20, justifyContent: 'center', marginTop: 32,
        flexWrap: 'wrap',
      }}>
        {['No login required', 'Server-side keys', 'PNG @ 3× export', 'Free & open source'].map(b => (
          <span key={b} style={{
            fontSize: 13, color: 'var(--fg-3)', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              background: 'var(--accent)', display: 'inline-block',
            }} />
            {b}
          </span>
        ))}
      </div>

      {/* Card preview row */}
      <div id="presets" style={{
        marginTop: 64,
        display: 'flex', justifyContent: 'center',
        gap: 16, overflowX: 'auto',
        paddingBottom: 8,
      }}>
        <div style={{
          display: 'flex', gap: 16, alignItems: 'flex-end',
          perspective: 1200,
          flexShrink: 0,
        }}>
          {[
            { preset: 'minimal' as const, hue: 220, size: '16:9' as const, scale: 0.42, rot: -8 },
            { preset: 'glass'   as const, hue: 162, size: '1:1'  as const, scale: 0.52, rot: -3 },
            { preset: 'poster'  as const, hue: 30,  size: '4:5'  as const, scale: 0.60, rot:  0 },
            { preset: 'story'   as const, hue: 290, size: '9:16' as const, scale: 0.50, rot:  3 },
            { preset: 'square'  as const, hue: 75,  size: '1:1'  as const, scale: 0.42, rot:  8 },
          ].map((c, i) => (
            <div key={i} style={{
              transform: `rotateY(${c.rot}deg) scale(${c.scale})`,
              transformOrigin: 'bottom center',
              filter: i !== 2 ? 'brightness(0.75)' : 'none',
              transition: 'filter 200ms',
              flexShrink: 0,
            }}>
              <DemoCard preset={c.preset} tintHue={c.hue} size={c.size} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── Trust strip ──────────────────────────────────────────── */
function TrustStrip() {
  return (
    <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '20px 20px', background: 'var(--bg-1)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'var(--fg-3)', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
          Used by music creators worldwide
        </p>
        <div style={{
          display: 'flex', gap: 32, justifyContent: 'center',
          flexWrap: 'wrap', alignItems: 'center',
          color: 'var(--fg-4)', fontSize: 15, fontWeight: 600,
        }}>
          {['RANGE FM', 'Field Axis', 'Hollowmark', 'Slow Channel', 'Pelham Rec.'].map(n => (
            <span key={n} style={{ letterSpacing: n === n.toUpperCase() ? '0.1em' : '-0.01em', whiteSpace: 'nowrap' }}>{n}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── How it works ─────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Paste a Spotify link',
      body: 'Any track URL from open.spotify.com. FrameSound fetches the metadata via a secure Server Action — your keys never leave the server.',
    },
    {
      num: '02',
      title: 'Pick a preset & style',
      body: 'Choose from Glass, Poster, Minimal, Story, or Square. Adjust font, size, padding, and toggle which elements to show.',
    },
    {
      num: '03',
      title: 'Add a lyric quote',
      body: 'We fetch lyrics automatically via lyrics.ovh. Select up to 2 lines — or type your own custom quote.',
    },
    {
      num: '04',
      title: 'Export at 3× resolution',
      body: 'Download as PNG @ 3×, JPG @ 2×, transparent PNG, or copy directly to clipboard using dom-to-image.',
    },
  ]

  return (
    <section id="how-it-works" style={{ padding: '80px 20px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 52 }}>
        <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>
          How it works
        </p>
        <h2 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 auto', maxWidth: 520, lineHeight: 1.15 }}>
          From link to card in four steps.
        </h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 16,
      }}>
        {steps.map((s) => (
          <div key={s.num} style={{
            background: 'var(--bg-1)',
            border: '1px solid var(--line)',
            borderRadius: 14,
            padding: '24px 22px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
              color: 'var(--accent)', letterSpacing: '0.08em',
            }}>{s.num}</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--fg)', letterSpacing: '-0.01em' }}>{s.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--fg-2)', margin: 0, lineHeight: 1.6 }}>{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ─── Presets section ──────────────────────────────────────── */
function PresetsSection({ onOpenEditor }: { onOpenEditor: () => void }) {
  const [active, setActive] = useState<CardConfig['preset']>('glass')

  const presets: { id: CardConfig['preset']; label: string; desc: string; hue: number; size: CardConfig['size'] }[] = [
    { id: 'glass',   label: 'Glass',   desc: 'Blurred art background with frosted glass info panel.',   hue: 162, size: '1:1'  },
    { id: 'poster',  label: 'Poster',  desc: 'Full-bleed art with gradient fade and bold bottom text.', hue: 30,  size: '4:5'  },
    { id: 'minimal', label: 'Minimal', desc: 'Clean editorial side-by-side — art left, text right.',    hue: 220, size: '16:9' },
    { id: 'story',   label: 'Story',   desc: 'Tall 9:16 format for Instagram / Snapchat stories.',      hue: 290, size: '9:16' },
    { id: 'square',  label: 'Square',  desc: 'Compact 1:1 tile — great for social media grids.',        hue: 75,  size: '1:1'  },
  ]

  const cur = presets.find(p => p.id === active)!

  return (
    <section style={{ background: 'var(--bg-1)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '80px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>
            5 presets
          </p>
          <h2 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 auto', lineHeight: 1.15 }}>
            A template for every format.
          </h2>
        </div>

        {/* Preset tabs */}
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'center',
          flexWrap: 'wrap', marginBottom: 40,
        }}>
          {presets.map(p => (
            <button key={p.id} onClick={() => setActive(p.id)} style={{
              padding: '8px 18px', borderRadius: 999,
              border: `1px solid ${active === p.id ? 'var(--accent)' : 'var(--line)'}`,
              background: active === p.id ? 'rgba(62,207,142,0.12)' : 'transparent',
              color: active === p.id ? 'var(--accent)' : 'var(--fg-2)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'var(--font)',
              transition: 'all 140ms',
            }}>{p.label}</button>
          ))}
        </div>

        {/* Preview */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        }}>
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 18,
            padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            minHeight: 400, width: '100%', position: 'relative', overflow: 'hidden',
          }}>
            {/* subtle grid */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.4,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
              backgroundSize: '52px 52px',
            }} />
            <div style={{ position: 'relative', zIndex: 1, transform: 'scale(0.75)', transformOrigin: 'center' }}>
              <DemoCard preset={cur.id} tintHue={cur.hue} size={cur.size} />
            </div>
          </div>
          <p style={{ fontSize: 14, color: 'var(--fg-2)', textAlign: 'center', maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: 'var(--fg)', fontWeight: 600 }}>{cur.label}.</strong> {cur.desc}
          </p>
          <button className="btn" data-variant="primary" data-size="lg" onClick={onOpenEditor}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Try it in the editor <ArrowRight />
          </button>
        </div>
      </div>
    </section>
  )
}

/* ─── Bottom CTA ───────────────────────────────────────────── */
function BottomCTA({ onOpenEditor }: { onOpenEditor: () => void }) {
  return (
    <section style={{ padding: '100px 20px', textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
      <h2 style={{
        fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 800,
        letterSpacing: '-0.03em', lineHeight: 1.1,
        margin: '0 0 20px',
      }}>
        Paste a track.<br />
        <span style={{ color: 'var(--accent)' }}>Get a card.</span>
      </h2>
      <p style={{ fontSize: 16, color: 'var(--fg-2)', margin: '0 0 36px', lineHeight: 1.65 }}>
        No account, no watermark, no fuss. Open the editor and start creating.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn" data-variant="primary" data-size="xl" onClick={onOpenEditor}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Open editor <ArrowRight />
        </button>
        <a href="https://github.com/clintdoesdev/FrameSound" target="_blank" rel="noopener noreferrer"
          className="btn" data-size="xl"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <GithubIcon /> Star on GitHub
        </a>
      </div>
    </section>
  )
}

/* ─── Footer ───────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--line)',
      padding: '28px 20px',
      background: 'var(--bg-1)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        display: 'flex', flexDirection: 'column', gap: 16,
        alignItems: 'center', textAlign: 'center',
      }}>
        <Logo size={18} />
        <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: 0, maxWidth: 400, lineHeight: 1.5 }}>
          Open source Spotify card generator. MIT licensed.
          Not affiliated with Spotify AB.
        </p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'GitHub', href: 'https://github.com/clintdoesdev/FrameSound' },
            { label: 'Editor', onClick: true },
            { label: 'Issues', href: 'https://github.com/clintdoesdev/FrameSound/issues' },
          ].map(l => (
            <a key={l.label} href={l.href ?? '#'}
              style={{ fontSize: 13, color: 'var(--fg-2)', textDecoration: 'none', fontWeight: 500 }}
              target={l.href?.startsWith('http') ? '_blank' : undefined}
              rel={l.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >{l.label}</a>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--fg-4)', margin: 0 }}>© 2026 FrameSound</p>
      </div>
    </footer>
  )
}

/* ─── Main export ──────────────────────────────────────────── */
export default function LandingPage({ onOpenEditor }: Props) {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
      <Navbar onOpenEditor={onOpenEditor} />
      <Hero onOpenEditor={onOpenEditor} />
      <TrustStrip />
      <HowItWorks />
      <PresetsSection onOpenEditor={onOpenEditor} />
      <BottomCTA onOpenEditor={onOpenEditor} />
      <Footer />
    </div>
  )
}
