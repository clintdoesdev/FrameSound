'use client'

import React, { useState } from 'react'
import { CardConfig } from '@/types'

type Props = {
  config: CardConfig
  onChange: (updates: Partial<CardConfig>) => void
  accentColor?: string | null
}

// ── Icons ──────────────────────────────────────────────────────
const IconImage = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="1.5" width="13" height="13" rx="2"/><circle cx="5.5" cy="5.5" r="1"/><path d="m14.5 10-4-4L2 14.5"/>
  </svg>
)
const IconText = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
    <path d="M2 3h12v2H9v8H7V5H2z"/>
  </svg>
)
const IconUser = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/>
  </svg>
)
const IconCalendar = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="2.5" width="13" height="12" rx="2"/><path d="M5 1v3M11 1v3M1.5 7h13"/>
  </svg>
)
const IconClock = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5"/><path d="M8 4.5v4l2 2"/>
  </svg>
)
const IconQuote = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
    <path d="M1 3h5v5H3c0 2 1 3 3 3v2C2 13 1 10 1 7V3zM9 3h5v5h-3c0 2 1 3 3 3v2c-4 0-5-3-5-6V3z"/>
  </svg>
)
const IconLayers = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m8 1.5 6.5 3.5-6.5 3.5L1.5 5 8 1.5z"/><path d="M1.5 9 8 12.5 14.5 9"/><path d="M1.5 12.5 8 16l6.5-3.5"/>
  </svg>
)
const IconBg = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5"/><path d="M8 1.5a5 5 0 0 0 5 5"/>
  </svg>
)
const IconType = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4V2h12v2M7 14h2M8 2v12"/>
  </svg>
)
const IconGeometry = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="1.5" width="13" height="13" rx="2"/>
    <path d="M6 1.5v13M1.5 6h13"/>
  </svg>
)
const IconEye = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
  </svg>
)
const AlignLeftIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <rect x="1" y="3" width="14" height="1.5" rx="0.75"/>
    <rect x="1" y="7" width="9" height="1.5" rx="0.75"/>
    <rect x="1" y="11" width="12" height="1.5" rx="0.75"/>
  </svg>
)
const AlignCenterIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <rect x="1" y="3" width="14" height="1.5" rx="0.75"/>
    <rect x="3.5" y="7" width="9" height="1.5" rx="0.75"/>
    <rect x="2" y="11" width="12" height="1.5" rx="0.75"/>
  </svg>
)
const AlignRightIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
    <rect x="1" y="3" width="14" height="1.5" rx="0.75"/>
    <rect x="6" y="7" width="9" height="1.5" rx="0.75"/>
    <rect x="3" y="11" width="12" height="1.5" rx="0.75"/>
  </svg>
)

// ── Preset SVG illustrations ───────────────────────────────────
const PresetGlassSVG = () => (
  <svg viewBox="0 0 60 45" width="60" height="45" fill="none">
    <rect x="15" y="6" width="30" height="23" rx="3" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8"/>
    <rect x="20" y="10" width="20" height="14" rx="2" fill="rgba(255,255,255,0.18)"/>
    <rect x="20" y="27" width="20" height="2" rx="1" fill="rgba(255,255,255,0.5)"/>
    <rect x="22" y="31" width="16" height="1.5" rx="0.75" fill="rgba(255,255,255,0.25)"/>
    <rect x="24" y="34" width="12" height="1.5" rx="0.75" fill="rgba(255,255,255,0.18)"/>
  </svg>
)
const PresetPosterSVG = () => (
  <svg viewBox="0 0 60 45" width="60" height="45" fill="none">
    <rect x="8" y="4" width="44" height="37" rx="3" fill="rgba(255,255,255,0.10)"/>
    <rect x="8" y="26" width="44" height="15" rx="0" fill="url(#pg)"/>
    <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(0,0,0,0)"/><stop offset="100%" stopColor="rgba(0,0,0,0.8)"/></linearGradient></defs>
    <rect x="13" y="30" width="22" height="2" rx="1" fill="rgba(255,255,255,0.9)"/>
    <rect x="13" y="34" width="16" height="1.5" rx="0.75" fill="rgba(255,255,255,0.5)"/>
    <rect x="13" y="37.5" width="10" height="1.2" rx="0.6" fill="rgba(255,255,255,0.3)"/>
  </svg>
)
const PresetMinimalSVG = () => (
  <svg viewBox="0 0 60 45" width="60" height="45" fill="none">
    <rect x="8" y="8" width="44" height="29" rx="3" fill="rgba(255,255,255,0.06)"/>
    <rect x="8" y="8" width="20" height="29" rx="3" fill="rgba(255,255,255,0.18)"/>
    <rect x="32" y="16" width="16" height="2" rx="1" fill="rgba(255,255,255,0.7)"/>
    <rect x="32" y="20.5" width="12" height="1.5" rx="0.75" fill="rgba(255,255,255,0.4)"/>
    <rect x="32" y="25" width="10" height="1.2" rx="0.6" fill="rgba(255,255,255,0.25)"/>
  </svg>
)
const PresetStorySVG = () => (
  <svg viewBox="0 0 60 45" width="60" height="45" fill="none">
    <rect x="20" y="3" width="20" height="39" rx="3" fill="rgba(255,255,255,0.10)"/>
    <rect x="24" y="8" width="12" height="12" rx="2" fill="rgba(255,255,255,0.25)"/>
    <rect x="22" y="24" width="16" height="2" rx="1" fill="rgba(255,255,255,0.7)"/>
    <rect x="23" y="28" width="14" height="1.5" rx="0.75" fill="rgba(255,255,255,0.35)"/>
    <rect x="25" y="31.5" width="10" height="1.2" rx="0.6" fill="rgba(255,255,255,0.2)"/>
  </svg>
)
const PresetSquareSVG = () => (
  <svg viewBox="0 0 60 45" width="60" height="45" fill="none">
    <rect x="12" y="5" width="36" height="35" rx="3" fill="rgba(255,255,255,0.08)"/>
    <rect x="20" y="10" width="20" height="14" rx="2" fill="rgba(255,255,255,0.22)"/>
    <rect x="17" y="27" width="18" height="2" rx="1" fill="rgba(255,255,255,0.7)"/>
    <rect x="17" y="31" width="14" height="1.5" rx="0.75" fill="rgba(255,255,255,0.35)"/>
    <rect x="17" y="34.5" width="10" height="1.2" rx="0.6" fill="rgba(255,255,255,0.2)"/>
  </svg>
)

const PRESET_SVG: Record<string, React.ReactNode> = {
  glass: <PresetGlassSVG />,
  poster: <PresetPosterSVG />,
  minimal: <PresetMinimalSVG />,
  story: <PresetStorySVG />,
  square: <PresetSquareSVG />,
}

// ── Font map for rendering pills in their own typeface ─────────
const FONT_CSS_VAR: Record<CardConfig['font'], string> = {
  syne: 'var(--font-syne)',
  'dm-serif': 'var(--font-dm-serif)',
  playfair: 'var(--font-playfair)',
  bebas: 'var(--font-bebas)',
  instrument: 'var(--font-instrument)',
}

// ── Section accordion ──────────────────────────────────────────
function Section({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', border: 0, background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '13px 16px 12px',
          borderBottom: open ? '1px solid rgba(255,255,255,0.05)' : 'none',
          color: 'rgba(255,255,255,0.25)',
        }}
      >
        <span style={{ display: 'flex', color: 'rgba(255,255,255,0.25)' }}>{icon}</span>
        <span style={{
          flex: 1, textAlign: 'left',
          fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
        }}>
          {label}
        </span>
        <svg viewBox="0 0 10 10" width="9" height="9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round">
          <path d={open ? 'm2 3.5 3 3 3-3' : 'm2 6.5 3-3 3 3'} />
        </svg>
      </button>
      <div style={{
        overflow: 'hidden',
        maxHeight: open ? 9999 : 0,
        transition: 'max-height 300ms ease',
      }}>
        <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Pill toggle row (bgStyle / textColor) ──────────────────────
function PillRow<T extends string>({ value, options, onChange, accent }: {
  value: T
  options: { value: T; label: React.ReactNode }[]
  onChange: (v: T) => void
  accent?: string
}) {
  const accentRgb = accent ?? 'var(--accent)'
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map((o, i) => {
        const selected = value === o.value
        return (
          <button key={i} onClick={() => onChange(o.value)} style={{
            flex: 1, height: 36, borderRadius: 999, border: 0, cursor: 'pointer',
            fontSize: 12, fontWeight: 500,
            background: selected ? (accent ? `${accent}33` : 'var(--accent-quiet)') : '#1a1a1a',
            color: selected ? (accent ?? 'var(--accent)') : 'rgba(255,255,255,0.5)',
            outline: selected ? `1px solid ${accentRgb}` : '1px solid rgba(255,255,255,0.08)',
            transition: 'all 120ms',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>{o.label}</button>
        )
      })}
    </div>
  )
}

// ── Slider with styled track ───────────────────────────────────
function StyledSlider({ value, min, max, step, onChange, trackStyle, label }: {
  value: number; min: number; max: number; step: number
  onChange: (v: number) => void
  trackStyle?: React.CSSProperties
  label: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{value}{label.includes('Hue') ? '°' : 'px'}</span>
      </div>
      <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute', inset: 0, top: '50%', transform: 'translateY(-50%)',
          height: 6, borderRadius: 3,
          background: trackStyle?.background ?? `linear-gradient(to right, #1a1a1a, rgba(255,255,255,0.25))`,
          ...trackStyle,
        }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'relative', width: '100%', height: 24,
            appearance: 'none', WebkitAppearance: 'none',
            background: 'transparent', cursor: 'pointer', zIndex: 1,
          }}
        />
        <style>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px; height: 16px; border-radius: 50%;
            background: #fff;
            box-shadow: 0 0 0 3px #000, 0 1px 4px rgba(0,0,0,0.6);
            cursor: pointer;
          }
          input[type=range]::-moz-range-thumb {
            width: 16px; height: 16px; border-radius: 50%;
            background: #fff; border: none;
            box-shadow: 0 0 0 3px #000, 0 1px 4px rgba(0,0,0,0.6);
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  )
}

// ── Toggle pill (visibility) ───────────────────────────────────
function ToggleItem({ label, value, onChange, icon, accent }: {
  label: string; value: boolean; onChange: (v: boolean) => void
  icon: React.ReactNode; accent?: string
}) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        height: 40, padding: '0 10px',
        borderRadius: 8, cursor: 'pointer',
        background: value ? (accent ? `${accent}26` : 'var(--accent-quiet)') : 'transparent',
        borderLeft: value ? `2px solid ${accent ?? 'var(--accent)'}` : '2px solid transparent',
        transition: 'all 150ms',
      }}
    >
      <span style={{ color: value ? (accent ?? 'var(--accent)') : 'rgba(255,255,255,0.3)', display: 'flex', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 12, color: value ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)' }}>{label}</span>
      <div style={{
        width: 36, height: 20, borderRadius: 999, flexShrink: 0,
        background: value ? (accent ? `${accent}99` : 'var(--accent)') : '#2a2a2a',
        position: 'relative', transition: 'background 150ms',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: value ? 18 : 3,
          width: 14, height: 14, borderRadius: '50%',
          background: value ? '#fff' : 'rgba(255,255,255,0.5)',
          transition: 'left 150ms',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
          display: 'block',
        }} />
      </div>
    </div>
  )
}

const PRESETS = [
  { id: 'glass',   name: 'Glass'   },
  { id: 'poster',  name: 'Poster'  },
  { id: 'minimal', name: 'Minimal' },
  { id: 'story',   name: 'Story'   },
  { id: 'square',  name: 'Square'  },
] as const

const FONTS: { value: CardConfig['font']; label: string }[] = [
  { value: 'syne',       label: 'Syne'       },
  { value: 'dm-serif',   label: 'DM Serif'   },
  { value: 'playfair',   label: 'Playfair'   },
  { value: 'bebas',      label: 'Bebas'      },
  { value: 'instrument', label: 'Instrument' },
]

const HUE_GRADIENT = 'linear-gradient(to right, hsl(0,80%,50%), hsl(45,80%,50%), hsl(90,80%,50%), hsl(135,80%,50%), hsl(180,80%,50%), hsl(225,80%,50%), hsl(270,80%,50%), hsl(315,80%,50%), hsl(360,80%,50%))'

export default function CustomizePanel({ config, onChange, accentColor }: Props) {
  const ac = accentColor ?? undefined

  return (
    <div style={{ background: '#0d0d0d', flex: 1 }}>

      {/* ── PRESET ── */}
      <Section icon={<IconLayers />} label="Preset">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {PRESETS.map(p => {
            const sel = config.preset === p.id
            return (
              <button
                key={p.id}
                onClick={() => onChange({ preset: p.id })}
                style={{
                  background: sel ? (ac ? `${ac}26` : 'var(--accent-quiet)') : '#1a1a1a',
                  border: `1.5px solid ${sel ? (ac ?? 'var(--accent)') : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 10, cursor: 'pointer', padding: '10px 8px 8px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  transition: 'border-color 120ms, background 120ms',
                  minHeight: 90,
                }}
              >
                <div style={{ opacity: sel ? 1 : 0.6, transition: 'opacity 120ms' }}>
                  {PRESET_SVG[p.id]}
                </div>
                <span style={{
                  fontFamily: 'var(--font-syne)', fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: sel ? (ac ?? 'var(--accent)') : 'rgba(255,255,255,0.55)',
                }}>{p.name}</span>
              </button>
            )
          })}
        </div>
      </Section>

      {/* ── BACKGROUND ── */}
      <Section icon={<IconBg />} label="Background">
        <PillRow
          value={config.bgStyle}
          onChange={v => onChange({ bgStyle: v })}
          accent={ac}
          options={[
            { value: 'blurred-art', label: 'Blurred' },
            { value: 'gradient',    label: 'Grad' },
            { value: 'solid',       label: 'Solid' },
            { value: 'transparent', label: 'None' },
          ]}
        />

        {config.bgStyle === 'solid' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: config.bgColor,
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
                overflow: 'hidden',
              }}>
                <input
                  type="color" value={config.bgColor}
                  onChange={e => onChange({ bgColor: e.target.value })}
                  style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
              </div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{config.bgColor.toUpperCase()}</span>
          </div>
        )}

        <StyledSlider
          value={config.tintHue} min={0} max={360} step={1}
          onChange={v => onChange({ tintHue: v })}
          trackStyle={{ background: HUE_GRADIENT }}
          label="Tint Hue"
        />
      </Section>

      {/* ── TYPOGRAPHY ── */}
      <Section icon={<IconType />} label="Typography">
        {/* Font pills — scrollable row, each in its own face */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {FONTS.map(f => {
            const sel = config.font === f.value
            return (
              <button key={f.value} onClick={() => onChange({ font: f.value })} style={{
                flexShrink: 0, width: 80, height: 36, borderRadius: 999,
                border: `1.5px solid ${sel ? (ac ?? 'var(--accent)') : 'rgba(255,255,255,0.10)'}`,
                background: sel ? (ac ? `${ac}26` : 'var(--accent-quiet)') : '#1a1a1a',
                fontFamily: FONT_CSS_VAR[f.value],
                fontSize: f.value === 'bebas' ? 15 : 12,
                fontWeight: f.value === 'bebas' ? 400 : 600,
                color: sel ? (ac ?? 'var(--accent)') : 'rgba(255,255,255,0.55)',
                cursor: 'pointer', transition: 'all 120ms',
              }}>{f.label}</button>
            )
          })}
        </div>

        {/* Text color */}
        <PillRow
          value={config.textColor}
          onChange={v => onChange({ textColor: v })}
          accent={ac}
          options={[
            { value: 'white', label: 'Light' },
            { value: 'black', label: 'Dark' },
            { value: 'auto',  label: 'Auto' },
          ]}
        />

        {/* Text align */}
        <div style={{ display: 'flex', gap: 6 }}>
          {([
            { value: 'left'   as const, icon: <AlignLeftIcon /> },
            { value: 'center' as const, icon: <AlignCenterIcon /> },
            { value: 'right'  as const, icon: <AlignRightIcon /> },
          ]).map(o => {
            const sel = config.textAlign === o.value
            return (
              <button key={o.value} onClick={() => onChange({ textAlign: o.value })} style={{
                width: 40, height: 40, borderRadius: 8, border: 0, cursor: 'pointer',
                background: sel ? (ac ? `${ac}33` : 'var(--accent-quiet)') : '#1a1a1a',
                color: sel ? (ac ?? 'var(--accent)') : 'rgba(255,255,255,0.4)',
                outline: sel ? `1.5px solid ${ac ?? 'var(--accent)'}` : '1.5px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 120ms',
              }}>{o.icon}</button>
            )
          })}
        </div>
      </Section>

      {/* ── GEOMETRY ── */}
      <Section icon={<IconGeometry />} label="Geometry">
        {/* Canvas size with aspect-ratio SVG pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
          {([
            { s: '1:1'  as const, w: 16, h: 16 },
            { s: '16:9' as const, w: 20, h: 11 },
            { s: '4:5'  as const, w: 14, h: 17 },
            { s: '9:16' as const, w: 10, h: 18 },
          ]).map(({ s, w, h }) => {
            const sel = config.size === s
            return (
              <button key={s} onClick={() => onChange({ size: s })} style={{
                height: 52, borderRadius: 10,
                background: sel ? (ac ? `${ac}26` : 'var(--accent-quiet)') : '#1a1a1a',
                border: `1.5px solid ${sel ? (ac ?? 'var(--accent)') : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer', transition: 'all 120ms',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}>
                <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
                  <rect x="0.75" y="0.75" width={w - 1.5} height={h - 1.5} rx="1.5"
                    fill={sel ? (ac ? `${ac}40` : 'rgba(100,120,255,0.3)') : 'rgba(255,255,255,0.12)'}
                    stroke={sel ? (ac ?? 'var(--accent)') : 'rgba(255,255,255,0.35)'} strokeWidth="1.5"
                  />
                </svg>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: sel ? (ac ?? 'var(--accent)') : 'rgba(255,255,255,0.4)' }}>{s}</span>
              </button>
            )
          })}
        </div>

        <StyledSlider
          value={config.padding} min={8} max={64} step={4}
          onChange={v => onChange({ padding: v })}
          label="Padding"
        />
        <StyledSlider
          value={config.borderRadius} min={0} max={48} step={4}
          onChange={v => onChange({ borderRadius: v })}
          label="Radius"
        />
      </Section>

      {/* ── VISIBILITY ── */}
      <Section icon={<IconEye />} label="Visibility">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <ToggleItem icon={<IconImage />}    label="Album art"  value={config.showAlbumArt} onChange={v => onChange({ showAlbumArt: v })} accent={ac} />
          <ToggleItem icon={<IconText />}     label="Title"      value={config.showTitle}    onChange={v => onChange({ showTitle: v })}    accent={ac} />
          <ToggleItem icon={<IconUser />}     label="Artist"     value={config.showArtist}   onChange={v => onChange({ showArtist: v })}   accent={ac} />
          <ToggleItem icon={<IconCalendar />} label="Year"       value={config.showYear}     onChange={v => onChange({ showYear: v })}     accent={ac} />
          <ToggleItem icon={<IconClock />}    label="Duration"   value={config.showDuration} onChange={v => onChange({ showDuration: v })} accent={ac} />
          <ToggleItem icon={<IconQuote />}    label="Lyrics"     value={config.showLyrics}   onChange={v => onChange({ showLyrics: v })}   accent={ac} />
        </div>
      </Section>

    </div>
  )
}
