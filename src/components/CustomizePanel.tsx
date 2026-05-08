'use client'

import { CardConfig } from '@/types'

type Props = {
  config: CardConfig
  onChange: (updates: Partial<CardConfig>) => void
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#71717a',
  marginBottom: 12,
  display: 'block',
}

const sectionStyle: React.CSSProperties = {
  marginBottom: 24,
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: 40,
        height: 22,
        borderRadius: 9999,
        background: on ? '#22c55e' : '#3f3f46',
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 150ms',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 150ms',
        }}
      />
    </button>
  )
}

function GridBtn<T extends string>({
  options,
  value,
  onChange,
  cols,
  renderLabel,
}: {
  options: T[]
  value: T
  onChange: (v: T) => void
  cols: number
  renderLabel?: (v: T) => React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 6,
      }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            padding: '6px 4px',
            borderRadius: 8,
            border: `1px solid ${value === opt ? '#71717a' : '#27272a'}`,
            background: value === opt ? '#3f3f46' : '#18181b',
            color: value === opt ? '#fff' : '#71717a',
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 120ms',
            textAlign: 'center',
          }}
        >
          {renderLabel ? renderLabel(opt) : opt}
        </button>
      ))}
    </div>
  )
}

export default function CustomizePanel({ config, onChange }: Props) {
  return (
    <div style={{ padding: 4 }}>
      {/* PRESET */}
      <div style={sectionStyle}>
        <span style={sectionLabel}>Preset</span>
        <GridBtn
          options={['glass', 'poster', 'minimal', 'story', 'square'] as CardConfig['preset'][]}
          value={config.preset}
          onChange={(v) => onChange({ preset: v })}
          cols={5}
          renderLabel={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
        />
      </div>

      {/* BACKGROUND */}
      <div style={sectionStyle}>
        <span style={sectionLabel}>Background</span>
        <GridBtn
          options={['blurred-art', 'solid', 'gradient', 'transparent'] as CardConfig['bgStyle'][]}
          value={config.bgStyle}
          onChange={(v) => onChange({ bgStyle: v })}
          cols={2}
          renderLabel={(v) => {
            const labels: Record<string, string> = {
              'blurred-art': 'Blurred Art',
              solid: 'Solid',
              gradient: 'Gradient',
              transparent: 'Transparent',
            }
            return labels[v]
          }}
        />
        {config.bgStyle === 'solid' && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: '#71717a' }}>Color</span>
            <input
              type="color"
              value={config.bgColor}
              onChange={(e) => onChange({ bgColor: e.target.value })}
              style={{ width: 36, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>

      {/* TYPOGRAPHY */}
      <div style={sectionStyle}>
        <span style={sectionLabel}>Typography</span>
        <GridBtn
          options={['syne', 'dm-serif', 'playfair', 'bebas', 'instrument'] as CardConfig['font'][]}
          value={config.font}
          onChange={(v) => onChange({ font: v })}
          cols={3}
          renderLabel={(v) => {
            const fontFamilies: Record<string, string> = {
              syne: 'var(--font-syne)',
              'dm-serif': "'DM Serif Display', serif",
              playfair: "'Playfair Display', serif",
              bebas: "'Bebas Neue', cursive",
              instrument: "'Instrument Serif', serif",
            }
            const labels: Record<string, string> = {
              syne: 'Syne',
              'dm-serif': 'DM Serif',
              playfair: 'Playfair',
              bebas: 'Bebas',
              instrument: 'Instrument',
            }
            return <span style={{ fontFamily: fontFamilies[v] }}>{labels[v]}</span>
          }}
        />
        <div style={{ marginTop: 10 }}>
          <span style={{ ...sectionLabel, marginBottom: 8 }}>Text Color</span>
          <GridBtn
            options={['white', 'black', 'auto'] as CardConfig['textColor'][]}
            value={config.textColor}
            onChange={(v) => onChange({ textColor: v })}
            cols={3}
            renderLabel={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
          />
        </div>
      </div>

      {/* LAYOUT */}
      <div style={sectionStyle}>
        <span style={sectionLabel}>Layout</span>
        <GridBtn
          options={['1:1', '16:9', '4:5', '9:16'] as CardConfig['size'][]}
          value={config.size}
          onChange={(v) => onChange({ size: v })}
          cols={4}
        />
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#71717a' }}>Padding</span>
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>{config.padding}px</span>
          </div>
          <input
            type="range"
            min={8}
            max={64}
            step={4}
            value={config.padding}
            onChange={(e) => onChange({ padding: parseInt(e.target.value) })}
            style={{ width: '100%', accentColor: '#1DB954' }}
          />
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: '#71717a' }}>Border Radius</span>
            <span style={{ fontSize: 12, color: '#a1a1aa' }}>{config.borderRadius}px</span>
          </div>
          <input
            type="range"
            min={0}
            max={48}
            step={4}
            value={config.borderRadius}
            onChange={(e) => onChange({ borderRadius: parseInt(e.target.value) })}
            style={{ width: '100%', accentColor: '#1DB954' }}
          />
        </div>
      </div>

      {/* ELEMENTS */}
      <div style={sectionStyle}>
        <span style={sectionLabel}>Elements</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(
            [
              ['showAlbumArt', 'Album Art'],
              ['showTitle', 'Title'],
              ['showArtist', 'Artist'],
              ['showYear', 'Year'],
              ['showDuration', 'Duration'],
              ['showLyrics', 'Lyrics Quote'],
            ] as [keyof CardConfig, string][]
          ).map(([key, label]) => (
            <div
              key={key}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span style={{ fontSize: 13, color: '#d4d4d8' }}>{label}</span>
              <Toggle
                on={config[key] as boolean}
                onToggle={() => onChange({ [key]: !config[key] })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* COLOR TINT */}
      <div style={sectionStyle}>
        <span style={sectionLabel}>Color Tint</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: `hsl(${config.tintHue}, 70%, 50%)`,
              border: '1px solid rgba(255,255,255,0.2)',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, color: '#a1a1aa' }}>{config.tintHue}°</span>
        </div>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={config.tintHue}
          onChange={(e) => onChange({ tintHue: parseInt(e.target.value) })}
          style={{ width: '100%', accentColor: '#1DB954' }}
        />
      </div>
    </div>
  )
}
