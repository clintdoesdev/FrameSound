'use client'

import React, { useEffect, useRef } from 'react'
import { GlassTabBar } from '@/lib/liquid-glass/liquid-glass'
import { useLiquidGlass, useKitInstance } from '@/lib/liquid-glass/LiquidGlass'

// Switches and sliders live inside the scrolling settings panel, so they are
// plain DOM: anything drawn on the WebGL canvas trails a compositor scroll by
// a frame and reads as wobble. Only the tab bar — which never scrolls — uses
// the kit's liquid lens.

// ── Toggle ──────────────────────────────────────────────────────
export function Toggle({ checked, onChange, label }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label}
      className="toggle" onClick={() => onChange(!checked)}
    ><span /></button>
  )
}

// ── Range ───────────────────────────────────────────────────────
export function Range({ value, min, max, step, onChange, label, format, track }: {
  value: number; min: number; max: number; step: number
  onChange: (v: number) => void
  label: string
  format?: (v: number) => string
  /** Replaces the default accent fill, e.g. a hue spectrum. */
  track?: string
}) {
  const pct = ((value - min) / (max - min || 1)) * 100
  return (
    <div className="range">
      <span className="range-head">
        <span aria-hidden>{label}</span>
        <span className="range-value mono tnum" aria-hidden>{format ? format(value) : value}</span>
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        aria-label={label} aria-valuetext={format ? format(value) : undefined}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          ['--pct' as string]: `${pct}%`,
          ...(track ? { ['--track' as string]: track } : {}),
        }}
        data-custom-track={track ? '' : undefined}
      />
    </div>
  )
}

// ── Chips (single choice) ───────────────────────────────────────
export function Chips<T extends string>({ value, options, onChange, label }: {
  value: T
  options: { value: T; label: React.ReactNode; aria?: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value}
          aria-label={o.aria} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

// ── Tab bar (kit liquid lens) ───────────────────────────────────
export type TabItem<K extends string> = { key: K; label: string; icon: React.ReactNode }

// The kit's springs are tuned for iOS bounce (damping 0.6, squash-and-stretch).
// Critically damped here: the lens glides and settles without wobbling.
type TunableTabBar = GlassTabBar & {
  x: { config(response: number, damping: number): void }
  lift: { config(response: number, damping: number): void }
  jelly: { gain: number; max: number }
}

export function GlassTabs<K extends string>({ items, value, onChange, label }: {
  items: TabItem<K>[]
  value: K
  onChange: (k: K) => void
  label: string
}) {
  const engine = useLiquidGlass()
  const host = useRef<HTMLDivElement>(null)
  const cb = useRef(onChange)
  const itemsRef = useRef(items)
  useEffect(() => { cb.current = onChange; itemsRef.current = items })

  const selected = Math.max(0, items.findIndex(i => i.key === value))
  useKitInstance(host, engine, (e, el) => {
    const t = new GlassTabBar(e, el, {
      selected, layer: 1,
      onSelect: i => cb.current(itemsRef.current[i].key),
    }) as TunableTabBar
    t.x.config(0.3, 1)
    t.lift.config(0.24, 1)
    t.jelly.gain = 0
    t.jelly.max = 0
    return t
  })

  return (
    <div
      ref={host}
      className={engine ? 'tabbar' : 'tabbar tabbar-css'}
      role="tablist" aria-label={label}
    >
      {items.map((it, i) => (
        <button
          key={it.key}
          type="button"
          role="tab"
          aria-selected={i === selected}
          tabIndex={i === selected ? 0 : -1}
          className={i === selected ? 'is-selected' : undefined}
          // The kit drives pointer and arrow-key selection; without it, a plain click does.
          onClick={engine ? undefined : () => onChange(it.key)}
        >
          {it.icon}
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  )
}
