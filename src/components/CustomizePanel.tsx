'use client'

import React, { useState } from 'react'
import { CardConfig } from '@/types'
import { GlassToggle, GlassRange, type TabItem } from '@/components/glass/Controls'
import type { RGBA } from '@/lib/liquid-glass/liquid-glass'

type SavedPreset = { id: string; name: string; config: CardConfig }

const STORAGE_KEY = 'framesound-saved-presets'

// Presets that existed in earlier versions. Without this map a stale saved
// preset silently falls through to the default branch and renders as the
// wrong card, which reads as data loss to whoever saved it.
const LEGACY_PRESETS: Record<string, CardConfig['preset']> = {
  poster:     'bloom',
  square:     'bezel',
  minimal:    'profile',
  nowplaying: 'player',
  story:      'bloom',
}
const VALID_PRESETS: CardConfig['preset'][] =
  ['glass', 'bezel', 'bloom', 'ticket', 'tag', 'profile', 'player']

function migratePreset(p: string): CardConfig['preset'] {
  if ((VALID_PRESETS as string[]).includes(p)) return p as CardConfig['preset']
  return LEGACY_PRESETS[p] ?? 'glass'
}

function loadSavedPresets(): SavedPreset[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list = raw ? (JSON.parse(raw) as SavedPreset[]) : []
    return list.map(p => ({
      ...p,
      // Saved before SF Pro existed → they were made in Poppins.
      config: { ...p.config, font: p.config?.font ?? 'poppins', preset: migratePreset(p.config?.preset as string) },
    }))
  } catch { return [] }
}
function persistPresets(list: SavedPreset[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* quota error */ }
}

export type PanelTab = 'style' | 'text' | 'layout' | 'effects'

// ── Icons (SF-Symbols-like strokes) ─────────────────────────────
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const Icon = ({ d, children }: { d?: string; children?: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" {...S}>{d ? <path d={d} /> : children}</svg>
)

export const PANEL_TABS: TabItem<PanelTab>[] = [
  { key: 'style', label: 'Style', icon: (
    <Icon><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="3.5" /></Icon>
  ) },
  { key: 'text', label: 'Text', icon: (
    <Icon><path d="M4 19 9.5 5h1L16 19M6 14.5h9" /><path d="M20.5 19v-5.5a2.6 2.6 0 0 0-5 0M16 16.5a2.3 2.3 0 1 0 4.5.6" /></Icon>
  ) },
  { key: 'layout', label: 'Layout', icon: (
    <Icon><rect x="3.5" y="4" width="17" height="16" rx="3.5" /><path d="M3.5 14.5h17M12 14.5V20" /></Icon>
  ) },
  { key: 'effects', label: 'Effects', icon: (
    <Icon><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" /><circle cx="12" cy="12" r="2.5" /></Icon>
  ) },
]

const IconImage = () => <Icon><rect x="3" y="4.5" width="18" height="15" rx="3.5" /><circle cx="9" cy="10" r="1.6" /><path d="m21 15.5-4.5-4.5L8 19.5" /></Icon>
const IconText = () => <Icon d="M5 6.5V5h14v1.5M12 5v14M9.5 19h5" />
const IconUser = () => <Icon><circle cx="12" cy="8.5" r="3.5" /><path d="M5 19.5c.8-3.3 3.6-5 7-5s6.2 1.7 7 5" /></Icon>
const IconCalendar = () => <Icon><rect x="3.5" y="5" width="17" height="15" rx="3.5" /><path d="M8 3v4M16 3v4M3.5 10h17" /></Icon>
const IconClock = () => <Icon><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Icon>
const IconQuote = () => <Icon d="M9.5 7C6.5 8 5 10.2 5 13.5V17h4.5v-4.5H7M19 7c-3 1-4.5 3.2-4.5 6.5V17H19v-4.5h-2.5" />
const IconGlow = () => <Icon><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7" /></Icon>
const IconGrain = () => <Icon><circle cx="7" cy="7" r=".6" /><circle cx="12" cy="6" r=".6" /><circle cx="17" cy="8" r=".6" /><circle cx="9" cy="12" r=".6" /><circle cx="15" cy="12.5" r=".6" /><circle cx="6" cy="16" r=".6" /><circle cx="12" cy="17.5" r=".6" /><circle cx="18" cy="16.5" r=".6" /></Icon>
const IconVignette = () => <Icon><rect x="3.5" y="4.5" width="17" height="15" rx="3.5" /><ellipse cx="12" cy="12" rx="5" ry="4" /></Icon>
const IconScanlines = () => <Icon d="M4 6h16M4 10h16M4 14h16M4 18h16" />
const IconHolo = () => <Icon><path d="M12 3.5 20 8v8l-8 4.5L4 16V8z" /><path d="M4 8l8 4.5L20 8M12 12.5v8" /></Icon>
const AlignLeftIcon = () => <Icon d="M4 6h16M4 10.5h10M4 15h13M4 19.5h8" />
const AlignCenterIcon = () => <Icon d="M4 6h16M7 10.5h10M5.5 15h13M8 19.5h8" />
const AlignRightIcon = () => <Icon d="M4 6h16M10 10.5h10M7 15h13M12 19.5h8" />

// ── Preset thumbnails ───────────────────────────────────────────
// Miniatures of each card: an "album art" gradient under panes of glass.
const ART = 'url(#fs-art)'
const GLASS = 'rgba(255,255,255,0.3)'
const GLASS_EDGE = 'rgba(255,255,255,0.75)'
const LINE = 'rgba(255,255,255,0.92)'
const LINE_2 = 'rgba(255,255,255,0.5)'

const ThumbDefs = () => (
  <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
    <defs>
      <linearGradient id="fs-art" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#5e5ce6" />
        <stop offset="55%" stopColor="#bf5af2" />
        <stop offset="100%" stopColor="#ff375f" />
      </linearGradient>
      <linearGradient id="fs-fade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(255,255,255,0)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.38)" />
      </linearGradient>
      <linearGradient id="fs-slab" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(191,90,242,0.55)" />
        <stop offset="100%" stopColor="rgba(94,92,230,0.35)" />
      </linearGradient>
    </defs>
  </svg>
)
const Plate = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 44 36" width="100%" height="100%" fill="none" aria-hidden>{children}</svg>
)
const Pane = (p: React.SVGProps<SVGRectElement>) => (
  <rect fill={GLASS} stroke={GLASS_EDGE} strokeWidth="0.6" {...p} />
)

const PRESET_SVG: Record<CardConfig['preset'], React.ReactNode> = {
  glass: (
    <Plate>
      <rect x="8" y="2" width="28" height="33" rx="4.5" fill={ART} />
      <Pane x="10" y="22" width="24" height="11" rx="3.5" />
      <rect x="12.5" y="25" width="12" height="1.8" rx="0.9" fill={LINE} />
      <rect x="12.5" y="28.5" width="8" height="1.3" rx="0.65" fill={LINE_2} />
    </Plate>
  ),
  bezel: (
    <Plate>
      <rect x="6" y="1" width="32" height="34" rx="5" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.34)" strokeWidth="0.7"/>
      <rect x="9.5" y="4" width="25" height="19" rx="3.5" fill="rgba(255,255,255,0.42)"/>
      <rect x="9.5" y="26" width="15" height="2.2" rx="1.1" fill="rgba(255,255,255,0.85)"/>
      <rect x="9.5" y="30" width="10" height="1.5" rx="0.75" fill="rgba(255,255,255,0.42)"/>
    </Plate>
  ),
  bloom: (
    <Plate>
      <rect x="6" y="1" width="32" height="34" rx="5" fill="url(#bloomG)"/>
      <defs>
        <linearGradient id="bloomG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.42)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0.14)"/>
        </linearGradient>
      </defs>
      <rect x="10" y="24" width="16" height="2.4" rx="1.2" fill="rgba(255,255,255,0.92)"/>
      <rect x="10" y="28.4" width="11" height="1.6" rx="0.8" fill="rgba(255,255,255,0.5)"/>
    </Plate>
  ),
  ticket: (
    <Plate>
      <rect x="6" y="1" width="32" height="27" rx="4.5" fill="rgba(255,255,255,0.10)"/>
      <rect x="9" y="3.5" width="26" height="15" rx="3" fill="rgba(255,255,255,0.30)"/>
      <rect x="11" y="21" width="13" height="1.7" rx="0.85" fill="rgba(255,255,255,0.75)"/>
      <rect x="11" y="24.3" width="9" height="1.2" rx="0.6" fill="rgba(255,255,255,0.4)"/>
      <rect x="11" y="27" width="22" height="8" rx="2.5" fill="rgba(255,255,255,0.5)"/>
      <circle cx="11" cy="28" r="1.9" fill="#1c1c1e"/>
      <circle cx="33" cy="28" r="1.9" fill="#1c1c1e"/>
      <rect x="13.5" y="29.5" width="5" height="4" rx="1" fill="rgba(0,0,0,0.45)"/>
      <rect x="20.5" y="30" width="10" height="1.3" rx="0.65" fill="rgba(0,0,0,0.42)"/>
    </Plate>
  ),
  tag: (
    <Plate>
      <rect x="6" y="1" width="32" height="27" rx="4.5" fill="rgba(255,255,255,0.10)"/>
      <rect x="9" y="3.5" width="26" height="15" rx="3" fill="rgba(255,255,255,0.30)"/>
      <rect x="11" y="21" width="13" height="1.7" rx="0.85" fill="rgba(255,255,255,0.75)"/>
      <rect x="11" y="24.3" width="9" height="1.2" rx="0.6" fill="rgba(255,255,255,0.4)"/>
      <rect x="11" y="27" width="22" height="8" rx="2.5" fill="rgba(255,255,255,0.5)"/>
      <circle cx="11" cy="28" r="1.9" fill="#1c1c1e"/>
      <circle cx="33" cy="28" r="1.9" fill="#1c1c1e"/>
      <rect x="19.5" y="29.5" width="5" height="5" rx="1.5" fill="rgba(0,0,0,0.5)"/>
    </Plate>
  ),
  profile: (
    <Plate>
      <rect x="4" y="1" width="36" height="34" rx="5" fill="rgba(255,255,255,0.07)"/>
      <rect x="7" y="4" width="30" height="16" rx="3.5" fill="rgba(255,255,255,0.28)"/>
      <rect x="8" y="15" width="9" height="9" rx="2.5" fill="rgba(255,255,255,0.55)" stroke="#1c1c1e" strokeWidth="1.2"/>
      <rect x="19" y="17.5" width="11" height="1.7" rx="0.85" fill="rgba(255,255,255,0.7)"/>
      <rect x="19" y="20.8" width="7" height="1.2" rx="0.6" fill="rgba(255,255,255,0.35)"/>
      <rect x="8" y="27" width="20" height="1.4" rx="0.7" fill="rgba(255,255,255,0.28)"/>
      <rect x="8" y="30.3" width="14" height="1.4" rx="0.7" fill="rgba(255,255,255,0.18)"/>
    </Plate>
  ),
  player: (
    <Plate>
      <rect x="4" y="1" width="36" height="34" rx="5" fill="url(#fs-slab)" />
      <Pane x="11" y="4" width="22" height="28" rx="4.5" />
      <rect x="13" y="6.3" width="18" height="2.6" rx="1.3" fill="rgba(255,255,255,0.35)" />
      <rect x="13" y="10.3" width="18" height="12" rx="2.5" fill={ART} />
      <rect x="13" y="25" width="18" height="1" rx="0.5" fill="rgba(255,255,255,0.35)" />
      <rect x="13" y="25" width="6" height="1" rx="0.5" fill={LINE} />
      <circle cx="18" cy="29" r="1.4" fill="rgba(255,255,255,0.4)" />
      <circle cx="22" cy="29" r="1.9" fill={LINE} />
      <circle cx="26" cy="29" r="1.4" fill="rgba(255,255,255,0.4)" />
    </Plate>
  ),
}

// ── Layout helpers ──────────────────────────────────────────────
function Group({ title, footer, children }: { title?: string; footer?: string; children: React.ReactNode }) {
  return (
    <section className="group">
      {title && <h3 className="group-title">{title}</h3>}
      <div className="group-body">{children}</div>
      {footer && <p className="group-footer">{footer}</p>}
    </section>
  )
}

function Seg<T extends string>({ value, options, onChange, label }: {
  value: T
  options: { value: T; label: React.ReactNode; aria?: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" aria-pressed={value === o.value}
          aria-label={o.aria} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

function ToggleRow({ icon, label, value, onChange }: {
  icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="row">
      <span className="row-label">{icon}{label}</span>
      <GlassToggle checked={value} onChange={onChange} label={label} />
    </div>
  )
}

const pct = (v: number) => `${v}%`

function hueRGBA(h: number): RGBA {
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return 0.5 - 0.4 * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [f(0), f(8), f(4), 1]
}

// Curated one-tap looks so the panel is useful before anyone has saved anything.
const STARTERS: { name: string; patch: Partial<CardConfig> }[] = [
  { name: 'Liquid',  patch: { preset: 'glass', bgStyle: 'blurred-art', glassTint: 'auto', glassFrost: 50, textColor: 'auto', glowEnabled: false, grainEnabled: false, vignetteEnabled: false, scanlinesEnabled: false, holoEnabled: false } },
  { name: 'Frosted', patch: { preset: 'glass', bgStyle: 'blurred-art', glassTint: 'light', glassFrost: 80, textColor: 'auto', grainEnabled: false, vignetteEnabled: false } },
  { name: 'Lens',    patch: { preset: 'glass', bgStyle: 'blurred-art', glassTint: 'clear', glassFrost: 20, textColor: 'white', artPadding: 20 } },
  { name: 'Poster',  patch: { preset: 'bloom', bgStyle: 'blurred-art', textAlign: 'left', vignetteEnabled: true, vignetteStrength: 40, grainEnabled: true, grainOpacity: 18 } },
  { name: 'Stub',    patch: { preset: 'ticket', bgStyle: 'blurred-art', grainEnabled: true, grainOpacity: 14 } },
  { name: 'Neon',    patch: { preset: 'player', bgStyle: 'gradient', glassTint: 'dark', glowEnabled: true, glowStrength: 70, holoEnabled: true, holoOpacity: 22 } },
]

const PRESETS: { id: CardConfig['preset']; name: string }[] = [
  { id: 'glass',   name: 'Glass'   },
  { id: 'bezel',   name: 'Bezel'   },
  { id: 'bloom',   name: 'Bloom'   },
  { id: 'ticket',  name: 'Ticket'  },
  { id: 'tag',     name: 'Tag'     },
  { id: 'profile', name: 'Profile' },
  { id: 'player',  name: 'Player'  },
]

const FONT_CSS_VAR: Record<CardConfig['font'], string> = {
  'sf-pro':         'var(--font-display)',
  poppins:          'var(--font-poppins)',
  'dm-serif':       'var(--font-dm-serif)',
  playfair:         'var(--font-playfair)',
  bebas:            'var(--font-bebas)',
  instrument:       'var(--font-instrument)',
  'space-grotesk':  'var(--font-space-grotesk)',
  raleway:          'var(--font-raleway)',
  cormorant:        'var(--font-cormorant)',
  oswald:           'var(--font-oswald)',
}

const FONTS: { value: CardConfig['font']; label: string; tag: string; weight: number; size: number }[] = [
  { value: 'sf-pro',        label: 'SF Pro',       tag: 'System',    weight: 600, size: 17 },
  { value: 'poppins',       label: 'Poppins',      tag: 'Modern',    weight: 600, size: 17 },
  { value: 'space-grotesk', label: 'Grotesk',      tag: 'Modern',    weight: 600, size: 16 },
  { value: 'raleway',       label: 'Raleway',      tag: 'Elegant',   weight: 300, size: 18 },
  { value: 'oswald',        label: 'Oswald',       tag: 'Condensed', weight: 500, size: 18 },
  { value: 'bebas',         label: 'Bebas',        tag: 'Display',   weight: 400, size: 22 },
  { value: 'playfair',      label: 'Playfair',     tag: 'Serif',     weight: 700, size: 17 },
  { value: 'dm-serif',      label: 'DM Serif',     tag: 'Serif',     weight: 400, size: 18 },
  { value: 'cormorant',     label: 'Cormorant',    tag: 'Luxury',    weight: 600, size: 20 },
  { value: 'instrument',    label: 'Instrument',   tag: 'Italic',    weight: 400, size: 18 },
]

type Props = {
  tab: PanelTab
  config: CardConfig
  onChange: (updates: Partial<CardConfig>) => void
  /** The lyric picker, shown at the top of the Text tab. */
  lyrics?: React.ReactNode
}

export default function CustomizePanel({ tab, config, onChange, lyrics }: Props) {
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>(() => loadSavedPresets())
  const [saveName, setSaveName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  const savePreset = () => {
    if (!saveName.trim()) return
    const updated = [...savedPresets, { id: Date.now().toString(), name: saveName.trim(), config }]
    setSavedPresets(updated)
    persistPresets(updated)
    setSaveName('')
    setShowSaveInput(false)
  }

  // ── STYLE ─────────────────────────────────────────────────────
  if (tab === 'style') return (
    <div className="panel-stack">
      <ThumbDefs />
      <Group title="Preset" footer="Keys 1–7 switch presets.">
        <div className="cell">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {PRESETS.map((p, i) => (
              <button
                key={p.id} type="button" className="tile"
                aria-pressed={config.preset === p.id}
                aria-label={`${p.name} preset`} title={`${p.name} (${i + 1})`}
                onClick={() => onChange({ preset: p.id })}
                style={{ padding: '8px 4px 6px', gap: 5 }}
              >
                {/* Fixed-dark plate — the thumbnails mirror the (dark) cards, so
                    they stay legible in either app theme. */}
                <span style={{ width: '100%', height: 40, display: 'block', borderRadius: 8, background: '#1c1c1e', padding: 2 }}>{PRESET_SVG[p.id]}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: config.preset === p.id ? 'var(--tint)' : 'var(--text-2)' }}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      </Group>

      {(config.preset === 'glass' || config.preset === 'player') && (
      <Group title="Glass" footer="The material of this preset's glass panel.">
        <div className="cell">
          <Seg label="Glass tint" value={config.glassTint} onChange={v => onChange({ glassTint: v })}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'clear', label: 'Clear' },
            ]} />
          <GlassRange label="Frost" value={config.glassFrost} min={0} max={100} step={5}
            onChange={v => onChange({ glassFrost: v })} format={pct} />
        </div>
      </Group>
      )}

      <Group title="Background">
        <div className="cell">
          <Seg label="Background" value={config.bgStyle} onChange={v => onChange({ bgStyle: v })}
            options={[
              { value: 'blurred-art', label: 'Art' },
              { value: 'gradient', label: 'Gradient' },
              { value: 'solid', label: 'Solid' },
              { value: 'transparent', label: 'None' },
            ]} />
          {config.bgStyle === 'solid' && (
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
              <span style={{ fontSize: 15 }}>Colour</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono" style={{ fontSize: 13, color: 'var(--text-2)' }}>{config.bgColor.toUpperCase()}</span>
                <span style={{ position: 'relative', width: 30, height: 30, borderRadius: 999, background: config.bgColor, boxShadow: 'inset 0 0 0 0.5px var(--separator)' }}>
                  <input type="color" value={config.bgColor} aria-label="Background colour"
                    onChange={e => onChange({ bgColor: e.target.value })}
                    style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                </span>
              </span>
            </label>
          )}
          <GlassRange label="Art hue" value={config.tintHue} min={0} max={360} step={1}
            onChange={v => onChange({ tintHue: v })}
            format={v => (v === 0 ? 'Off' : `${v}°`)}
            fill={() => hueRGBA(config.tintHue)} />
        </div>
      </Group>

      <Group title="Looks">
        <div className="cell">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {STARTERS.map(st => (
              <button key={st.name} type="button" className="btn" data-variant="gray" data-size="sm"
                onClick={() => onChange(st.patch)}>{st.name}</button>
            ))}
          </div>
        </div>
        {savedPresets.map(p => (
          <div key={p.id} className="row">
            <button type="button" onClick={() => onChange(p.config)}
              style={{ flex: 1, minWidth: 0, textAlign: 'left', display: 'flex', alignItems: 'baseline', gap: 8, minHeight: 44 }}>
              <span style={{ fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
              <span className="caption" style={{ textTransform: 'capitalize' }}>{p.config.preset}</span>
            </button>
            <button type="button" className="icon-btn" aria-label={`Delete ${p.name}`}
              onClick={() => {
                const updated = savedPresets.filter(x => x.id !== p.id)
                setSavedPresets(updated)
                persistPresets(updated)
              }}
              style={{ color: 'var(--red)' }}>
              <Icon d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />
            </button>
          </div>
        ))}
        <div className="cell">
          {!showSaveInput ? (
            <button type="button" className="btn" data-variant="plain" style={{ alignSelf: 'flex-start', padding: 0 }}
              onClick={() => setShowSaveInput(true)}>Save current look…</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                autoFocus className="field" value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') savePreset()
                  if (e.key === 'Escape') { setSaveName(''); setShowSaveInput(false) }
                }}
                placeholder="Name" aria-label="Look name"
              />
              <button type="button" className="btn" data-variant="primary" onClick={savePreset} disabled={!saveName.trim()}>Save</button>
            </div>
          )}
        </div>
      </Group>
    </div>
  )

  // ── TEXT ──────────────────────────────────────────────────────
  if (tab === 'text') return (
    <div className="panel-stack">
      {lyrics}

      <Group title="Font">
        <div className="cell">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {FONTS.map(f => {
              const sel = config.font === f.value
              return (
                <button key={f.value} type="button" className="tile" aria-pressed={sel}
                  onClick={() => onChange({ font: f.value })}
                  style={{ height: 56, alignItems: 'flex-start', justifyContent: 'flex-end', padding: '0 10px 8px', overflow: 'hidden' }}>
                  <span style={{
                    fontFamily: FONT_CSS_VAR[f.value], fontSize: f.size * 0.82, fontWeight: f.weight, lineHeight: 1,
                    color: sel ? 'var(--tint)' : 'var(--text)',
                    letterSpacing: f.value === 'bebas' || f.value === 'oswald' ? '0.04em' : 0,
                    width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left',
                  }}>{f.label}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>{f.tag}</span>
                </button>
              )
            })}
          </div>
        </div>
      </Group>

      <Group title="Text">
        <div className="cell">
          <Seg label="Text colour" value={config.textColor} onChange={v => onChange({ textColor: v })}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'white', label: 'Light' },
              { value: 'black', label: 'Dark' },
            ]} />
          <Seg label="Alignment" value={config.textAlign} onChange={v => onChange({ textAlign: v })}
            options={[
              { value: 'left', label: <span style={{ width: 18, height: 18, display: 'block' }}><AlignLeftIcon /></span>, aria: 'Align left' },
              { value: 'center', label: <span style={{ width: 18, height: 18, display: 'block' }}><AlignCenterIcon /></span>, aria: 'Align centre' },
              { value: 'right', label: <span style={{ width: 18, height: 18, display: 'block' }}><AlignRightIcon /></span>, aria: 'Align right' },
            ]} />
        </div>
      </Group>

      {config.showLyrics && (
        <Group title="Lyric style">
          <div className="cell">
            <Seg label="Lyric style" value={config.lyricStyle} onChange={v => onChange({ lyricStyle: v })}
              options={[
                { value: 'italic', label: <i>Italic</i> },
                { value: 'plain', label: 'Plain' },
                { value: 'quoted', label: '“Quote”' },
              ]} />
            <GlassRange label="Lines" value={config.lyricLines} min={1} max={4} step={1}
              onChange={v => onChange({ lyricLines: v })} />
            <GlassRange label="Size" value={config.lyricScale} min={70} max={150} step={5}
              onChange={v => onChange({ lyricScale: v })} format={pct} />
          </div>
        </Group>
      )}
    </div>
  )

  // ── LAYOUT ────────────────────────────────────────────────────
  if (tab === 'layout') return (
    <div className="panel-stack">
      <Group title="Show">
        <ToggleRow icon={<IconImage />} label="Album art" value={config.showAlbumArt} onChange={v => onChange({ showAlbumArt: v })} />
        <ToggleRow icon={<IconText />} label="Title" value={config.showTitle} onChange={v => onChange({ showTitle: v })} />
        <ToggleRow icon={<IconUser />} label="Artist" value={config.showArtist} onChange={v => onChange({ showArtist: v })} />
        <ToggleRow icon={<IconCalendar />} label="Year" value={config.showYear} onChange={v => onChange({ showYear: v })} />
        <ToggleRow icon={<IconClock />} label="Duration" value={config.showDuration} onChange={v => onChange({ showDuration: v })} />
        <ToggleRow icon={<IconQuote />} label="Lyrics" value={config.showLyrics} onChange={v => onChange({ showLyrics: v })} />
      </Group>

      {(config.showAlbumArt || config.preset === 'glass') && (
        <Group title="Artwork" footer={config.showAlbumArt ? 'Reframe the cover when the centre crop cuts off the subject.' : undefined}>
          <div className="cell">
            {config.showAlbumArt && (
              <>
                <GlassRange label="Zoom" value={config.artZoom} min={100} max={200} step={5}
                  onChange={v => onChange({ artZoom: v })} format={pct} />
                <GlassRange label="Horizontal" value={config.artX} min={0} max={100} step={1}
                  onChange={v => onChange({ artX: v })} format={pct} />
                <GlassRange label="Vertical" value={config.artY} min={0} max={100} step={1}
                  onChange={v => onChange({ artY: v })} format={pct} />
              </>
            )}
            {config.preset === 'glass' && (
              <GlassRange label="Panel inset" value={config.artPadding} min={0} max={60} step={2}
                onChange={v => onChange({ artPadding: v })} format={v => `${v}px`} />
            )}
            {config.showAlbumArt && (
              <button type="button" className="btn" data-variant="plain" style={{ alignSelf: 'flex-start', padding: 0 }}
                onClick={() => onChange({ artZoom: 100, artX: 50, artY: 50 })}>Recentre</button>
            )}
          </div>
        </Group>
      )}

      <Group title="Export size" footer="The card is centred and framed to fit — never cropped.">
        <div className="cell">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {([
              { v: 'auto',   label: 'Auto',   hint: 'Padded' },
              { v: 'tight',  label: 'Tight',  hint: 'No pad' },
              { v: 'square', label: 'Square', hint: '1:1' },
              { v: 'story',  label: 'Story',  hint: '9:16' },
              { v: 'wide',   label: 'Wide',   hint: '16:9' },
            ] as const).map(o => {
              const sel = config.exportSize === o.v
              return (
                <button key={o.v} type="button" className="tile" aria-pressed={sel}
                  onClick={() => onChange({ exportSize: o.v })}
                  style={{ padding: '8px 6px', gap: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: sel ? 'var(--tint)' : 'var(--text)' }}>{o.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{o.hint}</span>
                </button>
              )
            })}
          </div>
        </div>
      </Group>
    </div>
  )

  // ── EFFECTS ───────────────────────────────────────────────────
  const effects: {
    icon: React.ReactNode; label: string; on: keyof CardConfig; amt: keyof CardConfig
    min: number; max: number; amtLabel: string
  }[] = [
    { icon: <IconGlow />,      label: 'Ambient glow', on: 'glowEnabled',      amt: 'glowStrength',     min: 10, max: 100, amtLabel: 'Intensity' },
    { icon: <IconGrain />,     label: 'Film grain',   on: 'grainEnabled',     amt: 'grainOpacity',     min: 5,  max: 60,  amtLabel: 'Opacity' },
    { icon: <IconVignette />,  label: 'Vignette',     on: 'vignetteEnabled',  amt: 'vignetteStrength', min: 10, max: 100, amtLabel: 'Strength' },
    { icon: <IconScanlines />, label: 'Scanlines',    on: 'scanlinesEnabled', amt: 'scanlinesOpacity', min: 5,  max: 60,  amtLabel: 'Opacity' },
    { icon: <IconHolo />,      label: 'Holo shimmer', on: 'holoEnabled',      amt: 'holoOpacity',      min: 5,  max: 80,  amtLabel: 'Intensity' },
  ]
  return (
    <div className="panel-stack">
      <Group title="Effects" footer="Effects render in the preview and in exported images.">
        {effects.map(fx => (
          <React.Fragment key={fx.label}>
            <ToggleRow icon={fx.icon} label={fx.label} value={config[fx.on] as boolean}
              onChange={v => onChange({ [fx.on]: v } as Partial<CardConfig>)} />
            {(config[fx.on] as boolean) && (
              <div className="cell attached" style={{ paddingTop: 0 }}>
                <GlassRange label={fx.amtLabel} value={config[fx.amt] as number} min={fx.min} max={fx.max} step={5}
                  onChange={v => onChange({ [fx.amt]: v } as Partial<CardConfig>)} format={pct} />
              </div>
            )}
          </React.Fragment>
        ))}
      </Group>
    </div>
  )
}
