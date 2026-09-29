// Backdrop for the liquid-glass engine. The glass can only refract pixels it
// is given, so the editor's album art is painted here as a soft ambient wash.

import type { Theme } from '@/lib/liquid-glass/LiquidGlass'

function makeCanvas(w: number, h: number, scale: number) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w * scale))
  c.height = Math.max(1, Math.round(h * scale))
  const ctx = c.getContext('2d')!
  ctx.scale(scale, scale)
  return { c, ctx }
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
}

function hexA(hex: string, alpha: number) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return `rgba(0,122,255,${alpha})`
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`
}

// Canvas `filter` is missing in some Safari versions; bouncing the image
// through a tiny intermediate gives the same soft blur everywhere.
function softDraw(ctx: CanvasRenderingContext2D, img: CanvasImageSource, iw: number, ih: number, W: number, H: number, steps: number) {
  const k = Math.max(W / iw, H / ih)
  const dw = iw * k, dh = ih * k
  const t = document.createElement('canvas')
  t.width = steps
  t.height = Math.max(1, Math.round((steps * dh) / dw))
  const tc = t.getContext('2d')!
  tc.imageSmoothingQuality = 'high'
  tc.drawImage(img, 0, 0, t.width, t.height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(t, (W - dw) / 2, (H - dh) / 2, dw, dh)
}

/** Editor: the album art, softened into an ambient wash the chrome can refract. */
export function paintEditor(theme: Theme, W: number, H: number, art: HTMLImageElement | null, accent?: string | null): HTMLCanvasElement {
  const dark = theme === 'dark'
  // The backdrop is soft by design, so it doesn't need device resolution.
  const { c, ctx } = makeCanvas(W, H, 1)
  ctx.fillStyle = dark ? '#0a0a0c' : '#f3f1ec'
  ctx.fillRect(0, 0, W, H)

  if (art && art.naturalWidth) {
    // A very soft base plus a little mid-frequency shape, so the glass has
    // colour to bend without the artwork's text or detail reading through.
    softDraw(ctx, art, art.naturalWidth, art.naturalHeight, W, H, 10)
    ctx.globalAlpha = 0.35
    softDraw(ctx, art, art.naturalWidth, art.naturalHeight, W, H, 28)
    ctx.globalAlpha = 1
  } else {
    const R = Math.max(W, H)
    blob(ctx, W * 0.2, H * 0.3, R * 0.5, accent ? hexA(accent, 0.7) : 'rgba(46,230,166,0.4)')
    blob(ctx, W * 0.85, H * 0.8, R * 0.45, 'rgba(175,82,222,0.4)')
  }

  // Wash toward the system background so chrome text keeps its contrast.
  ctx.fillStyle = dark ? 'rgba(10,10,12,0.45)' : 'rgba(243,241,236,0.45)'
  ctx.fillRect(0, 0, W, H)
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, dark ? 'rgba(10,10,12,0.55)' : 'rgba(243,241,236,0.4)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, W, H)
  return c
}

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}
