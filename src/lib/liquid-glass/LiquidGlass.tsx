'use client'
// React / Next.js bindings for liquid-glass.js (adapted from the kit's
// LiquidGlass.tsx). The engine itself lives in liquid-glass.js and is used as-is.
//
// <LiquidGlassProvider source={canvas} theme="dark"> … <Glass as="nav"> … </Glass>
import {
  createContext, useContext, useEffect, useRef, useState,
  type ElementType, type ComponentPropsWithoutRef, type ReactNode, type RefObject,
} from 'react'
import { LiquidGlass, presets, type Material, type RGBA } from './liquid-glass'

export type Theme = 'light' | 'dark'
export type MaterialName = 'bar' | 'sheet' | 'lens' | 'thumb'

type Ctx = {
  engine: LiquidGlass | null
  /** false until mounted, then whether WebGL2 is available. */
  supported: boolean | null
  materials: Record<MaterialName, Material> | null
}

const GlassCtx = createContext<Ctx>({ engine: null, supported: null, materials: null })
export const useLiquidGlass = () => useContext(GlassCtx).engine
export const useGlassSupport = () => useContext(GlassCtx).supported

/** The one system tint (DESIGN.md) — used for switch and slider fills. */
export const SYSTEM_BLUE: RGBA = [0, 0.478, 1, 1]

// Shared material objects, one set per engine, so every surface of a kind
// stays consistent (the kit recommends sharing rather than copying).
function makeMaterials(): Record<MaterialName, Material> {
  return {
    bar: presets.regular(),
    // Large panels carry dense text, so they frost harder and tint a little more.
    sheet: {
      ...presets.regular(),
      frost: 14, thickness: 14,
      tint: { light: [0.96, 0.97, 1.0, 0.72], dark: [0.04, 0.05, 0.07, 0.72] },
    },
    lens: { ...presets.clear(), zoom: 0.92 },
    thumb: presets.thumb(),
  }
}

/** Tracks prefers-color-scheme live. */
export function useColorScheme(): Theme {
  const [theme, setTheme] = useState<Theme>('dark')
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const sync = () => setTheme(mq.matches ? 'dark' : 'light')
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return theme
}

type SourceProps = {
  source: TexImageSource | null
  fit?: 'cover' | 'page'
  width?: number
  height?: number
  live?: boolean
}

export function LiquidGlassProvider({
  source, fit = 'cover', width, height, live, theme, children,
}: SourceProps & { theme?: Theme; children: ReactNode }) {
  const [ctx, setCtx] = useState<Ctx>({ engine: null, supported: null, materials: null })

  useEffect(() => {
    let e: LiquidGlass | null = null
    try { e = new LiquidGlass({ maxDpr: 2 }) } catch { e = null }
    const ok = !!e?.supported
    document.documentElement.classList.toggle('lg-on', ok)
    // An engine that can't draw still owns a canvas; drop it straight away.
    if (!ok) e?.destroy()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCtx({ engine: ok ? e : null, supported: ok, materials: ok ? makeMaterials() : null })
    return () => {
      document.documentElement.classList.remove('lg-on')
      if (ok) e?.destroy()
    }
  }, [])

  const { engine } = ctx
  useEffect(() => { if (engine && theme) engine.setTheme(theme) }, [engine, theme])
  useEffect(() => {
    if (engine && source) engine.setSource(source, { fit, width, height, live })
  }, [engine, source, fit, width, height, live])

  return <GlassCtx.Provider value={ctx}>{children}</GlassCtx.Provider>
}

// ── Scroll clipping ─────────────────────────────────────────────
// The engine draws on one full-screen canvas, so it has no idea a control was
// scrolled out of an `overflow: auto` panel. Controls inside an element marked
// `data-glass-clip` fade their glass out as they reach its edge instead of
// painting outside it.
export function clipOpacity(engine: LiquidGlass, el: Element): number {
  const clip = el.closest('[data-glass-clip]')
  if (!clip) return 1
  const c = engine.rectOf(clip), r = engine.rectOf(el)
  const margin = Math.min(r.top - c.top, c.bottom - r.bottom, r.left - c.left, c.right - r.right)
  return Math.min(1, Math.max(0, (margin + 4) / 14))
}

// ── Instance lifetime ───────────────────────────────────────────
// Kit components bind DOM listeners they never unbind, so building a second
// one on the same host (React strict mode mounts effects twice) would double
// every click. Instances are cached per host and only torn down once the host
// has really gone away.
type Destroyable = { destroy(): void }
const live = new WeakMap<Element, { inst: Destroyable; engine: LiquidGlass; timer?: ReturnType<typeof setTimeout> }>()

export function useKitInstance<T extends Destroyable>(
  hostRef: RefObject<HTMLElement | null>,
  engine: LiquidGlass | null,
  create: (engine: LiquidGlass, host: HTMLElement) => T,
): RefObject<T | null> {
  const instRef = useRef<T | null>(null)
  const createRef = useRef(create)
  useEffect(() => { createRef.current = create })

  useEffect(() => {
    const host = hostRef.current
    if (!engine || !host) return
    let entry = live.get(host)
    if (entry && entry.engine === engine) {
      clearTimeout(entry.timer)
    } else {
      entry?.inst.destroy()
      entry = { inst: createRef.current(engine, host), engine }
      live.set(host, entry)
    }
    const e = entry
    instRef.current = e.inst as T
    return () => {
      e.timer = setTimeout(() => {
        e.inst.destroy()
        if (live.get(host) === e) live.delete(host)
      }, 0)
      instRef.current = null
    }
  }, [engine, hostRef])

  return instRef
}

// ── <Glass> ─────────────────────────────────────────────────────
type GlassProps<T extends ElementType> = {
  as?: T
  material?: MaterialName | Material
  layer?: number
  radius?: number | 'auto' | 'pill'
} & Omit<ComponentPropsWithoutRef<T>, 'as'>

/**
 * Any element becomes a glass surface. Its background stays transparent (the
 * glass is drawn on the canvas behind it); text and icons remain DOM. Without
 * WebGL2 the `.lg` class falls back to a CSS vibrancy material.
 */
export function Glass<T extends ElementType = 'div'>({
  as, material = 'bar', layer = 0, radius = 'auto', className, ...rest
}: GlassProps<T>) {
  const { engine, materials } = useContext(GlassCtx)
  const ref = useRef<HTMLElement>(null)
  const mat = typeof material === 'string' ? materials?.[material] : material

  useEffect(() => {
    if (!engine || !mat || !ref.current) return
    const h = engine.add(ref.current, { material: mat, layer, radius })
    return () => engine.remove(h)
  }, [engine, mat, layer, radius])

  const Tag = (as || 'div') as ElementType
  const kind = material === 'sheet' ? 'lg lg-sheet' : 'lg'
  return <Tag ref={ref} className={className ? `${kind} ${className}` : kind} {...rest} />
}
