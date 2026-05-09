'use client'

import React, { useState } from 'react'
import { CardConfig } from '@/types'

type Props = {
  config: CardConfig
  onChange: (updates: Partial<CardConfig>) => void
}

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 6 6 6-6 6"/>
  </svg>
)

function Section({ icon, label, children, defaultOpen = true }: {
  icon: React.ReactNode; label: string; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderTop: '1px solid var(--line-soft)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', border: 0, background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '14px var(--pad-x)',
          color: 'var(--fg-1)',
        }}
      >
        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--fg-1)' }}>
          {label}
        </span>
        <span style={{ color: 'var(--fg-3)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }}>
          <ChevronIcon />
        </span>
      </button>
      {open && (
        <div style={{ padding: '2px var(--pad-x) 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 7 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)' }}>{children}</div>
      {hint && <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{hint}</span>}
    </div>
  )
}

function SegRow<T extends string>({ value, options, onChange }: {
  value: T; options: { value: T; label: React.ReactNode; title?: string }[]; onChange: (v: T) => void
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`,
      padding: 3, background: 'var(--bg-inset)', border: '1px solid var(--line)',
      borderRadius: 10, height: 40,
    }}>
      {options.map((o, i) => (
        <button key={i} onClick={() => onChange(o.value)} title={o.title} style={{
          border: 0, cursor: 'pointer',
          background: value === o.value ? 'var(--bg-2)' : 'transparent',
          color: value === o.value ? 'var(--fg)' : 'var(--fg-1)',
          borderRadius: 8, fontSize: 12.5, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          transition: 'background 120ms, color 120ms',
          boxShadow: value === o.value ? 'var(--shadow-sm)' : 'none',
        }}>{o.label}</button>
      ))}
    </div>
  )
}

function NumStep({ value, min, max, step = 1, onChange, suffix = '' }: {
  value: number; min: number; max: number; step?: number; onChange: (v: number) => void; suffix?: string
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '36px 1fr 36px', height: 40,
      background: 'var(--bg-inset)', border: '1px solid var(--line)', borderRadius: 10,
    }}>
      <button onClick={() => onChange(Math.max(min, value - step))}
        style={{ border: 0, background: 'transparent', color: 'var(--fg)', cursor: 'pointer', fontSize: 18, borderRadius: '10px 0 0 10px' }}>−</button>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--fg)',
        borderLeft: '1px solid var(--line)', borderRight: '1px solid var(--line)',
      }}>
        {value}{suffix && <span style={{ opacity: 0.55, marginLeft: 2, fontSize: 11 }}>{suffix}</span>}
      </div>
      <button onClick={() => onChange(Math.min(max, value + step))}
        style={{ border: 0, background: 'transparent', color: 'var(--fg)', cursor: 'pointer', fontSize: 18, borderRadius: '0 10px 10px 0' }}>+</button>
    </div>
  )
}

function ToggleRow({ label, value, onChange, icon }: {
  label: string; value: boolean; onChange: (v: boolean) => void; icon?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0', minHeight: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        {icon && <span style={{ color: 'var(--fg-3)', display: 'flex' }}>{icon}</span>}
        <span style={{ fontSize: 13, color: 'var(--fg)' }}>{label}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        aria-pressed={value}
        style={{
          width: 36, height: 20, borderRadius: 999, border: 0, cursor: 'pointer',
          background: value ? 'var(--accent)' : 'var(--bg-3)',
          position: 'relative', transition: 'background 150ms ease', padding: 0, flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: value ? 18 : 3,
          width: 14, height: 14, borderRadius: '50%',
          background: value ? 'var(--accent-fg)' : 'var(--fg-2)',
          transition: 'left 150ms ease',
          boxShadow: '0 1px 3px oklch(0 0 0 / 0.45)',
        }} />
      </button>
    </div>
  )
}

const PRESETS = [
  { id: 'glass',   name: 'Glass',   sub: 'Frosted liquid' },
  { id: 'poster',  name: 'Poster',  sub: 'Full-bleed art' },
  { id: 'minimal', name: 'Minimal', sub: 'Side-by-side' },
  { id: 'story',   name: 'Story',   sub: 'Vertical 9:16' },
  { id: 'square',  name: 'Square',  sub: 'Compact card' },
] as const

// Icon components
const IconImage = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
  </svg>
)
const IconText = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7V5h16v2M9 20h6M12 5v15"/>
  </svg>
)
const IconUser = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
  </svg>
)
const IconClock = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
  </svg>
)
const IconQuote = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
  </svg>
)
const IconLayers = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 18 9 5 9-5"/>
  </svg>
)
const IconBg = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><path d="M12 3a6 6 0 0 0 9 9"/>
  </svg>
)
const IconType = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7V5h16v2M9 20h6M12 5v15"/>
  </svg>
)
const IconGeometry = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <path d="M9 3v18M3 9h18"/>
  </svg>
)
const IconEye = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

// Alignment icons
const AlignLeftIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor">
    <rect x="1" y="3" width="14" height="1.5" rx="0.75"/>
    <rect x="1" y="7" width="9" height="1.5" rx="0.75"/>
    <rect x="1" y="11" width="12" height="1.5" rx="0.75"/>
  </svg>
)
const AlignCenterIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor">
    <rect x="1" y="3" width="14" height="1.5" rx="0.75"/>
    <rect x="3.5" y="7" width="9" height="1.5" rx="0.75"/>
    <rect x="2" y="11" width="12" height="1.5" rx="0.75"/>
  </svg>
)
const AlignRightIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="currentColor">
    <rect x="1" y="3" width="14" height="1.5" rx="0.75"/>
    <rect x="6" y="7" width="9" height="1.5" rx="0.75"/>
    <rect x="3" y="11" width="12" height="1.5" rx="0.75"/>
  </svg>
)

export default function CustomizePanel({ config, onChange }: Props) {
  return (
    <div className="scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      {/* Preset picker */}
      <Section icon={<IconLayers />} label="Preset">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => onChange({ preset: p.id })} style={{
              textAlign: 'left', padding: '11px 12px',
              background: config.preset === p.id ? 'var(--accent-quiet)' : 'var(--bg-1)',
              border: `1.5px solid ${config.preset === p.id ? 'var(--accent)' : 'var(--line)'}`,
              borderRadius: 10, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 3,
              transition: 'border-color 120ms, background 120ms',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: config.preset === p.id ? 'var(--accent)' : 'var(--fg)' }}>{p.name}</span>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)', letterSpacing: '0.02em' }}>{p.sub}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Background */}
      <Section icon={<IconBg />} label="Background">
        <div>
          <FieldLabel hint="style">Style</FieldLabel>
          <SegRow
            value={config.bgStyle}
            onChange={(v) => onChange({ bgStyle: v })}
            options={[
              { value: 'blurred-art', label: 'Blurred' },
              { value: 'gradient',    label: 'Grad' },
              { value: 'solid',       label: 'Solid' },
              { value: 'transparent', label: 'None' },
            ]}
          />
        </div>
        {config.bgStyle === 'solid' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--fg)' }}>Color</span>
            <input type="color" value={config.bgColor} onChange={(e) => onChange({ bgColor: e.target.value })}
              style={{ width: 40, height: 32, borderRadius: 8, border: '1px solid var(--line)', cursor: 'pointer', background: 'none', padding: 2 }} />
            <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{config.bgColor}</span>
          </div>
        )}
        <div>
          <FieldLabel hint="0–360°">Tint hue</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px', gap: 10, alignItems: 'center' }}>
            <input type="range" min={0} max={360} step={1} value={config.tintHue}
              onChange={(e) => onChange({ tintHue: parseInt(e.target.value) })}
              style={{ accentColor: 'var(--accent)' }} />
            <div className="mono tnum" style={{
              fontSize: 12, color: 'var(--fg)', textAlign: 'center',
              background: 'var(--bg-inset)', border: '1px solid var(--line)',
              borderRadius: 8, padding: '5px 6px',
            }}>{config.tintHue}°</div>
          </div>
        </div>
      </Section>

      {/* Typography */}
      <Section icon={<IconType />} label="Typography">
        <div>
          <FieldLabel hint="family">Card font</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
            {([
              { value: 'syne',       label: 'Syne' },
              { value: 'dm-serif',   label: 'DM Serif' },
              { value: 'playfair',   label: 'Playfair' },
              { value: 'bebas',      label: 'Bebas' },
              { value: 'instrument', label: 'Instrument' },
            ] as { value: CardConfig['font']; label: string }[]).map(f => (
              <button key={f.value} onClick={() => onChange({ font: f.value })} style={{
                height: 36, border: `1.5px solid ${config.font === f.value ? 'var(--accent)' : 'var(--line)'}`,
                background: config.font === f.value ? 'var(--accent-quiet)' : 'var(--bg-inset)',
                borderRadius: 8, fontSize: 12, fontWeight: 500,
                color: config.font === f.value ? 'var(--accent)' : 'var(--fg-1)', cursor: 'pointer',
                transition: 'all 120ms',
              }}>{f.label}</button>
            ))}
          </div>
        </div>

        <div>
          <FieldLabel hint="contrast">Text color</FieldLabel>
          <SegRow
            value={config.textColor}
            onChange={(v) => onChange({ textColor: v })}
            options={[
              { value: 'white', label: 'Light' },
              { value: 'black', label: 'Dark' },
              { value: 'auto',  label: 'Auto' },
            ]}
          />
        </div>

        <div>
          <FieldLabel>Text align</FieldLabel>
          <SegRow
            value={config.textAlign}
            onChange={(v) => onChange({ textAlign: v })}
            options={[
              { value: 'left',   label: <AlignLeftIcon />,   title: 'Align left' },
              { value: 'center', label: <AlignCenterIcon />, title: 'Align center' },
              { value: 'right',  label: <AlignRightIcon />,  title: 'Align right' },
            ]}
          />
        </div>
      </Section>

      {/* Geometry */}
      <Section icon={<IconGeometry />} label="Geometry">
        <div>
          <FieldLabel hint="aspect">Canvas size</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
            {(['1:1', '16:9', '4:5', '9:16'] as CardConfig['size'][]).map(s => (
              <button key={s} onClick={() => onChange({ size: s })} style={{
                height: 36,
                background: config.size === s ? 'var(--accent-quiet)' : 'var(--bg-inset)',
                border: `1.5px solid ${config.size === s ? 'var(--accent)' : 'var(--line)'}`,
                borderRadius: 8,
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: config.size === s ? 'var(--accent)' : 'var(--fg-1)',
                cursor: 'pointer', transition: 'all 120ms',
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <FieldLabel hint="px">Padding</FieldLabel>
            <NumStep value={config.padding} min={8} max={64} step={4} onChange={(v) => onChange({ padding: v })} />
          </div>
          <div>
            <FieldLabel hint="px">Radius</FieldLabel>
            <NumStep value={config.borderRadius} min={0} max={48} step={2} onChange={(v) => onChange({ borderRadius: v })} />
          </div>
        </div>
      </Section>

      {/* Visibility */}
      <Section icon={<IconEye />} label="Visibility">
        <ToggleRow icon={<IconImage />}    label="Album art"    value={config.showAlbumArt} onChange={(v) => onChange({ showAlbumArt: v })} />
        <ToggleRow icon={<IconText />}     label="Title"        value={config.showTitle}    onChange={(v) => onChange({ showTitle: v })} />
        <ToggleRow icon={<IconUser />}     label="Artist"       value={config.showArtist}   onChange={(v) => onChange({ showArtist: v })} />
        <ToggleRow icon={<IconCalendar />} label="Release year" value={config.showYear}     onChange={(v) => onChange({ showYear: v })} />
        <ToggleRow icon={<IconClock />}    label="Duration"     value={config.showDuration} onChange={(v) => onChange({ showDuration: v })} />
        <ToggleRow icon={<IconQuote />}    label="Lyric quote"  value={config.showLyrics}   onChange={(v) => onChange({ showLyrics: v })} />
      </Section>
    </div>
  )
}
