'use client'

import React, { forwardRef } from 'react'
import { TrackData, CardConfig } from '@/types'

type Props = {
  track: TrackData
  config: CardConfig
  exportMode?: boolean
  accentColor?: string | null
}

function proxySrc(url: string) {
  // data:/blob: sources are already same-origin and self-contained; sending
  // them through the proxy just yields a 403 and a broken image.
  if (!/^https?:/i.test(url)) return url
  return `/api/proxy-image?url=${encodeURIComponent(url)}`
}

// Every preset is laid out against this design width, then expressed in
// container units — so a card is dimensionally identical whether it renders
// at 320px in the editor or 1200px in a 3× export. Hardcoded px would drift.
const DESIGN_W = 400
const u = (px: number) => `${((px / DESIGN_W) * 100).toFixed(4)}cqw`

function withGlow(shadow: string, hex: string | null | undefined, strength: number): string {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return shadow
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // Two soft layers — close bloom + wide diffuse halo, no hard edges
  const a1 = Math.min(0.55, 0.08 + strength * 0.0047).toFixed(2)
  const a2 = Math.min(0.28, 0.04 + strength * 0.0024).toFixed(2)
  const b1 = Math.round(50 + strength * 1.4)
  const b2 = Math.round(100 + strength * 2.2)
  return (
    `0 0 ${b1}px rgba(${r},${g},${b},${a1}), ` +
    `0 0 ${b2}px rgba(${r},${g},${b},${a2}), ` +
    shadow
  )
}

const DEPTH_SHADOW =
  '0 40px 80px rgba(0,0,0,0.88), 0 12px 32px rgba(0,0,0,0.6)'

function srgbLum(hex: string): number {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return 0
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  const l = c.map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]
}

// ── Liquid-glass material ────────────────────────────────────────
// A DOM/CSS rendition of the kit's materials (liquid-glass.js presets), so the
// glass survives html-to-image export, which can't read the WebGL canvas:
//   frost → blurred, pixel-aligned copy of whatever sits behind the pane
//   tint  → the kit's regular tint, light [0.90 0.95 1.0] / dark [0 0.05 0.1]
//   glare → directional rim light from −45°, weaker on the opposite edge
//   dispersion → faint red/blue fringes along the vertical rims
const GLASS_TINT = {
  light: 'rgba(230,242,255,0.52)',
  dark:  'rgba(4,14,26,0.40)',
  clear: 'rgba(255,255,255,0.03)',
} as const

const CardCanvas = forwardRef<HTMLDivElement, Props>(function CardCanvas(
  { track, config, exportMode = false, accentColor },
  ref
) {
  const fontFamilyMap: Record<CardConfig['font'], string> = {
    'sf-pro':        '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, "Segoe UI", Roboto, sans-serif',
    poppins:         'var(--font-poppins)',
    'dm-serif':      'var(--font-dm-serif)',
    playfair:        'var(--font-playfair)',
    bebas:           'var(--font-bebas)',
    instrument:      'var(--font-instrument)',
    'space-grotesk': 'var(--font-space-grotesk)',
    raleway:         'var(--font-raleway)',
    cormorant:       'var(--font-cormorant)',
    oswald:          'var(--font-oswald)',
  }
  const fontFamily = fontFamilyMap[config.font] ?? fontFamilyMap['sf-pro']
  const cutout = config.bgStyle === 'transparent'
  // A cut-out asset carries no ground shadow — and rasterizing one against
  // transparency smears grey fringes into the alpha channel.
  const shadow = cutout
    ? 'none'
    : config.glowEnabled
      ? withGlow(DEPTH_SHADOW, accentColor, config.glowStrength)
      : DEPTH_SHADOW
  const coverSrc = exportMode && track.coverUrl
    ? proxySrc(track.coverUrl)
    : (track.coverUrl ?? '')
  const hasArt = config.showAlbumArt && !!track.coverUrl
  const accent = accentColor ?? '#e2603a'

  // ── Background / ink resolution ───────────────────────────────
  // bgStyle picks what the card's shell is made of; each preset passes its
  // own look as the `blurred-art` fallback so the default is unchanged.
  // `transparent` strips the shell so an alpha export yields real cut-out.
  const shell = (fallback: string): string =>
    cutout ? 'transparent'
      : config.bgStyle === 'solid' ? config.bgColor
      : config.bgStyle === 'gradient' ? `linear-gradient(160deg, ${accent} 0%, ${accent}55 55%, #141416 100%)`
      : fallback

  // Hue tint rotates the artwork only — the shell already follows the accent.
  const tint = config.tintHue > 0 ? `hue-rotate(${config.tintHue}deg)` : ''
  const withTint = (f?: string) => [f, tint].filter(Boolean).join(' ') || undefined

  // Only these presets are built from glass; the rest are solid designs.
  const isGlassPreset = config.preset === 'glass' || config.preset === 'player'
  // `auto` ink reads what the type actually sits on: a light solid shell or a
  // light glass tint both want dark type.
  const darkInk = config.textColor === 'black'
    || (config.textColor === 'auto' && (
      (config.bgStyle === 'solid' && srgbLum(config.bgColor) > 0.5)
      || (isGlassPreset && config.glassTint === 'light')))
  const inkRGB = darkInk ? '16,16,18' : '255,255,255'
  const ink  = darkInk ? '#101012' : '#ffffff'
  const ink2 = `rgba(${inkRGB},0.66)`
  const ink3 = `rgba(${inkRGB},0.46)`
  const ink4 = `rgba(${inkRGB},0.30)`

  const tone: keyof typeof GLASS_TINT =
    config.glassTint === 'auto' ? (darkInk ? 'light' : 'dark') : config.glassTint
  const glassTint = GLASS_TINT[tone]
  // Clear glass is a lens: nearly sharp. Regular glass frosts with the slider.
  const frost = tone === 'clear' ? 0.5 + config.glassFrost * 0.05 : 4 + config.glassFrost * 0.32
  // Glass-on-glass fill for chips and buttons sitting inside a pane.
  const chipFill = darkInk ? 'rgba(255,255,255,0.46)' : 'rgba(255,255,255,0.13)'
  const paneShadow = cutout ? undefined : `0 ${u(14)} ${u(34)} ${u(-14)} rgba(0,0,0,0.45)`

  const rimA = tone === 'light' ? 0.95 : tone === 'clear' ? 0.7 : 0.5
  const rim = [
    `inset ${u(1.2)} ${u(1.2)} ${u(0.6)} rgba(255,255,255,${rimA})`,
    `inset ${u(-1)} ${u(-1)} ${u(0.6)} rgba(255,255,255,${(rimA * 0.45).toFixed(2)})`,
    `inset 0 0 ${u(14)} rgba(255,255,255,${tone === 'light' ? 0.22 : 0.07})`,
    `inset ${u(2.5)} 0 ${u(3)} ${u(-1.5)} rgba(255,60,130,0.12)`,
    `inset ${u(-2.5)} 0 ${u(3)} ${u(-1.5)} rgba(40,160,255,0.14)`,
  ].join(', ')
  const glare = 'linear-gradient(135deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 68%, rgba(255,255,255,0.10) 100%)'

  // Film grain
  const grainSvg = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
    '<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch"/>' +
    '<feColorMatrix type="saturate" values="0"/></filter>' +
    '<rect width="200" height="200" filter="url(#g)"/></svg>'
  )
  const grainOverlay = config.grainEnabled ? (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
      opacity: config.grainOpacity / 100,
      backgroundImage: `url("data:image/svg+xml,${grainSvg}")`,
      backgroundSize: '200px 200px',
      mixBlendMode: 'overlay' as const,
    }} />
  ) : null

  const vignetteOverlay = config.vignetteEnabled ? (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 21, pointerEvents: 'none',
      background: `radial-gradient(ellipse at center, transparent ${Math.round(55 - config.vignetteStrength * 0.25)}%, rgba(0,0,0,${(config.vignetteStrength / 100 * 0.82).toFixed(2)}) 100%)`,
    }} />
  ) : null

  const scanlineOverlay = config.scanlinesEnabled ? (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 21, pointerEvents: 'none',
      opacity: config.scanlinesOpacity / 100,
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.45) 0px, rgba(0,0,0,0.45) 1px, transparent 1px, transparent 3px)',
    }} />
  ) : null

  const holoOverlay = config.holoEnabled ? (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 21, pointerEvents: 'none',
      opacity: config.holoOpacity / 100,
      background: [
        'linear-gradient(135deg, rgba(255,0,128,0.22) 0%, transparent 30%)',
        'linear-gradient(225deg, rgba(0,200,255,0.20) 0%, transparent 30%)',
        'linear-gradient(315deg, rgba(120,255,60,0.18) 0%, transparent 30%)',
        'linear-gradient(45deg, rgba(255,140,0,0.20) 0%, transparent 30%)',
      ].join(', '),
      mixBlendMode: 'screen' as const,
    }} />
  ) : null

  const justify = config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start'
  const fx = <>{grainOverlay}{vignetteOverlay}{scanlineOverlay}{holoOverlay}</>

  // ── Shared bits ───────────────────────────────────────────────
  // Focal point and zoom are user-controlled: `cover` alone crops to centre,
  // which throws away the subject on plenty of real album art.
  const artPos = `${config.artX}% ${config.artY}%`
  const artScale = config.artZoom / 100

  const Art = ({ radius }: { radius: number }) =>
    hasArt ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: artPos, display: 'block',
          border: 'none', outline: 'none', borderRadius: u(radius),
          filter: withTint(),
          transform: artScale === 1 ? undefined : `scale(${artScale})`,
          transformOrigin: artPos,
        }}
      />
    ) : null

  // A frosted copy of an Art box, laid out so it lines up pixel-for-pixel
  // with the art behind the pane. `at` places the pane's origin inside the
  // art box; `w`/`h` are the art box's size. Uses `filter`, not
  // `backdrop-filter`, which html-to-image can't rasterize.
  const AlignedArt = ({ at, w, h, blur }: {
    at: React.CSSProperties; w: number; h: number; blur: number
  }) =>
    hasArt ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt="" aria-hidden
        style={{
          position: 'absolute', ...at, width: u(w), height: u(h), maxWidth: 'none',
          objectFit: 'cover', objectPosition: artPos, display: 'block',
          filter: withTint(`blur(${u(blur)}) saturate(180%)`),
          transform: artScale === 1 ? undefined : `scale(${artScale})`,
          transformOrigin: artPos,
        }}
      />
    ) : null

  // Heavily blurred art filling a whole surface (shell backdrops).
  const FrostedArt = ({ blur, brightness = 0.9, position = 'center' }: {
    blur: number; brightness?: number; position?: string
  }) =>
    hasArt ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt="" aria-hidden
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: position,
          filter: withTint(`blur(${u(blur)}) saturate(165%) brightness(${brightness})`),
          transform: 'scale(1.25)', display: 'block', border: 'none', outline: 'none',
        }}
      />
    ) : null

  // Rim light + dispersion, drawn above the pane's contents but under its text.
  const Rim = ({ z = 2 }: { z?: number }) => (
    <span aria-hidden style={{
      position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
      zIndex: z, boxShadow: rim,
    }} />
  )

  /** A liquid-glass pane. Pass `backdrop` when it floats over sharp artwork. */
  const Pane = ({ radius, style, inner, children, backdrop, fill = glassTint, lift = true }: {
    radius: number
    style?: React.CSSProperties
    inner?: React.CSSProperties
    children?: React.ReactNode
    backdrop?: { at: React.CSSProperties; w: number; h: number }
    fill?: string
    lift?: boolean
  }) => (
    <div style={{
      position: 'relative', borderRadius: u(radius), overflow: 'hidden', isolation: 'isolate',
      boxShadow: lift ? paneShadow : undefined, flexShrink: 0,
      ...style,
    }}>
      {backdrop && <AlignedArt {...backdrop} blur={frost} />}
      <span style={{ position: 'absolute', inset: 0, background: fill }} />
      <span style={{ position: 'absolute', inset: 0, background: glare }} />
      <Rim />
      <div style={{ position: 'relative', zIndex: 3, ...inner }}>{children}</div>
    </div>
  )

  // Brand mark — the app's glyph as a tiny glass tile.
  function BrandMark({ size, tone: t = 'light' }: { size: number; tone?: 'light' | 'dark' | 'accent' }) {
    const bg = t === 'light'
      ? 'linear-gradient(135deg,rgba(255,255,255,0.98) 0%,rgba(226,232,240,0.9) 100%)'
      : t === 'accent' ? accent
      : 'linear-gradient(135deg,#2c2c2e 0%,#111113 100%)'
    const dot = t === 'dark' ? 'rgba(255,255,255,0.94)' : 'rgba(10,10,12,0.88)'
    return (
      <span style={{
        width: u(size), height: u(size), borderRadius: u(size * 0.3),
        background: bg, display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0,
        boxShadow: `inset 0 ${u(0.6)} 0 rgba(255,255,255,0.7), 0 ${u(1)} ${u(3)} rgba(0,0,0,0.25)`,
      }}>
        <span style={{
          width: u(size * 0.4), height: u(size * 0.4),
          borderRadius: u(size * 0.1), background: dot, display: 'block',
        }} />
      </span>
    )
  }

  const Title = ({ size, color = ink, weight = 800, clamp }: {
    size: number; color?: string; weight?: number; clamp?: number
  }) => config.showTitle ? (
    <p style={{
      margin: 0, fontSize: u(size), fontWeight: weight, color,
      letterSpacing: '-0.025em', lineHeight: 1.12,
      ...(clamp ? {
        display: '-webkit-box', WebkitLineClamp: clamp,
        WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
      } : { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
    } as React.CSSProperties}>{track.title}</p>
  ) : null

  const Artist = ({ size, color = ink2, weight = 400 }: {
    size: number; color?: string; weight?: number
  }) => config.showArtist ? (
    <p style={{
      margin: 0, fontSize: u(size), fontWeight: weight, color, lineHeight: 1.3,
      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    }}>{track.artist}</p>
  ) : null

  const Meta = ({ size, color, gap = 5 }: { size: number; color: string; gap?: number }) => {
    if (!config.showYear && !config.showDuration) return null
    return (
      <div style={{ display: 'flex', gap: u(gap), alignItems: 'center', justifyContent: justify }}>
        {config.showYear && <span style={{ fontSize: u(size), color }}>{track.releaseYear}</span>}
        {config.showYear && config.showDuration && <span style={{ fontSize: u(size), color }}>·</span>}
        {config.showDuration && <span style={{ fontSize: u(size), color }}>{track.duration}</span>}
      </div>
    )
  }

  // `clamp` is the preset's own ceiling; the user setting narrows within it so
  // a tight layout can't be overrun by asking for four lines.
  const Lyric = ({ size, color, clamp = 2, rule }: {
    size: number; color: string; clamp?: number; rule?: string
  }) => {
    if (!config.showLyrics || !config.lyricQuote) return null
    const text = config.lyricStyle === 'quoted' ? `“${config.lyricQuote}”` : config.lyricQuote
    return (
      <p style={{
        margin: 0, fontSize: u(size * (config.lyricScale / 100)),
        fontStyle: config.lyricStyle === 'italic' ? 'italic' : 'normal',
        color, lineHeight: 1.45,
        ...(rule ? { borderLeft: `${u(2)} solid ${rule}`, paddingLeft: u(8) } : {}),
        display: '-webkit-box', WebkitLineClamp: Math.min(config.lyricLines, clamp + 2),
        WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
      } as React.CSSProperties}>{text}</p>
    )
  }

  const ShuffleIcon = ({ size }: { size: number }) => (
    <svg viewBox="0 0 16 16" width={u(size)} height={u(size)} fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M11 2.5 14 5l-3 2.5M11 8.5 14 11l-3 2.5M2 5h3.5L9 11h5M2 11h3.5l1.2-2" />
    </svg>
  )
  const PlayGlyph = ({ size, color = 'currentColor' }: { size: number; color?: string }) => (
    <svg viewBox="0 0 16 16" width={u(size)} height={u(size)} fill={color} style={{ flexShrink: 0 }}>
      <path d="M5 3.2v9.6L13 8z" />
    </svg>
  )
  const NoteGlyph = ({ size, color }: { size: number; color: string }) => (
    <svg viewBox="0 0 24 24" width={u(size)} height={u(size)} fill={color}>
      <path d="M10 18.5a3 3 0 1 1-2-2.83V5.2l11-2.2v9.3a3 3 0 1 1-2-2.83V5.44l-7 1.4V18.5z" />
    </svg>
  )

  // Ticket-stub die-cut notches — circles in the surrounding colour, straddling
  // the stub's top edge so the seam reads as perforated card stock.
  const Notches = ({ bg, size, top }: { bg: string; size: number; top: number }) => (
    <>
      <span style={{ position: 'absolute', left: u(-size / 2), top: u(top), width: u(size), height: u(size), borderRadius: '50%', background: bg, zIndex: 3 }} />
      <span style={{ position: 'absolute', right: u(-size / 2), top: u(top), width: u(size), height: u(size), borderRadius: '50%', background: bg, zIndex: 3 }} />
    </>
  )

  const root = (extra: React.CSSProperties): React.CSSProperties => ({
    position: 'relative', overflow: 'hidden', width: '100%',
    fontFamily, containerType: 'inline-size', boxShadow: shadow,
    isolation: 'isolate',
    ...extra,
  })

  // ── GLASS — full-bleed art, floating liquid-glass panel ───────
  if (config.preset === 'glass') {
    const inset = config.artPadding
    // Concentric corners: the panel's radius is the card's minus the gap.
    const radius = Math.max(30 - inset, 16)
    return (
      <div ref={ref} style={root({
        aspectRatio: '4 / 5', borderRadius: u(30),
        background: shell(`linear-gradient(160deg, ${accent} 0%, #1c1c1e 100%)`),
      })}>
        <Art radius={0} />
        {!hasArt && (
          <span style={{ position: 'absolute', inset: 0, bottom: '30%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <NoteGlyph size={52} color="rgba(255,255,255,0.22)" />
          </span>
        )}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.12) 0%, transparent 26%, transparent 60%, rgba(0,0,0,0.22) 100%)',
        }} />
        <Pane radius={999} lift={false}
          style={{ position: 'absolute', top: u(14), right: u(14), zIndex: 6 }}
          backdrop={{ at: { top: u(-14), right: u(-14) }, w: 400, h: 500 }}
          inner={{ display: 'flex', alignItems: 'center', gap: u(5), padding: `${u(4)} ${u(10)} ${u(4)} ${u(4)}` }}>
          <BrandMark size={14} />
          <span style={{ fontSize: u(8), fontWeight: 600, letterSpacing: '0.08em', color: ink, textTransform: 'uppercase' }}>FrameSound</span>
        </Pane>
        {fx}

        <Pane radius={radius}
          style={{ position: 'absolute', left: u(inset), right: u(inset), bottom: u(inset), zIndex: 10 }}
          backdrop={{ at: { left: u(-inset), bottom: u(-inset) }, w: 400, h: 500 }}
          inner={{
            padding: `${u(16)} ${u(18)} ${u(18)}`,
            display: 'flex', flexDirection: 'column', gap: u(3), textAlign: config.textAlign,
          }}>
          <Title size={25} />
          <Artist size={14} />
          <Meta size={11} color={ink3} />
          <div style={{ height: u(3) }} />
          <Lyric size={12} color={ink2} rule={ink4} />
        </Pane>
      </div>
    )
  }

  // ── TICKET / TAG — card body + die-cut stub beneath ───────────
  // Both share one structure (art panel, body that warms into the accent,
  // perforated stub tucked under the card); they differ in the stub payload.
  if (config.preset === 'ticket' || config.preset === 'tag') {
    const isTag = config.preset === 'tag'
    // Notches work by painting the shell colour over the stub's seam, so they
    // only read as die-cuts when there is a solid shell to punch through.
    const stubSurround =
      config.bgStyle === 'solid' ? config.bgColor
        : config.bgStyle === 'gradient' ? '#141416'
          : '#26221f'
    const showNotches = config.bgStyle !== 'transparent'
    return (
      <div ref={ref} style={root({
        aspectRatio: '4 / 5', borderRadius: u(34), background: shell('#26221f'),
        display: 'flex', flexDirection: 'column',
        padding: `${u(13)} ${u(13)} ${u(15)}`,
      })}>
        {fx}
        {/* Body — art sits on a surface that warms into the accent downward */}
        <div style={{
          position: 'relative', borderRadius: u(24), overflow: 'hidden',
          flex: 1, display: 'flex', flexDirection: 'column',
          background: `linear-gradient(180deg, #3a3330 0%, ${accent}cc 78%, ${accent} 100%)`,
          boxShadow: `0 ${u(14)} ${u(26)} ${u(-12)} rgba(0,0,0,0.6)`,
        }}>
          <div style={{
            position: 'relative', margin: u(9), marginBottom: 0,
            aspectRatio: '1 / 1', borderRadius: u(18), overflow: 'hidden',
            background: config.showAlbumArt && track.coverUrl
              ? '#111'
              : `radial-gradient(circle at 50% 46%, ${accent} 0%, ${accent}77 38%, #f3ead9 72%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Art radius={0} />
            {!(config.showAlbumArt && track.coverUrl) && (
              <NoteGlyph size={44} color="rgba(0,0,0,0.22)" />
            )}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: u(8),
            padding: `${u(11)} ${u(14)} ${u(12)}`, flex: 1, minHeight: 0,
          }}>
            <div style={{ flex: 1, minWidth: 0, textAlign: config.textAlign }}>
              <Title size={17} />
              <Artist size={11.5} />
              {isTag && <Meta size={10.5} color={ink3} />}
            </div>
            {!isTag && <span style={{ color: 'rgba(255,255,255,0.85)' }}><ShuffleIcon size={14} /></span>}
          </div>
        </div>

        {/* Perforated stub — narrower, tucked under the card body */}
        <div style={{
          position: 'relative', width: '78%', margin: `${u(-2)} auto 0`,
          background: accent, borderRadius: `0 0 ${u(14)} ${u(14)}`,
          minHeight: u(isTag ? 40 : 50), flexShrink: 0,
          display: 'flex', alignItems: 'center',
          justifyContent: isTag ? 'center' : 'flex-start',
          gap: u(10), padding: `${u(8)} ${u(13)}`,
        }}>
          {showNotches && <Notches bg={stubSurround} size={11} top={-5} />}
          {isTag ? (
            <BrandMark size={22} tone="light" />
          ) : (
            <>
              <span style={{
                flexShrink: 0, width: u(38), height: u(38), borderRadius: u(9),
                background: 'rgba(255,255,255,0.9)', display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: u(7), fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(0,0,0,0.55)', textTransform: 'uppercase', lineHeight: 1 }}>Year</span>
                <span style={{ fontSize: u(15), fontWeight: 800, color: '#141414', lineHeight: 1.1 }}>{track.releaseYear || '—'}</span>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: u(12.5), fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.album || track.artist}
                </span>
                <span style={{ display: 'block', fontSize: u(10.5), color: 'rgba(255,255,255,0.82)', marginTop: u(1) }}>
                  {[track.releaseYear, track.duration].filter(Boolean).join('  •  ')}
                </span>
              </span>
              <BrandMark size={16} tone="light" />
            </>
          )}
        </div>
      </div>
    )
  }

  // ── PROFILE — social profile card ─────────────────────────────
  if (config.preset === 'profile') {
    const handle = '@' + (track.artist.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'artist')
    return (
      <div ref={ref} style={root({
        aspectRatio: '4 / 5', borderRadius: u(30), background: shell('#1b1b1d'),
        display: 'flex', flexDirection: 'column', padding: u(10),
      })}>
        {fx}
        {/* Photo */}
        <div style={{
          position: 'relative', borderRadius: u(22), overflow: 'hidden',
          aspectRatio: '1 / 1', flexShrink: 0,
          background: `linear-gradient(140deg, ${accent}44 0%, #f6ece4 65%)`,
        }}>
          <Art radius={0} />
        </div>

        {/* Identity row — overlaps the photo's lower edge */}
        <div style={{
          position: 'relative', zIndex: 4, marginTop: u(-30),
          padding: `0 ${u(10)}`, display: 'flex', alignItems: 'flex-end', gap: u(10),
        }}>
          <span style={{
            position: 'relative', width: u(58), height: u(58), borderRadius: u(16),
            overflow: 'hidden', flexShrink: 0, background: '#2a2a2c',
            border: `${u(3)} solid #1b1b1d`,
            boxShadow: `0 ${u(6)} ${u(14)} rgba(0,0,0,0.45)`,
          }}>
            <Art radius={0} />
          </span>
          <span style={{ flex: 1, minWidth: 0, paddingBottom: u(3) }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: u(4) }}>
              {config.showTitle && (
                <span style={{ fontSize: u(16), fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {track.title}
                </span>
              )}
              <svg viewBox="0 0 16 16" width={u(14)} height={u(14)} style={{ flexShrink: 0 }}>
                <path d="M8 0.6 9.9 2 12.2 1.9 12.9 4.1 14.8 5.4 14.2 7.6 14.8 9.8 12.9 11.1 12.2 13.3 9.9 13.2 8 14.6 6.1 13.2 3.8 13.3 3.1 11.1 1.2 9.8 1.8 7.6 1.2 5.4 3.1 4.1 3.8 1.9 6.1 2Z" fill={accent} />
                <path d="M5 7.8 7 9.7 11 5.6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            {config.showArtist && (
              <span style={{ display: 'block', fontSize: u(11.5), color: 'rgba(255,255,255,0.45)', marginTop: u(1) }}>{handle}</span>
            )}
          </span>
          <span style={{
            flexShrink: 0, padding: `${u(7)} ${u(15)}`, borderRadius: u(999),
            background: '#fff', color: '#0d0d0f', fontSize: u(11.5), fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', gap: u(4), marginBottom: u(3),
          }}>
            <PlayGlyph size={9} color="#0d0d0f" /> Play
          </span>
        </div>

        {/* Bio + stats */}
        <div style={{ padding: `${u(12)} ${u(12)} 0`, display: 'flex', flexDirection: 'column', gap: u(9), flex: 1, minHeight: 0 }}>
          {config.showLyrics && config.lyricQuote ? (
            <Lyric size={12.5} color="rgba(255,255,255,0.78)" clamp={2} />
          ) : (
            <p style={{ margin: 0, fontSize: u(12.5), color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>
              {track.album}
            </p>
          )}
          <div style={{ display: 'flex', gap: u(16) }}>
            {config.showYear && (
              <span style={{ fontSize: u(12) }}>
                <b style={{ color: '#fff', fontWeight: 700 }}>{track.releaseYear}</b>
                <span style={{ color: 'rgba(255,255,255,0.42)' }}> Released</span>
              </span>
            )}
            {config.showDuration && (
              <span style={{ fontSize: u(12) }}>
                <b style={{ color: '#fff', fontWeight: 700 }}>{track.duration}</b>
                <span style={{ color: 'rgba(255,255,255,0.42)' }}> Length</span>
              </span>
            )}
          </div>
          <div style={{ marginTop: 'auto', paddingBottom: u(4), display: 'flex', alignItems: 'center', gap: u(6) }}>
            <BrandMark size={15} tone="dark" />
            <span style={{ fontSize: u(11), color: 'rgba(255,255,255,0.4)' }}>framesound.app</span>
          </div>
        </div>
      </div>
    )
  }

  // ── PLAYER — floating now-playing glass widget ────────────────
  if (config.preset === 'player') {
    const handle = '@' + (track.artist.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'artist')
    const circle = (size: number, child: React.ReactNode, primary = false) => (
      <span style={{
        width: u(size), height: u(size), borderRadius: '50%', flexShrink: 0,
        background: primary ? ink : chipFill, color: primary ? (darkInk ? '#fff' : '#111') : ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: primary ? undefined : `inset ${u(0.8)} ${u(0.8)} 0 rgba(255,255,255,${darkInk ? 0.7 : 0.25})`,
      }}>{child}</span>
    )
    return (
      <div ref={ref} style={root({
        aspectRatio: '1 / 1', borderRadius: u(28),
        background: shell(`linear-gradient(150deg, ${accent} 0%, #2a2a2e 55%, #131315 100%)`),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      })}>
        {config.bgStyle === 'blurred-art' && (
          <>
            <FrostedArt blur={46} brightness={tone === 'light' ? 0.95 : 0.62} />
            <span style={{ position: 'absolute', inset: 0, background: tone === 'light' ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)' }} />
          </>
        )}
        {fx}

        <Pane radius={24} style={{ width: '66%', zIndex: 10 }} inner={{ padding: u(9) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: u(6), marginBottom: u(8) }}>
            <span style={{
              flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: u(6),
              background: chipFill, borderRadius: u(999),
              padding: `${u(4)} ${u(10)} ${u(4)} ${u(4)}`,
            }}>
              <span style={{ position: 'relative', width: u(22), height: u(22), borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#3a3a3c' }}>
                <Art radius={0} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                {config.showTitle && (
                  <span style={{ display: 'block', fontSize: u(10), fontWeight: 700, color: ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                    {track.title}
                  </span>
                )}
                {config.showArtist && (
                  <span style={{ display: 'block', fontSize: u(8.5), color: ink2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {handle}
                  </span>
                )}
              </span>
            </span>
            {circle(24, (
              <svg viewBox="0 0 16 16" width={u(10)} height={u(10)} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2v8M5 5l3-3 3 3M3 9v4a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" />
              </svg>
            ))}
            {circle(24, (
              <svg viewBox="0 0 16 16" width={u(10)} height={u(10)} fill="currentColor">
                <path d="M8 14s-5.5-3.4-5.5-7.4A3.1 3.1 0 0 1 8 4.6a3.1 3.1 0 0 1 5.5 2c0 4-5.5 7.4-5.5 7.4z" />
              </svg>
            ))}
          </div>

          {/* Artwork — concentric with the pane: 24 − 9 */}
          <div style={{ position: 'relative', aspectRatio: '5 / 4', borderRadius: u(15), overflow: 'hidden', background: hasArt ? '#2a2a2c' : `linear-gradient(150deg, ${accent}, #2a2a2e)` }}>
            <Art radius={0} />
            <span style={{ position: 'absolute', bottom: u(7), right: u(7), zIndex: 3 }}>
              <BrandMark size={16} tone="light" />
            </span>
          </div>

          {/* Progress — iOS 26 slider: thin track, capsule thumb */}
          <div style={{ padding: `${u(10)} ${u(4)} 0` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: u(5) }}>
              <span style={{ fontSize: u(9.5), color: ink2, fontWeight: 500 }}>0:00</span>
              {config.showDuration && (
                <span style={{ fontSize: u(9.5), color: ink2, fontWeight: 500 }}>-{track.duration}</span>
              )}
            </div>
            <div style={{ position: 'relative', height: u(4), borderRadius: u(4), background: `rgba(${inkRGB},0.22)` }}>
              <div style={{ width: '32%', height: '100%', borderRadius: u(4), background: ink }} />
              <span style={{
                position: 'absolute', left: '32%', top: '50%', transform: 'translate(-50%, -50%)',
                width: u(14), height: u(9), borderRadius: u(999), background: '#fff',
                boxShadow: `0 ${u(1)} ${u(3)} rgba(0,0,0,0.3)`,
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: u(10), padding: `${u(10)} 0 ${u(4)}` }}>
            {(['prev', 'play', 'next'] as const).map(k => (
              <React.Fragment key={k}>
                {k === 'play'
                  ? circle(30, <PlayGlyph size={13} />, true)
                  : circle(26, (
                    <svg viewBox="0 0 16 16" width={u(11)} height={u(11)} fill="currentColor"
                      style={{ transform: k === 'prev' ? 'scaleX(-1)' : undefined }}>
                      <path d="M12 3v10h-1.5V3H12zM9.5 8l-7-5v10l7-5z" />
                    </svg>
                  ))}
              </React.Fragment>
            ))}
          </div>
        </Pane>
      </div>
    )
  }

  // ── BLOOM — full-bleed art, text laid straight onto it ────────
  if (config.preset === 'bloom') {
    return (
      <div ref={ref} style={root({
        aspectRatio: '4 / 5', borderRadius: u(30),
        background: shell(`linear-gradient(168deg, #2b2028 0%, ${accent} 58%, ${accent}dd 100%)`),
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      })}>
        <Art radius={0} />
        {!(config.showAlbumArt && track.coverUrl) && (
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <NoteGlyph size={46} color="rgba(255,255,255,0.16)" />
          </span>
        )}
        {/* Top sheen + bottom scrim so text always holds against the art */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 26%, transparent 52%, rgba(0,0,0,0.62) 100%)',
        }} />
        <span style={{ position: 'absolute', top: u(16), right: u(16), zIndex: 6, opacity: 0.72 }}>
          <BrandMark size={17} tone="light" />
        </span>
        {fx}

        <div style={{
          position: 'relative', zIndex: 5,
          padding: `${u(24)} ${u(26)} ${u(28)}`,
          display: 'flex', flexDirection: 'column', gap: u(4),
          textAlign: config.textAlign,
        }}>
          <Lyric size={13} color={ink2} clamp={2} />
          <Title size={30} />
          <Artist size={17} />
          <Meta size={12} color={ink3} />
        </div>
      </div>
    )
  }

  // ── BEZEL — art inset in a moulded shell, text on the shell ───
  return (
    <div ref={ref} style={root({
      aspectRatio: '4 / 5', borderRadius: u(30),
      background: shell('linear-gradient(158deg, #333336 0%, #232326 46%, #171719 100%)'),
      display: 'flex', flexDirection: 'column',
      padding: `${u(14)} ${u(14)} 0`,
    })}>
      {/* Specular rim + gloss describe a moulded shell. They are additive white,
          so with no shell behind them they would ghost onto a cut-out export. */}
      {config.bgStyle !== 'transparent' && (
        <>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: u(30), zIndex: 6, pointerEvents: 'none',
            boxShadow: `inset ${u(1.5)} ${u(1.5)} 0 rgba(255,255,255,0.34), inset 0 0 ${u(5)} ${u(1)} rgba(255,255,255,0.14), inset ${u(-1)} ${u(-1)} 0 rgba(0,0,0,0.5)`,
          }} />
          <div style={{
            position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
            background: 'linear-gradient(152deg, rgba(255,255,255,0.13) 0%, transparent 30%)',
          }} />
        </>
      )}
      <span style={{ position: 'absolute', top: u(16), right: u(16), zIndex: 7, opacity: 0.55 }}>
        <BrandMark size={15} tone="dark" />
      </span>
      {fx}

      <div style={{
        position: 'relative', aspectRatio: '1 / 1', borderRadius: u(20),
        overflow: 'hidden', flexShrink: 0,
        background: config.showAlbumArt && track.coverUrl
          ? '#111'
          : `linear-gradient(165deg, ${accent} 0%, ${accent}aa 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `inset 0 ${u(2)} ${u(8)} rgba(0,0,0,0.55), 0 ${u(8)} ${u(18)} ${u(-8)} rgba(0,0,0,0.6)`,
      }}>
        <Art radius={0} />
        {!(config.showAlbumArt && track.coverUrl) && (
          <NoteGlyph size={44} color="rgba(0,0,0,0.24)" />
        )}
      </div>

      <div style={{
        position: 'relative', zIndex: 7, flex: 1, minHeight: 0,
        padding: `${u(15)} ${u(4)} ${u(16)}`,
        display: 'flex', flexDirection: 'column', gap: u(3),
        justifyContent: 'center', textAlign: config.textAlign,
      }}>
        <Title size={27} />
        <Artist size={17} />
        <Meta size={12} color={ink4} />
        <Lyric size={12} color={ink3} clamp={1} />
      </div>
    </div>
  )
})

CardCanvas.displayName = 'CardCanvas'
export default CardCanvas
