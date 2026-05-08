'use client'

import React, { useState } from 'react'
import CardCanvasImpl from '@/components/CardCanvas'
import { TrackData, CardConfig, defaultConfig } from '@/types'

type Props = {
  onOpenEditor: () => void
}

const DEMO: TrackData = {
  id: 'demo',
  title: 'Long Static',
  artist: 'Field Axis',
  album: 'Range / Vapor',
  coverUrl: null,
  releaseYear: '2024',
  duration: 218000,
  previewUrl: null,
  trackNumber: 1,
}

const DEMO_LINES = ['the room exhales / a slower year arrives']

function mkCfg(overrides: Partial<CardConfig>): CardConfig {
  return { ...defaultConfig, ...overrides }
}

function DemoCard({
  preset, tintHue, size, padding = 28, borderRadius = 18,
}: {
  preset: CardConfig['preset']
  tintHue: number
  size: CardConfig['size']
  padding?: number
  borderRadius?: number
}) {
  const ref = React.useRef<HTMLDivElement>(null!)
  return (
    <CardCanvasImpl
      track={DEMO}
      config={mkCfg({ preset, tintHue, size, padding, borderRadius })}
      selectedLines={DEMO_LINES}
      cardRef={ref}
    />
  )
}

// Icons
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>
  </svg>
)
const LinkIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 14a4 4 0 0 1 0-5.6l3-3a4 4 0 1 1 5.6 5.6l-1.5 1.5"/>
    <path d="M14 10a4 4 0 0 1 0 5.6l-3 3a4 4 0 1 1-5.6-5.6L6.9 11.5"/>
  </svg>
)
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.5 9.5 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/>
  </svg>
)
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12 5 5 9-11"/>
  </svg>
)
const BoltIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2 4 14h7l-1 8 9-12h-7z"/>
  </svg>
)
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>
  </svg>
)
const DlIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/>
  </svg>
)

export function Logo({ size = 18 }: { size?: number }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: size, height: size, borderRadius: 5,
        background: 'linear-gradient(135deg, var(--accent) 0%, oklch(0.56 0.16 186) 100%)',
        display: 'grid', placeItems: 'center',
        boxShadow: 'inset 0 1px 0 oklch(1 0 0 / 0.4), 0 1px 2px oklch(0 0 0 / 0.4)',
      }}>
        <div style={{
          width: size * 0.5, height: size * 0.5, borderRadius: 2,
          background: 'oklch(0.14 0.005 80)',
          boxShadow: 'inset 0 0 0 1px oklch(1 0 0 / 0.3)',
        }} />
      </div>
      <span style={{ fontWeight: 600, letterSpacing: '-0.01em', fontSize: 15, fontFamily: 'var(--font-display)' }}>FrameSound</span>
    </div>
  )
}

function TopNav({ onOpenEditor }: { onOpenEditor: () => void }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 30,
      borderBottom: '1px solid var(--line-soft)',
      background: 'color-mix(in oklab, var(--bg) 80%, transparent)',
      backdropFilter: 'blur(20px) saturate(160%)',
      WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', alignItems: 'center', gap: 24,
        height: 56, padding: '0 24px',
      }}>
        <Logo />
        <div className="mono" style={{
          fontSize: 11, color: 'var(--fg-3)', padding: '3px 7px',
          background: 'var(--bg-inset)', border: '1px solid var(--line)',
          borderRadius: 4, letterSpacing: '0.04em',
        }}>v0.4</div>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 12 }}>
          {[
            { label: 'Presets', href: '#presets-gallery' },
            { label: 'Stack', href: '#stack' },
            { label: 'Quickstart', href: '#quickstart' },
            { label: 'FAQ', href: '#faq' },
          ].map(x => (
            <a key={x.label} href={x.href} style={{
              padding: '6px 10px', fontSize: 13, color: 'var(--fg-2)',
              textDecoration: 'none', borderRadius: 6,
            }}>{x.label}</a>
          ))}
        </nav>
        <div style={{ flex: 1 }} />
        <a href="https://github.com/clintdoesdev/FrameSound" target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--fg-2)', textDecoration: 'none' }}>
          <GitHubIcon /><span>GitHub</span>
        </a>
        <button className="btn" data-size="sm" data-variant="primary" onClick={onOpenEditor}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Open editor <ArrowIcon />
        </button>
      </div>
    </header>
  )
}

function HeroLive({ onOpenEditor }: { onOpenEditor: () => void }) {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--line)' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 1200px 500px at 50% -10%, var(--accent-quiet), transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none' }} />
      <div style={{
        position: 'relative', maxWidth: 1280, margin: '0 auto',
        padding: '80px 24px 60px',
        display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 64, alignItems: 'center',
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 24 }}>
            <span className="dot" />FRAMESOUND v0.4 · NOW WITH LYRIC QUOTES
          </div>
          <h1 style={{
            fontSize: 'clamp(40px, 5.5vw, 72px)', lineHeight: 0.96, letterSpacing: '-0.04em',
            fontWeight: 600, margin: 0, color: 'var(--fg)',
            fontFamily: 'var(--font-display)',
          }}>
            Turn any track into a{' '}
            <span style={{ color: 'var(--accent)' }}>shareable</span>{' '}
            visual card.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.5, color: 'var(--fg-2)', margin: '24px 0 32px', maxWidth: 520 }}>
            Paste a Spotify track URL. FrameSound fetches the metadata, lifts a lyric, and exports
            an HD card in five distinct presets. No login, no watermark, no nonsense.
          </p>
          <div style={{
            display: 'flex', gap: 8, padding: 6,
            background: 'var(--bg-1)', border: '1px solid var(--line)',
            borderRadius: 12, boxShadow: 'var(--shadow-md)', maxWidth: 560,
          }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px' }}>
              <span style={{ color: 'var(--fg-3)' }}><LinkIcon /></span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg-1)' }}>
                open.spotify.com/track/<span style={{ color: 'var(--accent)' }}>3xK8s2pq</span>
              </span>
              <span style={{ display: 'inline-block', width: 1.5, height: 14, background: 'var(--accent)', animation: 'blink 1s steps(2) infinite' }} />
            </div>
            <button className="btn" data-variant="primary" data-size="lg" onClick={onOpenEditor}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Generate <ArrowIcon />
            </button>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: 'var(--fg-3)' }}>
            {[['No login', 'check'], ['3× HD export', 'check'], ['Server-side keys', 'check']].map(([label]) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <CheckIcon /> {label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ position: 'relative', display: 'grid', placeItems: 'center' }}>
          <div style={{
            position: 'absolute', inset: -40, zIndex: 0,
            background: 'radial-gradient(ellipse at 50% 50%, var(--accent-soft), transparent 60%)',
            filter: 'blur(40px)',
          }} />
          <div style={{ transform: 'perspective(1400px) rotateY(-9deg) rotateX(6deg)', position: 'relative', zIndex: 1 }}>
            <DemoCard preset="poster" tintHue={162} size="4:5" />
          </div>
          <div style={{
            position: 'absolute', top: 0, right: -8, zIndex: 2,
            background: 'var(--bg-1)', border: '1px solid var(--line)',
            borderRadius: 8, padding: '6px 10px',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--fg-2)', boxShadow: 'var(--shadow-md)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--accent)' }} />
            POSTER PRESET
          </div>
          <div style={{
            position: 'absolute', bottom: 24, left: -16, zIndex: 2,
            background: 'var(--bg-1)', border: '1px solid var(--line)',
            borderRadius: 8, padding: '6px 10px',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--fg-2)', boxShadow: 'var(--shadow-md)',
          }}>
            EXPORTED 1440 × 1800 · PNG @ 3×
          </div>
        </div>
      </div>
    </section>
  )
}

function LogoStrip() {
  return (
    <section style={{ borderBottom: '1px solid var(--line)', padding: '28px 0', background: 'var(--bg)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.08em', textAlign: 'center', marginBottom: 18 }}>
          USED BY 24,000+ MUSIC POSTERS THIS MONTH
        </div>
        <div className="fade-edge" style={{
          display: 'flex', justifyContent: 'space-around', alignItems: 'center',
          color: 'var(--fg-3)', fontSize: 18, fontWeight: 500, opacity: 0.7,
        }}>
          {['RANGE FM', 'Field Axis', 'HOLLOWMARK', 'Slow Channel', 'Pelham Records', 'Quiet Plumbing'].map(n => (
            <span key={n} style={{
              fontFamily: n === n.toUpperCase() ? 'var(--font-mono)' : 'var(--font-sans)',
              letterSpacing: n === n.toUpperCase() ? '0.12em' : '-0.01em',
              whiteSpace: 'nowrap',
            }}>{n}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureVisual({ kind }: { kind: string }) {
  if (kind === 'presets') {
    return (
      <div style={{
        height: 160, borderRadius: 10, background: 'var(--bg-inset)',
        border: '1px solid var(--line-soft)', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12,
      }}>
        {[162, 222, 290, 50, 75].map((hue, i) => (
          <div key={hue} style={{
            width: i === 3 ? 36 : 56, height: i === 3 ? 64 : 56, borderRadius: 4,
            background: `linear-gradient(135deg, oklch(0.55 0.15 ${hue}), oklch(0.30 0.12 ${hue + 38}))`,
            boxShadow: 'var(--shadow-sm)', position: 'relative',
          }}>
            <div style={{ position: 'absolute', bottom: 4, left: 4, right: 4, height: 1, background: 'oklch(1 0 0 / 0.6)' }} />
            <div style={{ position: 'absolute', bottom: 7, left: 4, width: '60%', height: 1, background: 'oklch(1 0 0 / 0.4)' }} />
          </div>
        ))}
      </div>
    )
  }
  if (kind === 'code') {
    return (
      <div style={{
        height: 160, borderRadius: 10, background: 'var(--bg-inset)',
        border: '1px solid var(--line-soft)', padding: 14,
        fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.7, overflow: 'hidden',
      }}>
        <div style={{ color: 'var(--fg-4)' }}>{`// src/actions/spotify.ts`}</div>
        <div><span style={{ color: 'var(--accent)' }}>&apos;use server&apos;</span></div>
        <div>
          <span style={{ color: 'var(--fg-3)' }}>export async function </span>
          <span style={{ color: 'var(--fg)' }}>getTrackFromUrl</span>(url) {'{'}
        </div>
        <div style={{ paddingLeft: 12 }}><span style={{ color: 'var(--fg-3)' }}>const </span>id = parseSpotifyTrackId(url)</div>
        <div style={{ paddingLeft: 12 }}><span style={{ color: 'var(--fg-3)' }}>const </span>token = <span style={{ color: 'var(--accent)' }}>await </span>getAccessToken()</div>
        <div style={{ paddingLeft: 12 }}><span style={{ color: 'var(--fg-3)' }}>return </span>fetchTrack(id, token)</div>
        <div>{'}'}</div>
      </div>
    )
  }
  const exports = [
    { label: 'PNG · 3×',   size: '2208 × 2208' },
    { label: 'JPG · 2×',   size: '1472 × 1472' },
    { label: 'Trans. PNG', size: '1× · alpha' },
    { label: 'Clipboard',  size: 'ClipboardItem' },
  ]
  return (
    <div style={{
      height: 160, borderRadius: 10, background: 'var(--bg-inset)',
      border: '1px solid var(--line-soft)', padding: 12,
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
    }}>
      {exports.map(it => (
        <div key={it.label} style={{ background: 'var(--bg-1)', border: '1px solid var(--line-soft)', borderRadius: 6, padding: '8px 10px' }}>
          <div style={{ fontSize: 12, color: 'var(--fg-1)', fontWeight: 500 }}>{it.label}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-3)' }}>{it.size}</div>
        </div>
      ))}
    </div>
  )
}

function FeatureTrio() {
  const features = [
    { icon: <BoltIcon />, title: 'Five distinct presets', visual: 'presets',
      body: 'Glass, Poster, Minimal, Story, Square. Each one is a fully-styled template that respects your typography and visibility toggles.' },
    { icon: <ShieldIcon />, title: 'Server-side credentials', visual: 'code',
      body: 'Your Spotify Client ID and Secret never reach the browser. Token exchange and track fetches happen inside Server Actions.' },
    { icon: <DlIcon />, title: 'HD export, four ways', visual: 'exports',
      body: 'PNG @ 3×, JPG @ 2×, transparent PNG, or copy directly to clipboard. dom-to-image renders the live DOM at scale.' },
  ]
  return (
    <section style={{ borderBottom: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 24px' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}><span className="dot" />WHAT IT DOES</div>
        <h2 style={{
          fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.03em',
          fontWeight: 600, margin: '0 0 56px', maxWidth: 760,
          fontFamily: 'var(--font-display)',
        }}>
          One paste. Five presets.{' '}
          <span style={{ color: 'var(--fg-3)' }}>Infinite combinations.</span>
        </h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1,
          background: 'var(--line)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden',
        }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: 'var(--bg)', padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <FeatureVisual kind={f.visual} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
                {f.icon}
                <span className="mono" style={{ fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}>0{i + 1}</span>
              </div>
              <h3 style={{ fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 600, margin: 0, color: 'var(--fg)' }}>{f.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--fg-2)', margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const GALLERY_PRESETS: {
  id: CardConfig['preset']; name: string; desc: string; size: CardConfig['size']; hue: number
}[] = [
  { id: 'glass',   name: 'Glass',   desc: 'Album art blurred as background, frosted glass info panel centered over it.',        size: '1:1',  hue: 162 },
  { id: 'poster',  name: 'Poster',  desc: 'Full-bleed album art, gradient fade to black at the bottom, text overlaid.',          size: '4:5',  hue: 30  },
  { id: 'minimal', name: 'Minimal', desc: 'Clean side-by-side layout. Album art left, metadata right, no background texture.',   size: '16:9', hue: 220 },
  { id: 'story',   name: 'Story',   desc: 'Tall 9:16 layout, blurred art background, large centered art, lyrics in glass card.', size: '9:16', hue: 290 },
  { id: 'square',  name: 'Square',  desc: 'Compact 1:1 variant with slightly smaller art and tighter spacing.',                  size: '1:1',  hue: 75  },
]

function PresetGallery() {
  const [active, setActive] = useState<string>('glass')
  const current = GALLERY_PRESETS.find(p => p.id === active)!
  return (
    <section id="presets-gallery" style={{ borderBottom: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 24px' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}><span className="dot" />THE PRESETS</div>
        <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 24, marginBottom: 48 }}>
          <h2 style={{
            fontSize: 'clamp(28px, 3.5vw, 48px)', lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 600,
            margin: 0, maxWidth: 600, fontFamily: 'var(--font-display)',
          }}>
            Five layouts.{' '}
            <span style={{ color: 'var(--fg-3)' }}>Every config option works on all of them.</span>
          </h2>
          <div className="mono" style={{ fontSize: 12, color: 'var(--fg-3)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
            {GALLERY_PRESETS.length} TEMPLATES · ALL PIXEL-EXACT
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 32, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {GALLERY_PRESETS.map((p, i) => (
              <button key={p.id} onClick={() => setActive(p.id)} style={{
                textAlign: 'left', padding: '14px 16px',
                background: active === p.id ? 'var(--bg-1)' : 'transparent',
                border: `1px solid ${active === p.id ? 'var(--line-1)' : 'transparent'}`,
                borderRadius: 10, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 4, position: 'relative',
              }}>
                {active === p.id && (
                  <span style={{ position: 'absolute', left: -1, top: 12, bottom: 12, width: 2, background: 'var(--accent)', borderRadius: 99 }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: active === p.id ? 'var(--fg)' : 'var(--fg-1)' }}>{p.name}</span>
                  <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)' }}>0{i + 1} · {p.size}</span>
                </div>
                <span style={{ fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.4 }}>{p.desc}</span>
              </button>
            ))}
          </div>
          <div className="stage-bg" style={{
            border: '1px solid var(--line)', borderRadius: 16,
            padding: 48, minHeight: 540,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
            <div style={{ position: 'relative', zIndex: 1, transform: 'scale(0.8)', transformOrigin: 'center' }}>
              <DemoCard preset={current.id} tintHue={current.hue} size={current.size} />
            </div>
            <div style={{
              position: 'absolute', top: 16, left: 16,
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em',
            }}>
              {current.name.toUpperCase()} · {current.size}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const STACK_ROWS = [
  ['Framework',    'Next.js 16.2',      'App Router · Turbopack'],
  ['Language',     'TypeScript',        'Strict mode'],
  ['Styling',      'Tailwind CSS',      'v4'],
  ['Fonts',        'next/font',         'Syne · DM Sans'],
  ['Image export', 'dom-to-image-more', 'PNG / JPG / clipboard'],
  ['Color',        'colorthief',        'Per-track palette extraction'],
  ['Spotify',      'Web API',           'Client Credentials flow'],
  ['Lyrics',       'lyrics.ovh',        'No API key required'],
  ['State',        'React useState',    'Local to page.tsx'],
  ['Persistence',  'localStorage',      'Recent track history only'],
]

function StackTable() {
  return (
    <section id="stack" style={{ borderBottom: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 64, alignItems: 'start' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}><span className="dot" />TECH</div>
            <h2 style={{
              fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 600, margin: 0,
              fontFamily: 'var(--font-display)',
            }}>
              Boring stack.{' '}<span style={{ color: 'var(--fg-3)' }}>On purpose.</span>
            </h2>
            <p style={{ fontSize: 15, color: 'var(--fg-2)', margin: '20px 0 28px', lineHeight: 1.55, maxWidth: 380 }}>
              Server Actions hold credentials. The page is statically prerendered. State is a single{' '}
              <span className="code">useState</span> in <span className="code">page.tsx</span>.
            </p>
            <a href="https://github.com/clintdoesdev/FrameSound" target="_blank" rel="noopener noreferrer"
              className="btn" data-size="sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <GitHubIcon /><span>View source</span>
            </a>
          </div>
          <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-1)' }}>
            {STACK_ROWS.map(([label, value, sub], i) => (
              <div key={label} style={{
                display: 'grid', gridTemplateColumns: '140px 1fr 1fr',
                padding: '14px 18px',
                borderTop: i === 0 ? '0' : '1px solid var(--line-soft)',
                alignItems: 'center',
              }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500 }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

type CodeLine = [string, ...string[]]

function CodeBlock({ title, lines }: { title: string; lines: CodeLine[] }) {
  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-inset)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderBottom: '1px solid var(--line-soft)',
        background: 'var(--bg-1)',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: 'var(--accent)', boxShadow: '0 0 0 3px var(--accent-quiet)' }} />
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>{title}</span>
      </div>
      <pre style={{ margin: 0, padding: 16, fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.7, color: 'var(--fg-1)', overflowX: 'auto' }}>
        {lines.map((parts, i) => {
          const [tag, ...rest] = parts
          if (tag === 'c') return <div key={i} style={{ color: 'var(--fg-4)' }}>{rest[0] || ' '}</div>
          if (tag === 'p') return <div key={i}><span style={{ color: 'var(--accent)' }}>{rest[0].split(' ')[0]}</span><span style={{ color: 'var(--fg-1)' }}> {rest[0].split(' ').slice(1).join(' ')}</span></div>
          if (tag === 'o') return <div key={i} style={{ color: 'var(--fg-3)' }}>{rest[0]}</div>
          if (tag === 'k') return <div key={i}><span style={{ color: 'var(--fg)' }}>{rest[0]}</span><span style={{ color: 'var(--fg-3)' }}>=</span><span style={{ color: 'var(--accent)' }}>{rest[1]}</span></div>
          return null
        })}
      </pre>
    </div>
  )
}

function Quickstart() {
  return (
    <section id="quickstart" style={{ borderBottom: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '100px 24px' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}><span className="dot" />SELF-HOST</div>
        <h2 style={{
          fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 600, margin: '0 0 28px',
          fontFamily: 'var(--font-display)',
        }}>
          Three commands, one .env file, zero config.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <CodeBlock title="Terminal" lines={[
            ['c', '# clone & install'],
            ['p', '$ git clone github.com/clintdoesdev/FrameSound'],
            ['p', '$ cd FrameSound && npm install'],
            ['c', ''],
            ['c', '# add credentials'],
            ['p', '$ cp .env.local.example .env.local'],
            ['c', ''],
            ['c', '# go'],
            ['p', '$ npm run dev'],
            ['o', '▲ Next.js 16.2.0 (Turbopack)'],
            ['o', '  - Local:        http://localhost:3000'],
            ['o', '  - Ready in 412ms'],
          ]} />
          <CodeBlock title=".env.local" lines={[
            ['c', '# Spotify Web API — Client Credentials flow'],
            ['c', '# https://developer.spotify.com/dashboard'],
            ['c', ''],
            ['k', 'SPOTIFY_CLIENT_ID', 'your_client_id_here'],
            ['k', 'SPOTIFY_CLIENT_SECRET', 'your_client_secret_here'],
            ['c', ''],
            ['c', '# Read only by Server Actions'],
            ['c', '# and never sent to the browser.'],
          ]} />
        </div>
      </div>
    </section>
  )
}

const FAQ_ITEMS = [
  { q: 'Do I need a Spotify account or paid plan?', a: 'No. FrameSound uses the Client Credentials OAuth flow, which only needs app credentials from developer.spotify.com — no user login, no premium tier required.' },
  { q: 'Where do my Spotify keys live?', a: "Server-side only. SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are read inside Server Actions marked 'use server'. They are never bundled into client JS." },
  { q: "What happens when lyrics aren't found?", a: 'lyrics.ovh has inconsistent coverage. When a track is missing, the Lyrics panel switches to a free-text input where you can type your own quote.' },
  { q: 'Why does my export sometimes fail?', a: 'Spotify album art is served from i.scdn.co. If CORS blocks dom-to-image from inlining the image, the render fails. Try the JPG export or a different track.' },
  { q: 'Can I add my own preset?', a: 'Yes. Each preset is a branch in CardCanvas.tsx with inline styles. Add a new case, register it in the CardConfig type, and it will appear in the Customize panel.' },
]

function FAQ() {
  const [open, setOpen] = useState<number>(0)
  return (
    <section id="faq" style={{ borderBottom: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '100px 24px' }}>
        <div className="eyebrow" style={{ marginBottom: 12 }}><span className="dot" />QUESTIONS</div>
        <h2 style={{
          fontSize: 40, lineHeight: 1.05, letterSpacing: '-0.03em', fontWeight: 600, margin: '0 0 40px',
          fontFamily: 'var(--font-display)',
        }}>
          Frequently asked.
        </h2>
        <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-1)' }}>
          {FAQ_ITEMS.map((it, i) => (
            <div key={i} style={{ borderTop: i === 0 ? '0' : '1px solid var(--line-soft)' }}>
              <button onClick={() => setOpen(open === i ? -1 : i)} style={{
                width: '100%', padding: '18px 22px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'transparent', border: 0, cursor: 'pointer', textAlign: 'left', color: 'var(--fg)',
              }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{it.q}</span>
                <span style={{
                  fontSize: 18, color: 'var(--fg-3)', flexShrink: 0, marginLeft: 16,
                  transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 180ms',
                }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: '0 22px 20px', fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, maxWidth: 720 }}>
                  {it.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTAFooter({ onOpenEditor }: { onOpenEditor: () => void }) {
  return (
    <>
      <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--line)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 100%, var(--accent-soft), transparent 70%)' }} />
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: '120px 24px', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: 1, letterSpacing: '-0.04em', fontWeight: 600, margin: 0,
            fontFamily: 'var(--font-display)',
          }}>
            Paste a track.{' '}<span style={{ color: 'var(--fg-3)' }}>Get a card.</span>
          </h2>
          <p style={{ fontSize: 17, color: 'var(--fg-2)', margin: '24px auto 32px', maxWidth: 540 }}>
            No login. No watermark. Three-times resolution exports. Open the editor and try it.
          </p>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            <button className="btn" data-variant="primary" data-size="lg" onClick={onOpenEditor}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Open editor <ArrowIcon />
            </button>
            <a href="https://github.com/clintdoesdev/FrameSound" target="_blank" rel="noopener noreferrer"
              className="btn" data-size="lg"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <GitHubIcon /><span>Star on GitHub</span>
            </a>
          </div>
        </div>
      </section>
      <footer style={{ background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 24px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 48 }}>
          <div>
            <Logo />
            <p style={{ fontSize: 13, color: 'var(--fg-3)', margin: '12px 0 0', maxWidth: 280, lineHeight: 1.5 }}>
              A browser-based card generator for Spotify tracks. Open source, MIT-licensed, self-hostable.
            </p>
          </div>
          {[
            { h: 'Product',    items: ['Editor', 'Presets', 'Export formats', 'Roadmap'] },
            { h: 'Resources',  items: ['Documentation', 'API reference', 'Changelog', 'Examples'] },
            { h: 'Repository', items: ['GitHub', 'Issues', 'Releases', 'License'] },
            { h: 'Legal',      items: ['Privacy', 'Terms', 'Spotify usage', 'Contact'] },
          ].map(col => (
            <div key={col.h}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em', marginBottom: 12 }}>{col.h.toUpperCase()}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.items.map(item => (
                  <li key={item}><a href="#" style={{ fontSize: 13, color: 'var(--fg-1)', textDecoration: 'none' }}>{item}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{
          borderTop: '1px solid var(--line-soft)', padding: '20px 24px',
          maxWidth: 1280, margin: '0 auto',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em' }}>
            © 2026 FRAMESOUND · MIT · BUILT WITH NEXT.JS 16.2
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>
            Not affiliated with Spotify AB. Spotify is a trademark of Spotify AB.
          </div>
        </div>
      </footer>
    </>
  )
}

export default function LandingPage({ onOpenEditor }: Props) {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <TopNav onOpenEditor={onOpenEditor} />
      <HeroLive onOpenEditor={onOpenEditor} />
      <LogoStrip />
      <FeatureTrio />
      <PresetGallery />
      <StackTable />
      <Quickstart />
      <FAQ />
      <CTAFooter onOpenEditor={onOpenEditor} />
    </div>
  )
}
