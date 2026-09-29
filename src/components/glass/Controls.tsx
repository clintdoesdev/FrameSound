'use client'

import React, { useEffect, useRef } from 'react'
import { GlassSwitch, GlassSlider, GlassTabBar, type RGBA } from '@/lib/liquid-glass/liquid-glass'
import { useLiquidGlass, useKitInstance, clipOpacity, SYSTEM_BLUE } from '@/lib/liquid-glass/LiquidGlass'

// Layer plan (the engine allows 24 solid fills per layer):
//   0 — bars and sheets
//   1 — sliders and the tab-bar lens (≤ 5 sliders × 3 fills + 1 pill)
//   2 — switches (≤ 6 × 2 fills)
const SLIDER_LAYER = 1
const SWITCH_LAYER = 2
const TABS_LAYER = 1

// ── Switch ──────────────────────────────────────────────────────
export function GlassToggle({ checked, onChange, label }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  const engine = useLiquidGlass()
  const host = useRef<HTMLDivElement>(null)
  const cb = useRef(onChange)
  useEffect(() => { cb.current = onChange })

  const inst = useKitInstance(host, engine, (e, el) => {
    el.setAttribute('aria-label', label)
    return new GlassSwitch(e, el, {
      checked, tint: SYSTEM_BLUE, layer: SWITCH_LAYER,
      onChange: v => cb.current(v),
      opacity: () => clipOpacity(e, el),
    })
  })
  // Keep the kit's internal state in step with undo, presets and shared links.
  useEffect(() => { inst.current?.set(checked, false) }, [checked, inst])

  if (!engine) {
    return (
      <button
        type="button" role="switch" aria-checked={checked} aria-label={label}
        className="css-switch" onClick={() => onChange(!checked)}
      ><span /></button>
    )
  }
  return <div ref={host} className="kit-switch" />
}

// ── Slider ──────────────────────────────────────────────────────
export function GlassRange({ value, min, max, step, onChange, label, format, fill }: {
  value: number; min: number; max: number; step: number
  onChange: (v: number) => void
  label: string
  format?: (v: number) => string
  /** Fill colour for the active part of the track (defaults to the system tint). */
  fill?: () => RGBA
}) {
  const engine = useLiquidGlass()
  const host = useRef<HTMLDivElement>(null)
  const cb = useRef(onChange)
  const fillRef = useRef(fill)
  useEffect(() => { cb.current = onChange; fillRef.current = fill })

  const inst = useKitInstance(host, engine, (e, el) => new GlassSlider(e, el, {
    min, max, step, value, label, layer: SLIDER_LAYER,
    // The engine accepts a colour function for fills; the typings only say RGBA.
    tint: (() => fillRef.current?.() ?? SYSTEM_BLUE) as unknown as RGBA,
    onInput: v => cb.current(v),
    opacity: () => clipOpacity(e, el),
  }))
  useEffect(() => {
    const s = inst.current as (GlassSlider & { drag?: unknown }) | null
    if (s && !s.drag && s.value !== value) s.setValue(value, false)
  }, [value, inst])

  const shown = format ? format(value) : String(value)
  return (
    <div className="range-row">
      <div className="range-head">
        <span>{label}</span>
        <output className="tnum">{shown}</output>
      </div>
      {engine ? (
        <div ref={host} className="kit-slider" />
      ) : (
        <input
          type="range" className="css-range" aria-label={label}
          min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
        />
      )}
    </div>
  )
}

// ── Tab bar ─────────────────────────────────────────────────────
export type TabItem<K extends string> = { key: K; label: string; icon: React.ReactNode }

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
  useKitInstance(host, engine, (e, el) => new GlassTabBar(e, el, {
    selected, layer: TABS_LAYER,
    onSelect: i => cb.current(itemsRef.current[i].key),
  }))

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
