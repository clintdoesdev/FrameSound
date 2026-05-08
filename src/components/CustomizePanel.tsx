'use client'

import React, { useState } from 'react'
import { CardConfig } from '@/types'

type Props = {
  config: CardConfig
  onChange: (updates: Partial<CardConfig>) => void
}

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '12px var(--pad-x)',
          color: 'var(--fg-1)', fontSize: 12, fontWeight: 500,
        }}
      >
        <span style={{ color: 'var(--fg-3)' }}>{icon}</span>
        <span style={{ flex: 1, textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ color: 'var(--fg-3)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 140ms' }}>
          <ChevronIcon />
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 var(--pad-x) 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg-1)' }}>{children}</div>
      {hint && <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{hint}</span>}
    </div>
  )
}

function SegRow<T extends string>({ value, options, onChange }: {
  value: T; options: { value: T; label: string; mono?: boolean }[]; onChange: (v: T) => void
}) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${options.length}, 1fr)`,
      padding: 2,
      background: 'var(--bg-inset)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-3)',
      height: 'var(--row-h)',
    }}>
      {options.map(o => (
        <button key={o.value} onClick={() => onChange(o.value)} style={{
          border: 0, cursor: 'pointer',
          background: value === o.value ? 'var(--bg-2)' : 'transparent',
          color: value === o.value ? 'var(--fg)' : 'var(--fg-2)',
          borderRadius: 'var(--r-2)',
          fontSize: 12, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'background 120ms, color 120ms',
          boxShadow: value === o.value ? 'var(--shadow-sm)' : 'none',
          fontFamily: o.mono ? 'var(--font-mono)' : 'inherit',
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
      display: 'grid', gridTemplateColumns: '28px 1fr 28px',
      height: 'var(--row-h)',
      background: 'var(--bg-inset)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--r-3)',
    }}>
      <button onClick={() => onChange(Math.max(min, value - step))}
        style={{ border: 0, background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer', fontSize: 14 }}>−</button>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-mono)', fontSize: 12,
        borderLeft: '1px solid var(--line)', borderRight: '1px solid var(--line)',
      }}>
        {value}{suffix && <span style={{ opacity: 0.5, marginLeft: 2 }}>{suffix}</span>}
      </div>
      <button onClick={() => onChange(Math.min(max, value + step))}
        style={{ border: 0, background: 'transparent', color: 'var(--fg-2)', cursor: 'pointer', fontSize: 14 }}>+</button>
    </div>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <div style={{ fontSize: 12.5, color: 'var(--fg-1)' }}>{label}</div>
      <button
        onClick={() => onChange(!value)}
        aria-pressed={value}
        style={{
          width: 28, height: 16, borderRadius: 999, border: 0, cursor: 'pointer',
          background: value ? 'var(--accent)' : 'var(--bg-3)',
          position: 'relative', transition: 'background 140ms ease', padding: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: value ? 14 : 2,
          width: 12, height: 12, borderRadius: '50%',
          background: value ? 'var(--accent-fg)' : 'var(--fg-2)',
          transition: 'left 140ms ease',
          boxShadow: '0 1px 2px oklch(0 0 0 / 0.4)',
        }} />
      </button>
    </div>
  )
}

const PRESETS = [
  { id: 'glass',   name: 'Glass',   sub: 'Frosted overlay' },
  { id: 'poster',  name: 'Poster',  sub: 'Full-bleed art' },
  { id: 'minimal', name: 'Minimal', sub: 'Side-by-side' },
  { id: 'story',   name: 'Story',   sub: 'Vertical 9:16' },
  { id: 'square',  name: 'Square',  sub: 'Compact 1:1' },
] as const

export default function CustomizePanel({ config, onChange }: Props) {
  return (
    <div className="scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      {/* Preset picker */}
      <Section icon={<LayersIcon />} label="01 · Preset">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => onChange({ preset: p.id })} style={{
              textAlign: 'left', padding: '8px 10px',
              background: config.preset === p.id ? 'var(--accent-quiet)' : 'var(--bg-1)',
              border: `1px solid ${config.preset === p.id ? 'var(--accent)' : 'var(--line)'}`,
              borderRadius: 'var(--r-3)', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--fg)' }}>{p.name}</span>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', letterSpacing: '0.02em' }}>{p.sub}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Background */}
      <Section icon={<span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>BG</span>} label="02 · Background">
        <div>
          <FieldLabel hint="style">Style</FieldLabel>
          <SegRow
            value={config.bgStyle}
            onChange={(v) => onChange({ bgStyle: v })}
            options={[
              { value: 'blurred-art', label: 'Blurred' },
              { value: 'gradient',    label: 'Grad.' },
              { value: 'solid',       label: 'Solid' },
              { value: 'transparent', label: 'Trans.' },
            ]}
          />
        </div>
        {config.bgStyle === 'solid' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>Color</span>
            <input type="color" value={config.bgColor} onChange={(e) => onChange({ bgColor: e.target.value })}
              style={{ width: 36, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'none' }} />
          </div>
        )}
        <div>
          <FieldLabel hint="0–360°">Tint hue</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px', gap: 10, alignItems: 'center' }}>
            <input type="range" min={0} max={360} step={1} value={config.tintHue}
              onChange={(e) => onChange({ tintHue: parseInt(e.target.value) })}
              style={{ accentColor: 'var(--accent)' }} />
            <div className="mono tnum" style={{
              fontSize: 12, color: 'var(--fg-2)', textAlign: 'right',
              background: 'var(--bg-inset)', border: '1px solid var(--line)',
              borderRadius: 'var(--r-2)', padding: '4px 6px',
            }}>{config.tintHue}°</div>
          </div>
        </div>
      </Section>

      {/* Typography */}
      <Section icon={<TypeIcon />} label="03 · Typography">
        <div>
          <FieldLabel hint="family">Card font</FieldLabel>
          <SegRow
            value={config.font}
            onChange={(v) => onChange({ font: v })}
            options={[
              { value: 'geist', label: 'Display' },
              { value: 'serif', label: 'Serif' },
              { value: 'mono',  label: 'Mono', mono: true },
            ]}
          />
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
      </Section>

      {/* Geometry */}
      <Section icon={<span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>◫</span>} label="04 · Geometry">
        <div>
          <FieldLabel hint="aspect">Size</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {(['1:1', '16:9', '4:5', '9:16'] as CardConfig['size'][]).map(s => (
              <button key={s} onClick={() => onChange({ size: s })} style={{
                height: 30,
                background: config.size === s ? 'var(--bg-2)' : 'var(--bg-inset)',
                border: `1px solid ${config.size === s ? 'var(--line-1)' : 'var(--line)'}`,
                borderRadius: 'var(--r-3)',
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: config.size === s ? 'var(--fg)' : 'var(--fg-2)',
                cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
      <Section icon={<span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>◉</span>} label="05 · Visibility">
        <ToggleRow label="Album art"    value={config.showAlbumArt} onChange={(v) => onChange({ showAlbumArt: v })} />
        <ToggleRow label="Title"        value={config.showTitle}    onChange={(v) => onChange({ showTitle: v })} />
        <ToggleRow label="Artist"       value={config.showArtist}   onChange={(v) => onChange({ showArtist: v })} />
        <ToggleRow label="Release year" value={config.showYear}     onChange={(v) => onChange({ showYear: v })} />
        <ToggleRow label="Duration"     value={config.showDuration} onChange={(v) => onChange({ showDuration: v })} />
        <ToggleRow label="Lyric quote"  value={config.showLyrics}   onChange={(v) => onChange({ showLyrics: v })} />
      </Section>
    </div>
  )
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/><path d="m3 18 9 5 9-5"/>
    </svg>
  )
}

function TypeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7V5h16v2"/><path d="M9 20h6"/><path d="M12 5v15"/>
    </svg>
  )
}
