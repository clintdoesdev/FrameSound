'use client'

import React, { useState } from 'react'
import { CardConfig } from '@/types'

type SavedPreset = { id: string; name: string; config: CardConfig }

const STORAGE_KEY = 'framesound-saved-presets'
function loadSavedPresets(): SavedPreset[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedPreset[]) : []
  } catch { return [] }
}
function persistPresets(list: SavedPreset[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch { /* quota error */ }
}

type Props = {
  config: CardConfig
  onChange: (updates: Partial<CardConfig>) => void
  accentColor?: string | null
}

// Returns accent as a text-safe color. If the extracted album color is too dark
// to read against a translucent glass panel, fall back to the CSS default.
function textAccent(hex: string | null | undefined): string {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return 'var(--accent)'
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  const lum = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  return lum >= 0.18 ? hex : 'var(--accent)'
}

// ── Icons ──────────────────────────────────────────────────────
const IconBookmark = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 2h12v13l-6-4-6 4z"/>
  </svg>
)
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
const IconEye = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
  </svg>
)
const IconBeaker = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 1h4"/><path d="M7.5 1v5.2L3.2 13.5A1 1 0 0 0 4.1 15h7.8a1 1 0 0 0 .9-1.5L8.5 6.2V1"/>
    <path d="M4.5 11h7" opacity="0.4"/>
  </svg>
)
const IconGlow = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="2.5" fill="currentColor" opacity="0.4"/>
    <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M11.5 4.5l1.4-1.4M3.1 12.9l1.4-1.4"/>
  </svg>
)
const IconVignette = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
    <defs><radialGradient id="vg" cx="50%" cy="50%" r="50%"><stop offset="30%" stopColor="currentColor" stopOpacity="0"/><stop offset="100%" stopColor="currentColor" stopOpacity="0.9"/></radialGradient></defs>
    <rect x="1" y="1" width="14" height="14" rx="2" fill="url(#vg)"/>
    <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5"/>
  </svg>
)
const IconScanlines = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
    <rect x="1" y="2"  width="14" height="1.2" rx="0.6" opacity="0.9"/>
    <rect x="1" y="5"  width="14" height="1.2" rx="0.6" opacity="0.7"/>
    <rect x="1" y="8"  width="14" height="1.2" rx="0.6" opacity="0.9"/>
    <rect x="1" y="11" width="14" height="1.2" rx="0.6" opacity="0.7"/>
    <rect x="1" y="14" width="14" height="1.2" rx="0.6" opacity="0.9"/>
  </svg>
)
const IconHolo = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none">
    <rect x="1" y="1" width="14" height="14" rx="2" fill="url(#hg)"/>
    <defs>
      <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%"   stopColor="#f0f" stopOpacity="0.7"/>
        <stop offset="33%"  stopColor="#0ff" stopOpacity="0.7"/>
        <stop offset="66%"  stopColor="#0f0" stopOpacity="0.6"/>
        <stop offset="100%" stopColor="#ff0" stopOpacity="0.7"/>
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.3"/>
  </svg>
)
const IconGrain = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor">
    <circle cx="3" cy="3" r="1" opacity="0.8"/>
    <circle cx="8" cy="2" r="0.8" opacity="0.5"/>
    <circle cx="13" cy="4" r="1" opacity="0.7"/>
    <circle cx="5" cy="7" r="0.8" opacity="0.6"/>
    <circle cx="11" cy="7" r="1" opacity="0.9"/>
    <circle cx="2" cy="11" r="0.8" opacity="0.5"/>
    <circle cx="7" cy="12" r="1" opacity="0.7"/>
    <circle cx="13" cy="11" r="0.8" opacity="0.6"/>
    <circle cx="9" cy="5" r="0.6" opacity="0.4"/>
    <circle cx="4" cy="14" r="0.8" opacity="0.7"/>
    <circle cx="14" cy="14" r="1" opacity="0.5"/>
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

// ── Preset thumbnails ──────────────────────────────────────────
// Each is a miniature of the card it selects, drawn on a fixed dark plate
// (the exported card is always dark, regardless of the app's theme).
const TB = { w: 44, h: 36 }
const Plate = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 44 36" width={TB.w} height={TB.h} fill="none">{children}</svg>
)

const PresetGlassSVG = () => (
  <Plate>
    <rect x="6" y="1" width="32" height="34" rx="4.5" fill="rgba(255,255,255,0.22)"/>
    <rect x="9" y="22" width="26" height="10" rx="4" fill="rgba(255,255,255,0.32)" stroke="rgba(255,255,255,0.6)" strokeWidth="0.6"/>
    <rect x="12" y="25" width="12" height="1.7" rx="0.85" fill="rgba(255,255,255,0.9)"/>
    <rect x="12" y="28.5" width="8" height="1.2" rx="0.6" fill="rgba(255,255,255,0.5)"/>
  </Plate>
)
const PresetTicketSVG = () => (
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
)
const PresetTagSVG = () => (
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
)
const PresetProfileSVG = () => (
  <Plate>
    <rect x="4" y="1" width="36" height="34" rx="5" fill="rgba(255,255,255,0.07)"/>
    <rect x="7" y="4" width="30" height="16" rx="3.5" fill="rgba(255,255,255,0.28)"/>
    <rect x="8" y="15" width="9" height="9" rx="2.5" fill="rgba(255,255,255,0.55)" stroke="#1c1c1e" strokeWidth="1.2"/>
    <rect x="19" y="17.5" width="11" height="1.7" rx="0.85" fill="rgba(255,255,255,0.7)"/>
    <rect x="19" y="20.8" width="7" height="1.2" rx="0.6" fill="rgba(255,255,255,0.35)"/>
    <rect x="8" y="27" width="20" height="1.4" rx="0.7" fill="rgba(255,255,255,0.28)"/>
    <rect x="8" y="30.3" width="14" height="1.4" rx="0.7" fill="rgba(255,255,255,0.18)"/>
  </Plate>
)
const PresetPlayerSVG = () => (
  <Plate>
    <rect x="1" y="1" width="42" height="34" rx="5" fill="rgba(255,255,255,0.07)"/>
    <rect x="8" y="4" width="28" height="28" rx="6" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.26)" strokeWidth="0.7"/>
    <circle cx="12.5" cy="8.5" r="2.2" fill="rgba(255,255,255,0.4)"/>
    <rect x="16.5" y="7.3" width="9" height="1.3" rx="0.65" fill="rgba(255,255,255,0.6)"/>
    <rect x="10.5" y="12" width="23" height="12" rx="3" fill="rgba(255,255,255,0.3)"/>
    <rect x="10.5" y="26" width="23" height="1.2" rx="0.6" fill="rgba(255,255,255,0.3)"/>
    <circle cx="17" cy="30" r="1.8" fill="rgba(255,255,255,0.35)"/>
    <circle cx="22" cy="30" r="2.4" fill="rgba(255,255,255,0.75)"/>
    <circle cx="27" cy="30" r="1.8" fill="rgba(255,255,255,0.35)"/>
  </Plate>
)
const PresetBezelSVG = () => (
  <Plate>
    <rect x="6" y="1" width="32" height="34" rx="5" fill="rgba(255,255,255,0.13)" stroke="rgba(255,255,255,0.34)" strokeWidth="0.7"/>
    <rect x="9.5" y="4" width="25" height="19" rx="3.5" fill="rgba(255,255,255,0.42)"/>
    <rect x="9.5" y="26" width="15" height="2.2" rx="1.1" fill="rgba(255,255,255,0.85)"/>
    <rect x="9.5" y="30" width="10" height="1.5" rx="0.75" fill="rgba(255,255,255,0.42)"/>
  </Plate>
)
const PresetBloomSVG = () => (
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
)

const PRESET_SVG: Record<string, React.ReactNode> = {
  glass:   <PresetGlassSVG />,
  bezel:   <PresetBezelSVG />,
  bloom:   <PresetBloomSVG />,
  ticket:  <PresetTicketSVG />,
  tag:     <PresetTagSVG />,
  profile: <PresetProfileSVG />,
  player:  <PresetPlayerSVG />,
}

// ── Font map for rendering cards in their own typeface ─────────
const FONT_CSS_VAR: Record<CardConfig['font'], string> = {
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

// ── Section — solid widget card with a circular icon badge ──────
// Deliberately opaque rather than glass: the accent is sampled from album art,
// and tinting every large surface with it turned the whole panel muddy.
function Section({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div style={{
      borderRadius: 16, margin: '0 8px 8px',
      background: 'var(--panel)', border: '1px solid var(--panel-line)',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', border: 0, background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px',
        }}
      >
        <span style={{
          width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
          background: 'var(--panel-badge)', color: 'var(--fg-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</span>
        <span style={{
          flex: 1, textAlign: 'left', fontSize: 11.5, fontWeight: 600,
          letterSpacing: '0.02em', color: 'var(--fg-1)',
        }}>
          {label}
        </span>
        <svg viewBox="0 0 10 10" width="9" height="9" fill="none" stroke="var(--fg-3)" strokeWidth="1.6" strokeLinecap="round"
          style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 200ms' }}>
          <path d="m2 3.5 3 3 3-3" />
        </svg>
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? 9999 : 0, transition: 'max-height 300ms ease' }}>
        <div style={{ padding: '2px 12px 13px', display: 'flex', flexDirection: 'column', gap: 13 }}>
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
  return (
    <div style={{ display: 'flex', gap: 4, background: 'var(--panel-well)', borderRadius: 999, padding: 3 }}>
      {options.map((o, i) => {
        const selected = value === o.value
        return (
          <button key={i} onClick={() => onChange(o.value)} style={{
            flex: 1, height: 28, borderRadius: 999, border: 0, cursor: 'pointer',
            fontSize: 11.5, fontWeight: 600,
            background: selected ? (accent ?? 'var(--accent)') : 'transparent',
            color: selected ? '#0d0d0f' : 'var(--fg-2)',
            transition: 'background 130ms, color 130ms',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}>{o.label}</button>
        )
      })}
    </div>
  )
}

// ── Slider with styled track ───────────────────────────────────
function StyledSlider({ value, min, max, step, onChange, trackStyle, label, suffix }: {
  value: number; min: number; max: number; step: number
  onChange: (v: number) => void
  trackStyle?: React.CSSProperties
  label: string
  suffix?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11.5, color: 'var(--fg-2)' }}>{label}</span>
        <span className="tnum" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--fg-1)' }}>{value}{suffix ?? (label.includes('Hue') ? '°' : 'px')}</span>
      </div>
      <div style={{ position: 'relative', height: 18, display: 'flex', alignItems: 'center' }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%', transform: 'translateY(-50%)',
          height: 4, borderRadius: 2,
          background: trackStyle?.background ?? 'var(--panel-well-2)',
          ...trackStyle,
        }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'relative', width: '100%', height: 18,
            appearance: 'none', WebkitAppearance: 'none',
            background: 'transparent', cursor: 'pointer', zIndex: 1,
          }}
        />
        <style>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 13px; height: 13px; border-radius: 50%;
            background: #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.45);
            cursor: pointer;
          }
          input[type=range]::-moz-range-thumb {
            width: 13px; height: 13px; border-radius: 50%;
            background: #fff; border: none;
            box-shadow: 0 1px 4px rgba(0,0,0,0.45);
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
        display: 'flex', alignItems: 'center', gap: 7,
        height: 32, padding: '0 8px',
        borderRadius: 9, cursor: 'pointer',
        background: 'var(--panel-well)',
        transition: 'background 150ms',
      }}
    >
      <span style={{ color: value ? (accent ?? 'var(--accent)') : 'var(--fg-3)', display: 'flex', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 11.5, color: value ? 'var(--fg)' : 'var(--fg-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
      <div style={{
        width: 28, height: 16, borderRadius: 999, flexShrink: 0,
        background: value ? (accent ?? 'var(--accent)') : 'var(--panel-well-2)',
        position: 'relative', transition: 'background 150ms',
      }}>
        <span style={{
          position: 'absolute', top: 2.5, left: value ? 14 : 2.5,
          width: 11, height: 11, borderRadius: '50%',
          background: '#fff',
          transition: 'left 150ms',
          boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
          display: 'block',
        }} />
      </div>
    </div>
  )
}

const PRESETS = [
  { id: 'glass',   name: 'Glass'   },
  { id: 'bezel',   name: 'Bezel'   },
  { id: 'bloom',   name: 'Bloom'   },
  { id: 'ticket',  name: 'Ticket'  },
  { id: 'tag',     name: 'Tag'     },
  { id: 'profile', name: 'Profile' },
  { id: 'player',  name: 'Player'  },
] as const

const FONTS: { value: CardConfig['font']; label: string; tag: string; weight: number; size: number }[] = [
  { value: 'poppins',          label: 'Poppins',      tag: 'Modern',     weight: 600, size: 17 },
  { value: 'space-grotesk',    label: 'Space Grotesk',tag: 'Modern',     weight: 600, size: 16 },
  { value: 'raleway',          label: 'Raleway',      tag: 'Elegant',    weight: 300, size: 18 },
  { value: 'oswald',           label: 'Oswald',       tag: 'Condensed',  weight: 500, size: 18 },
  { value: 'bebas',            label: 'Bebas Neue',   tag: 'Display',    weight: 400, size: 22 },
  { value: 'playfair',         label: 'Playfair',     tag: 'Serif',      weight: 700, size: 17 },
  { value: 'dm-serif',         label: 'DM Serif',     tag: 'Serif',      weight: 400, size: 18 },
  { value: 'cormorant',        label: 'Cormorant',    tag: 'Luxury',     weight: 600, size: 20 },
  { value: 'instrument',       label: 'Instrument',   tag: 'Italic',     weight: 400, size: 18 },
]

const HUE_GRADIENT = 'linear-gradient(to right, hsl(0,80%,50%), hsl(45,80%,50%), hsl(90,80%,50%), hsl(135,80%,50%), hsl(180,80%,50%), hsl(225,80%,50%), hsl(270,80%,50%), hsl(315,80%,50%), hsl(360,80%,50%))'

export default function CustomizePanel({ config, onChange, accentColor }: Props) {
  const act = textAccent(accentColor)          // luminance-checked — safe for text/border

  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>(() => loadSavedPresets())
  const [saveName, setSaveName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  return (
    <div style={{ flex: 1 }}>

      {/* ── SAVED PRESETS ── */}
      <Section icon={<IconBookmark />} label="Saved Presets">
        {/* Save current config */}
        {!showSaveInput ? (
          <button
            onClick={() => setShowSaveInput(true)}
            style={{
              width: '100%', height: 32, borderRadius: 9, border: '1px dashed var(--panel-well-2)',
              background: 'transparent', cursor: 'pointer',
              fontSize: 12, color: 'var(--fg-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            + Save current preset
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              autoFocus
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && saveName.trim()) {
                  const newPreset: SavedPreset = { id: Date.now().toString(), name: saveName.trim(), config }
                  const updated = [...savedPresets, newPreset]
                  setSavedPresets(updated)
                  persistPresets(updated)
                  setSaveName('')
                  setShowSaveInput(false)
                }
                if (e.key === 'Escape') { setSaveName(''); setShowSaveInput(false) }
              }}
              placeholder="Preset name…"
              style={{
                flex: 1, height: 32, borderRadius: 8, border: 0,
                background: 'var(--panel-well)', color: 'var(--fg)', fontSize: 12, padding: '0 10px',
                outline: 'none',
              }}
            />
            <button
              onClick={() => {
                if (!saveName.trim()) return
                const newPreset: SavedPreset = { id: Date.now().toString(), name: saveName.trim(), config }
                const updated = [...savedPresets, newPreset]
                setSavedPresets(updated)
                persistPresets(updated)
                setSaveName('')
                setShowSaveInput(false)
              }}
              style={{
                height: 34, width: 56, borderRadius: 6, border: 0,
                background: accentColor ?? 'var(--accent)',
                color: act, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >Save</button>
            <button
              onClick={() => { setSaveName(''); setShowSaveInput(false) }}
              style={{
                height: 34, width: 34, borderRadius: 6, border: 0,
                background: 'transparent', color: 'var(--fg-3)',
                cursor: 'pointer', fontSize: 16,
              }}
            >✕</button>
          </div>
        )}

        {/* Saved preset list */}
        {savedPresets.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: showSaveInput ? 0 : -4 }}>
            {savedPresets.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => onChange(p.config)}
                  style={{
                    flex: 1, height: 32, borderRadius: 8, border: 0,
                    background: 'var(--panel-well)', cursor: 'pointer', textAlign: 'left',
                    padding: '0 10px', fontSize: 12, color: 'var(--fg-1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}
                >
                  <span>{p.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>
                    {p.config.preset}
                  </span>
                </button>
                <button
                  onClick={() => {
                    const updated = savedPresets.filter(x => x.id !== p.id)
                    setSavedPresets(updated)
                    persistPresets(updated)
                  }}
                  style={{
                    width: 28, height: 34, borderRadius: 7, border: 0,
                    background: 'transparent', cursor: 'pointer',
                    color: 'var(--fg-3)', fontSize: 14,
                  }}
                >✕</button>
              </div>
            ))}
          </div>
        )}

        {savedPresets.length === 0 && !showSaveInput && (
          <p style={{ fontSize: 11, color: 'var(--fg-3)', margin: 0 }}>
            No saved presets yet. Save your current settings to quickly restore them.
          </p>
        )}
      </Section>

      {/* ── PRESET ── */}
      <Section icon={<IconLayers />} label="Preset">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {PRESETS.map(p => {
            const sel = config.preset === p.id
            return (
              <button
                key={p.id}
                onClick={() => onChange({ preset: p.id })}
                style={{
                  background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                }}
              >
                {/* Fixed-dark preview plate — mirrors the exported card's own
                    (always-dark) look, so it stays legible in either app theme. */}
                <span style={{
                  width: '100%', height: 46, borderRadius: 9, background: '#1c1c1e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1.5px solid ${sel ? act : 'transparent'}`,
                  opacity: sel ? 1 : 0.6,
                  transition: 'opacity 130ms, border-color 130ms',
                }}>
                  {PRESET_SVG[p.id]}
                </span>
                <span style={{
                  fontSize: 9.5, fontWeight: 600, letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: sel ? act : 'var(--fg-3)',
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
          accent={act}
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
                border: '1px solid var(--panel-well-2)',
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
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)' }}>{config.bgColor.toUpperCase()}</span>
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
        {/* Font grid — 3 columns, each card shows font name in its own face */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          {FONTS.map(f => {
            const sel = config.font === f.value
            return (
              <button
                key={f.value}
                onClick={() => onChange({ font: f.value })}
                style={{
                  height: 52, borderRadius: 9, border: 0,
                  background: 'var(--panel-well)',
                  outline: sel ? `1.5px solid ${act}` : '1.5px solid transparent',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'flex-start', justifyContent: 'flex-end',
                  padding: '0 8px 7px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Font name rendered in its own typeface */}
                <span style={{
                  fontFamily: FONT_CSS_VAR[f.value],
                  fontSize: f.size * 0.78,
                  fontWeight: f.weight,
                  lineHeight: 1,
                  color: sel ? act : 'var(--fg-1)',
                  letterSpacing: f.value === 'bebas' || f.value === 'oswald' ? '0.04em' : f.value === 'raleway' ? '0.06em' : '0',
                  display: 'block', width: '100%',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{f.label}</span>
                {/* Category tag */}
                <span style={{
                  fontSize: 8, color: sel ? act : 'var(--fg-3)',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginTop: 3,
                }}>{f.tag}</span>
              </button>
            )
          })}
        </div>

        {/* Text color */}
        <PillRow
          value={config.textColor}
          onChange={v => onChange({ textColor: v })}
          accent={act}
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
                width: 34, height: 30, borderRadius: 8, border: 0, cursor: 'pointer',
                background: sel ? (accentColor ?? 'var(--accent)') : 'var(--panel-well)',
                color: sel ? '#0d0d0f' : 'var(--fg-3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 120ms',
              }}>{o.icon}</button>
            )
          })}
        </div>
      </Section>

      {/* ── VISIBILITY ── */}
      <Section icon={<IconEye />} label="Visibility">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <ToggleItem icon={<IconImage />}    label="Album art"  value={config.showAlbumArt} onChange={v => onChange({ showAlbumArt: v })} accent={act} />
          <ToggleItem icon={<IconText />}     label="Title"      value={config.showTitle}    onChange={v => onChange({ showTitle: v })}    accent={act} />
          <ToggleItem icon={<IconUser />}     label="Artist"     value={config.showArtist}   onChange={v => onChange({ showArtist: v })}   accent={act} />
          <ToggleItem icon={<IconCalendar />} label="Year"       value={config.showYear}     onChange={v => onChange({ showYear: v })}     accent={act} />
          <ToggleItem icon={<IconClock />}    label="Duration"   value={config.showDuration} onChange={v => onChange({ showDuration: v })} accent={act} />
          <ToggleItem icon={<IconQuote />}    label="Lyrics"     value={config.showLyrics}   onChange={v => onChange({ showLyrics: v })}   accent={act} />
        </div>
        {config.preset === 'glass' && (
          <StyledSlider
            value={config.artPadding} min={0} max={60} step={2}
            onChange={v => onChange({ artPadding: v })}
            label="Panel Inset" suffix="px"
          />
        )}
      </Section>

      {/* ── EXPERIMENTAL ── */}
      <Section icon={<IconBeaker />} label="Experimental">
        <p style={{ fontSize: 11, color: 'var(--fg-3)', lineHeight: 1.5, margin: 0 }}>
          These effects render in the preview and in exported images.
        </p>

        {/* Ambient Glow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ToggleItem
            icon={<IconGlow />}
            label="Ambient Glow"
            value={config.glowEnabled}
            onChange={v => onChange({ glowEnabled: v })}
            accent={act}
          />
          {config.glowEnabled && (
            <StyledSlider
              value={config.glowStrength} min={10} max={100} step={5}
              onChange={v => onChange({ glowStrength: v })}
              label="Intensity" suffix="%"
            />
          )}
        </div>

        {/* Film Grain */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ToggleItem
            icon={<IconGrain />}
            label="Film Grain"
            value={config.grainEnabled}
            onChange={v => onChange({ grainEnabled: v })}
            accent={act}
          />
          {config.grainEnabled && (
            <StyledSlider
              value={config.grainOpacity} min={5} max={60} step={5}
              onChange={v => onChange({ grainOpacity: v })}
              label="Opacity" suffix="%"
            />
          )}
        </div>

        {/* Vignette */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ToggleItem
            icon={<IconVignette />}
            label="Vignette"
            value={config.vignetteEnabled}
            onChange={v => onChange({ vignetteEnabled: v })}
            accent={act}
          />
          {config.vignetteEnabled && (
            <StyledSlider
              value={config.vignetteStrength} min={10} max={100} step={5}
              onChange={v => onChange({ vignetteStrength: v })}
              label="Strength" suffix="%"
            />
          )}
        </div>

        {/* Scanlines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ToggleItem
            icon={<IconScanlines />}
            label="Scanlines"
            value={config.scanlinesEnabled}
            onChange={v => onChange({ scanlinesEnabled: v })}
            accent={act}
          />
          {config.scanlinesEnabled && (
            <StyledSlider
              value={config.scanlinesOpacity} min={5} max={60} step={5}
              onChange={v => onChange({ scanlinesOpacity: v })}
              label="Opacity" suffix="%"
            />
          )}
        </div>

        {/* Holographic Shimmer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ToggleItem
            icon={<IconHolo />}
            label="Holo Shimmer"
            value={config.holoEnabled}
            onChange={v => onChange({ holoEnabled: v })}
            accent={act}
          />
          {config.holoEnabled && (
            <StyledSlider
              value={config.holoOpacity} min={5} max={80} step={5}
              onChange={v => onChange({ holoOpacity: v })}
              label="Intensity" suffix="%"
            />
          )}
        </div>
      </Section>

    </div>
  )
}
