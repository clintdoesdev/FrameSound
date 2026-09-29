'use client'

// Real liquid glass inside a card preset. A WebGL canvas sits at the bottom of
// the card, paints the card's backdrop (the artwork, framed exactly like the DOM
// art) and bends it through every element marked `data-lg` — refraction,
// dispersion, frost and glare straight from the kit's shader.
//
// The canvas is created with preserveDrawingBuffer, so html-to-image can read it
// with toDataURL() and exports contain the same glass as the preview. It renders
// at a fixed 1400px-wide resolution (CSS-scaled down to the card), which keeps
// a 3× export sharp.
//
// Marking a glass element:
//   data-lg="0|1"            layer (1 refracts layer 0 — glass on glass)
//   data-lg-mat="pane|chip"  material
//   data-lg-r="22|pill"      corner radius in card design units

import { useEffect, useRef } from 'react'
import { LiquidGlass, presets, type Material, type RGBA } from '@/lib/liquid-glass/liquid-glass'

const DESIGN_W = 400
export const LG_CANVAS_W = 1400
const K = LG_CANVAS_W / DESIGN_W // canvas px per design unit

export type CardGlassTone = 'light' | 'dark' | 'clear'
type MatName = 'pane' | 'chip'

const TINTS: Record<CardGlassTone, RGBA> = {
  light: [0.93, 0.96, 1.0, 0.6],
  dark:  [0.02, 0.04, 0.07, 0.55],
  clear: [1, 1, 1, 0],
}

// The kit's materials are specified in CSS px for phone-sized UI, which maps
// neatly onto the card's 400-unit design width; everything length-like is
// scaled by K so the glass looks the same at any render resolution.
function material(mat: MatName, tone: CardGlassTone, frost: number): Material {
  const base = tone === 'clear' ? presets.clear() : presets.regular()
  const tint = TINTS[tone]
  const common = {
    refractScale: K,
    glareRange: base.glareRange * Math.sqrt(K),
    shadow: 0,
  }
  if (mat === 'chip') {
    return {
      ...base, ...common,
      thickness: 7 * K, refraction: 1.35,
      frost: (tone === 'clear' ? 0.4 : 2.5) * K,
      tint: [tint[0], tint[1], tint[2], tone === 'clear' ? 0 : 0.3],
    }
  }
  return {
    ...base, ...common,
    thickness: 12 * K,
    frost: (tone === 'clear' ? frost * 0.03 : 1 + frost * 0.15) * K,
    tint,
  }
}

type Props = {
  root: React.RefObject<HTMLDivElement | null>
  /** Card height in design units (width is always 400). */
  designH: number
  /** Proxied (same-origin) artwork URL, or null. */
  artSrc: string | null
  /** Paints the backdrop at canvas resolution. */
  paint: (ctx: CanvasRenderingContext2D, W: number, H: number, art: HTMLImageElement | null) => void
  /** Changes whenever the painted backdrop would change. */
  paintKey: string
  tone: CardGlassTone
  frost: number
  onReady: (ready: boolean) => void
}

export default function LiquidCardGlass({ root, designH, artSrc, paint, paintKey, tone, frost, onReady }: Props) {
  const hostRef = useRef<HTMLSpanElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const engineRef = useRef<LiquidGlass | null>(null)
  const matsRef = useRef<Record<MatName, Material> | null>(null)
  const artRef = useRef<{ src: string | null; img: HTMLImageElement | null }>({ src: null, img: null })
  const cbRef = useRef({ paint, onReady })
  useEffect(() => { cbRef.current = { paint, onReady } })

  const W = LG_CANVAS_W
  const H = Math.round((designH / DESIGN_W) * LG_CANVAS_W)

  // ── Engine, sizing and shape tracking ──────────────────────────
  useEffect(() => {
    const host = hostRef.current, rootEl = root.current
    if (!host || !rootEl) return
    // A fresh canvas per mount: a context lost by destroy() can't be revived,
    // and React strict mode mounts effects twice.
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    Object.assign(canvas.style, {
      position: 'absolute', left: '0', top: '0', width: `${W}px`, height: `${H}px`, maxWidth: 'none',
      transformOrigin: '0 0', opacity: '0', pointerEvents: 'none', display: 'block',
    })
    host.appendChild(canvas)
    canvasRef.current = canvas
    // Claim the context first so the engine inherits preserveDrawingBuffer.
    const gl = canvas.getContext('webgl2', {
      alpha: false, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: false, preserveDrawingBuffer: true,
    })
    let engine: LiquidGlass | null = null
    if (gl) { try { engine = new LiquidGlass({ canvas, maxDpr: 1 }) } catch { engine = null } }
    if (!engine?.supported) { canvas.remove(); cbRef.current.onReady(false); return }
    engineRef.current = engine
    matsRef.current = { pane: material('pane', tone, frost), chip: material('chip', tone, frost) }

    const fit = () => {
      const w = rootEl.getBoundingClientRect().width || rootEl.offsetWidth
      canvas.style.transform = `scale(${w / W})`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(rootEl)

    // Card presets remount their inner elements on every render, so the set of
    // glass shapes is rebuilt whenever the marked elements change.
    let handles: ReturnType<LiquidGlass['add']>[] = []
    const rebuild = () => {
      handles.forEach(h => engine!.remove(h))
      handles = []
      rootEl.querySelectorAll<HTMLElement>('[data-lg]').forEach(el => {
        const layer = Number(el.dataset.lg) || 0
        const mat = (el.dataset.lgMat as MatName) || 'pane'
        const r = el.dataset.lgR
        handles.push(engine!.add(() => {
          const cr = engine!.rectOf(rootEl), er = engine!.rectOf(el)
          const s = W / (cr.width || 1)
          return { x: (er.left - cr.left) * s, y: (er.top - cr.top) * s, width: er.width * s, height: er.height * s }
        }, {
          material: matsRef.current![mat],
          layer,
          radius: r === 'pill' ? 'pill' : (Number(r) || 0) * K,
        }))
      })
    }
    rebuild()
    const mo = new MutationObserver(rebuild)
    mo.observe(rootEl, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-lg', 'data-lg-mat', 'data-lg-r'] })

    return () => {
      mo.disconnect(); ro.disconnect()
      engine!.destroy() // also removes the canvas
      engineRef.current = null
      canvasRef.current = null
      cbRef.current.onReady(false)
    }
    // Materials are updated in place below; the engine is built once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root, W, H])

  // ── Material updates (edited in place; the engine notices) ─────
  useEffect(() => {
    const mats = matsRef.current
    if (!mats) return
    Object.assign(mats.pane, material('pane', tone, frost))
    Object.assign(mats.chip, material('chip', tone, frost))
    engineRef.current?.invalidate()
  }, [tone, frost])

  // ── Backdrop: load the art, paint, upload ─────────────────────
  useEffect(() => {
    let alive = true
    let raf = 0
    const draw = (img: HTMLImageElement | null) => {
      const engine = engineRef.current
      if (!alive || !engine) return
      const src = document.createElement('canvas')
      src.width = W; src.height = H
      const ctx = src.getContext('2d')!
      ctx.imageSmoothingQuality = 'high'
      cbRef.current.paint(ctx, W, H, img)
      engine.setSource(src, { fit: 'cover' })
      // Two frames: one to render the glass, one to be sure it's on screen.
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => {
          if (!alive) return
          if (canvasRef.current) canvasRef.current.style.opacity = '1'
          cbRef.current.onReady(true)
        })
      })
    }
    if (!artSrc) {
      artRef.current = { src: null, img: null }
      draw(null)
    } else if (artRef.current.src === artSrc && artRef.current.img) {
      draw(artRef.current.img)
    } else {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => { artRef.current = { src: artSrc, img }; draw(img) }
      img.onerror = () => { artRef.current = { src: artSrc, img: null }; draw(null) }
      img.src = artSrc
    }
    return () => { alive = false; cancelAnimationFrame(raf) }
  }, [artSrc, paintKey, W, H])

  return (
    <span ref={hostRef} aria-hidden data-liquid-host=""
      style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, zIndex: 0, pointerEvents: 'none' }} />
  )
}

// ── Painting helpers ────────────────────────────────────────────

/** A CSS `linear-gradient(<deg>, …)` on a canvas. Stops: [offset 0–1, colour]. */
export function fillCssGradient(ctx: CanvasRenderingContext2D, W: number, H: number, deg: number, stops: [number, string][]) {
  const a = (deg * Math.PI) / 180
  const dx = Math.sin(a), dy = -Math.cos(a)
  const len = Math.abs(W * dx) + Math.abs(H * dy)
  const cx = W / 2, cy = H / 2
  const g = ctx.createLinearGradient(cx - (dx * len) / 2, cy - (dy * len) / 2, cx + (dx * len) / 2, cy + (dy * len) / 2)
  stops.forEach(([o, c]) => g.addColorStop(o, c))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

const hasCtxFilter = () => typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype

/**
 * Draws the artwork exactly like the card's <img>: object-fit cover, the
 * user's focal point and zoom (scaled about that point), and the hue tint.
 */
export function drawFramedArt(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number,
  { x, y, zoom, hue }: { x: number; y: number; zoom: number; hue: number }) {
  const s = Math.max(W / img.naturalWidth, H / img.naturalHeight)
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s
  const ox = (W * x) / 100, oy = (H * y) / 100
  ctx.save()
  if (hue > 0 && hasCtxFilter()) ctx.filter = `hue-rotate(${hue}deg)`
  ctx.translate(ox, oy); ctx.scale(zoom, zoom); ctx.translate(-ox, -oy)
  ctx.drawImage(img, ((W - dw) * x) / 100, ((H - dh) * y) / 100, dw, dh)
  ctx.restore()
}

/** The Player's ambient backdrop: centred art, enlarged, heavily blurred and dimmed. */
export function drawBlurredArt(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number,
  { blur, brightness, hue }: { blur: number; brightness: number; hue: number }) {
  const s = Math.max(W / img.naturalWidth, H / img.naturalHeight) * 1.25
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s
  ctx.save()
  if (hasCtxFilter()) {
    ctx.filter = [`blur(${blur}px)`, 'saturate(165%)', `brightness(${brightness})`, hue > 0 ? `hue-rotate(${hue}deg)` : ''].join(' ')
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
  } else {
    // No canvas filters (older Safari): a tiny intermediate gives the blur.
    const t = document.createElement('canvas')
    t.width = 24; t.height = Math.max(1, Math.round((24 * dh) / dw))
    t.getContext('2d')!.drawImage(img, 0, 0, t.width, t.height)
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(t, (W - dw) / 2, (H - dh) / 2, dw, dh)
    ctx.fillStyle = `rgba(0,0,0,${Math.max(0, 1 - brightness)})`
    ctx.fillRect(0, 0, W, H)
  }
  ctx.restore()
}

/**
 * Resolves once a card's liquid glass has rendered (or was never wanted), so
 * exports never catch the CSS stand-in mid-swap. Gives up after `timeout` ms.
 */
export async function waitForLiquid(card: HTMLElement, timeout = 2500): Promise<void> {
  const start = performance.now()
  while (card.dataset.liquid === 'pending' && performance.now() - start < timeout) {
    await new Promise(r => setTimeout(r, 50))
  }
  // One more frame so the latest shape positions are on the canvas.
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
}
