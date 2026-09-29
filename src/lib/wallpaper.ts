// Backdrops for the liquid-glass engine. The glass can only refract pixels it
// is given, so everything that should read "behind the glass" is painted here:
// ambient colour and demo cards on the landing page, the album art in the editor.

import type { Theme } from '@/lib/liquid-glass/LiquidGlass'

function makeCanvas(w: number, h: number, scale: number) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w * scale))
  c.height = Math.max(1, Math.round(h * scale))
  const ctx = c.getContext('2d')!
  ctx.scale(scale, scale)
  return { c, ctx }
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

function blob(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(x - r, y - r, r * 2, r * 2)
}

function lin(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, stops: string[]) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1)
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s))
  return g
}

const SANS = '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif'

function note(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number, color: string) {
  ctx.save()
  ctx.translate(cx - s / 2, cy - s / 2)
  ctx.scale(s / 24, s / 24)
  ctx.fillStyle = color
  ctx.fill(new Path2D('M10 18.5a3 3 0 1 1-2-2.83V5.2l11-2.2v9.3a3 3 0 1 1-2-2.83V5.44l-7 1.4V18.5z'))
  ctx.restore()
}

type Pos = { top?: number; left?: number; right?: number; bottom?: number }
type Demo = { title: string; artist: string; stops: string[]; rotate: number; pos: Pos; kind: 'frame' | 'poster' | 'strip' }

// Same catalogue the landing page used to float as DOM; now it lives in the
// backdrop so the glass above can refract it.
const DEMOS: Demo[] = [
  { kind: 'frame', title: 'Blinding Lights', artist: 'The Weeknd', stops: ['#3d0066', '#c0003e'], rotate: -13, pos: { top: 0.13, left: 0.03 } },
  { kind: 'frame', title: 'As It Was', artist: 'Harry Styles', stops: ['#8b003f', '#f472b6'], rotate: 10, pos: { top: 0.10, right: 0.03 } },
  { kind: 'frame', title: 'Heat Waves', artist: 'Glass Animals', stops: ['#004a59', '#00bcd4'], rotate: 7, pos: { bottom: 0.15, left: 0.025 } },
  { kind: 'frame', title: 'Levitating', artist: 'Dua Lipa', stops: ['#b34400', '#fbbf24'], rotate: -8, pos: { bottom: 0.12, right: 0.025 } },
  { kind: 'frame', title: 'MONTERO', artist: 'Lil Nas X', stops: ['#1a0040', '#7c3aed'], rotate: 6, pos: { top: 0.47, left: 0.01 } },
  { kind: 'frame', title: 'bad guy', artist: 'Billie Eilish', stops: ['#012817', '#16a34a'], rotate: -7, pos: { top: 0.45, right: 0.01 } },
  { kind: 'poster', title: 'Kill Bill', artist: 'SZA', stops: ['#1e0f33', '#9333ea', '#db2777'], rotate: -11, pos: { top: 0.20, left: 0.19 } },
  { kind: 'poster', title: 'Cruel Summer', artist: 'Taylor Swift', stops: ['#172554', '#2563eb', '#06b6d4'], rotate: 9, pos: { top: 0.18, right: 0.19 } },
  { kind: 'poster', title: 'Espresso', artist: 'Sabrina Carpenter', stops: ['#431407', '#ea580c', '#fbbf24'], rotate: -5, pos: { bottom: 0.22, left: 0.19 } },
  { kind: 'poster', title: 'vampire', artist: 'Olivia Rodrigo', stops: ['#27141d', '#9f1239', '#f43f5e'], rotate: 7, pos: { bottom: 0.20, right: 0.19 } },
  { kind: 'strip', title: 'INDUSTRY BABY', artist: 'Lil Nas X', stops: ['#0f172a', '#1e3a5f'], rotate: -4, pos: { top: 0.70, left: 0.035 } },
  { kind: 'strip', title: 'About Damn Time', artist: 'Lizzo', stops: ['#3d1a00', '#b91c1c'], rotate: 3, pos: { top: 0.68, right: 0.035 } },
]

const SIZE = { frame: [122, 152], poster: [104, 138], strip: [140, 50] } as const

function drawDemo(ctx: CanvasRenderingContext2D, d: Demo, W: number, H: number, dark: boolean) {
  const [w, h] = SIZE[d.kind]
  const x = d.pos.left != null ? d.pos.left * W : W - (d.pos.right ?? 0) * W - w
  const y = d.pos.top != null ? d.pos.top * H : H - (d.pos.bottom ?? 0) * H - h
  ctx.save()
  ctx.translate(x + w / 2, y + h / 2)
  ctx.rotate((d.rotate * Math.PI) / 180)
  ctx.translate(-w / 2, -h / 2)
  ctx.shadowColor = dark ? 'rgba(0,0,0,0.45)' : 'rgba(40,40,80,0.18)'
  ctx.shadowBlur = 36
  ctx.shadowOffsetY = 16

  if (d.kind === 'frame') {
    rr(ctx, 0, 0, w, h, 16)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.62)'
    ctx.fill()
    ctx.shadowColor = 'transparent'
    rr(ctx, 9, 9, w - 18, w - 18, 10)
    ctx.fillStyle = lin(ctx, 9, 9, w - 9, w - 9, d.stops)
    ctx.fill()
    note(ctx, w / 2, 9 + (w - 18) / 2, 24, 'rgba(255,255,255,0.3)')
    ctx.fillStyle = dark ? '#fff' : '#1d1d1f'
    ctx.font = `700 10px ${SANS}`
    ctx.fillText(d.title, 10, w + 6)
    ctx.globalAlpha = 0.6
    ctx.font = `400 9px ${SANS}`
    ctx.fillText(d.artist, 10, w + 18)
  } else if (d.kind === 'poster') {
    rr(ctx, 0, 0, w, h, 13)
    ctx.fillStyle = lin(ctx, 0, 0, w * 0.4, h, d.stops)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.save()
    rr(ctx, 0, 0, w, h, 13)
    ctx.clip()
    ctx.fillStyle = lin(ctx, 0, h, 0, h * 0.45, ['rgba(0,0,0,0.85)', 'rgba(0,0,0,0)'])
    ctx.fillRect(0, h * 0.45, w, h * 0.55)
    ctx.restore()
    note(ctx, w / 2, h * 0.38, 20, 'rgba(255,255,255,0.24)')
    ctx.fillStyle = '#fff'
    ctx.font = `700 10px ${SANS}`
    ctx.fillText(d.title, 9, h - 21)
    ctx.globalAlpha = 0.6
    ctx.font = `400 9px ${SANS}`
    ctx.fillText(d.artist, 9, h - 9)
  } else {
    rr(ctx, 0, 0, w, h, 11)
    ctx.fillStyle = dark ? 'rgba(20,20,24,0.88)' : 'rgba(255,255,255,0.8)'
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.save()
    rr(ctx, 0, 0, w, h, 11)
    ctx.clip()
    ctx.fillStyle = lin(ctx, 0, 0, 50, h, d.stops)
    ctx.fillRect(0, 0, 50, h)
    ctx.restore()
    note(ctx, 25, h / 2, 15, 'rgba(255,255,255,0.32)')
    ctx.fillStyle = dark ? '#fff' : '#1d1d1f'
    ctx.font = `700 10px ${SANS}`
    ctx.fillText(d.title, 59, h / 2 - 1, w - 66)
    ctx.globalAlpha = 0.5
    ctx.font = `400 9px ${SANS}`
    ctx.fillText(d.artist, 59, h / 2 + 11, w - 66)
  }
  ctx.restore()
}

/** Landing: saturated ambient colour plus the demo card catalogue. */
export function paintLanding(theme: Theme, W: number, H: number, accent?: string | null): HTMLCanvasElement {
  const dark = theme === 'dark'
  const { c, ctx } = makeCanvas(W, H, Math.min(window.devicePixelRatio || 1, 2))
  ctx.fillStyle = dark ? '#000' : '#f2f2f7'
  ctx.fillRect(0, 0, W, H)

  const a = dark ? 0.55 : 0.42
  const R = Math.max(W, H)
  blob(ctx, W * 0.08, H * 0.22, R * 0.42, `rgba(175,82,222,${a})`)
  blob(ctx, W * 0.94, H * 0.02, R * 0.38, `rgba(255,45,85,${a})`)
  blob(ctx, W * 0.04, H * 0.98, R * 0.36, `rgba(0,199,190,${a})`)
  blob(ctx, W * 0.98, H * 0.96, R * 0.40, `rgba(255,149,0,${a * 0.85})`)
  blob(ctx, W * 0.5, H * 0.48, R * 0.30, accent ? hexA(accent, dark ? 0.35 : 0.28) : `rgba(0,122,255,${a * 0.5})`)

  if (W >= 700) for (const d of DEMOS) drawDemo(ctx, d, W, H, dark)
  return c
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
  ctx.fillStyle = dark ? '#000' : '#f2f2f7'
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
    blob(ctx, W * 0.2, H * 0.3, R * 0.5, accent ? hexA(accent, 0.7) : 'rgba(0,122,255,0.45)')
    blob(ctx, W * 0.85, H * 0.8, R * 0.45, 'rgba(175,82,222,0.4)')
  }

  // Wash toward the system background so chrome text keeps its contrast.
  ctx.fillStyle = dark ? 'rgba(0,0,0,0.42)' : 'rgba(255,255,255,0.4)'
  ctx.fillRect(0, 0, W, H)
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.75)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, dark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.35)')
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
