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
  return `/api/proxy-image?url=${encodeURIComponent(url)}`
}

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

// No hard inset edges — depth comes from drop shadows only
const DEPTH_SHADOW =
  '0 40px 80px rgba(0,0,0,0.88), 0 12px 32px rgba(0,0,0,0.6)'

const CardCanvas = forwardRef<HTMLDivElement, Props>(function CardCanvas(
  { track, config, exportMode = false, accentColor },
  ref
) {
  const fontFamilyMap: Record<CardConfig['font'], string> = {
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
  const fontFamily = fontFamilyMap[config.font]
  const textColor = config.textColor === 'black' ? '#000000' : '#ffffff'
  const shadow = config.glowEnabled
    ? withGlow(DEPTH_SHADOW, accentColor, config.glowStrength)
    : DEPTH_SHADOW
  const coverSrc = exportMode && track.coverUrl
    ? proxySrc(track.coverUrl)
    : (track.coverUrl ?? '')

  // Watermark — per-preset position to stay clear of bars and text
  function Watermark({ position }: { position?: 'top-right' | 'bottom-right' }) {
    const isTop = position === 'top-right'
    return (
      <div style={{
        position: 'absolute',
        top: isTop ? 7 : undefined, bottom: isTop ? undefined : 7,
        right: 9,
        fontFamily: 'var(--font-poppins)',
        fontSize: 7, letterSpacing: '0.11em',
        textTransform: 'uppercase' as const,
        color: 'rgba(255,255,255,0.12)',
        zIndex: 6, pointerEvents: 'none',
      }}>FrameSound</div>
    )
  }

  // Film grain
  const grainSvg = encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
    '<filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch"/>' +
    '<feColorMatrix type="saturate" values="0"/></filter>' +
    '<rect width="200" height="200" filter="url(#g)"/></svg>'
  )
  const grainOverlay = config.grainEnabled ? (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 8, pointerEvents: 'none',
      opacity: config.grainOpacity / 100,
      backgroundImage: `url("data:image/svg+xml,${grainSvg}")`,
      backgroundSize: '200px 200px',
      mixBlendMode: 'overlay' as const,
    }} />
  ) : null

  // Vignette — dark radial fade at edges, no hard boundary
  const vignetteOverlay = config.vignetteEnabled ? (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none',
      background: `radial-gradient(ellipse at center, transparent ${Math.round(55 - config.vignetteStrength * 0.25)}%, rgba(0,0,0,${(config.vignetteStrength / 100 * 0.82).toFixed(2)}) 100%)`,
    }} />
  ) : null

  // Scanlines — subtle CRT horizontal lines
  const scanlineOverlay = config.scanlinesEnabled ? (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none',
      opacity: config.scanlinesOpacity / 100,
      backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.45) 0px, rgba(0,0,0,0.45) 1px, transparent 1px, transparent 3px)',
    }} />
  ) : null

  // Holographic shimmer — soft rainbow screen blend
  const holoOverlay = config.holoEnabled ? (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none',
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

  // Shared experimental layers (applied to all presets)
  const experimentalLayers = <>{vignetteOverlay}{scanlineOverlay}{holoOverlay}</>

  function MetaRow({ color, size, gap }: { color: string; size: number; gap: number }) {
    if (!config.showYear && !config.showDuration) return null
    return (
      <div style={{ display: 'flex', gap, alignItems: 'center' }}>
        {config.showYear && <span style={{ fontSize: size, color }}>{track.releaseYear}</span>}
        {config.showYear && config.showDuration && <span style={{ fontSize: size, color }}>·</span>}
        {config.showDuration && <span style={{ fontSize: size, color }}>{track.duration}</span>}
      </div>
    )
  }

  // Brand glyph — same rounded-square-in-a-square mark as the app chrome's
  // own logo, reused as a compact watermark. Each preset places/tones it
  // differently so the brand mark never looks identical twice.
  function BrandMark({ size = 20, tone = 'light' }: { size?: number; tone?: 'light' | 'dark' }) {
    return (
      <div style={{
        width: size, height: size, borderRadius: size * 0.28,
        background: tone === 'light'
          ? 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.78) 100%)'
          : 'linear-gradient(135deg, rgba(20,20,22,0.92) 0%, rgba(20,20,22,0.72) 100%)',
        display: 'grid', placeItems: 'center', flexShrink: 0,
        boxShadow: tone === 'light' ? '0 1px 3px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.35)',
      }}>
        <div style={{
          width: size * 0.42, height: size * 0.42, borderRadius: size * 0.09,
          background: tone === 'light' ? 'rgba(10,10,12,0.85)' : 'rgba(255,255,255,0.92)',
        }} />
      </div>
    )
  }

  const ExpandIcon = ({ size = 13 }: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2H2v4M10 14h4v-4M2 14l5-5M14 2l-5 5" />
    </svg>
  )
  const ShareIcon = ({ size = 12 }: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v8M5 5l3-3 3 3M3 9v4a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" />
    </svg>
  )
  const HeartIcon = ({ size = 12 }: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor">
      <path d="M8 14s-5.5-3.4-5.5-7.4A3.1 3.1 0 0 1 8 4.6a3.1 3.1 0 0 1 5.5 2c0 4-5.5 7.4-5.5 7.4z" />
    </svg>
  )
  const PrevIcon = ({ size = 14 }: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor">
      <path d="M4 3v10h1.5V3H4zm2.5 5 7-5v10l-7-5z" />
    </svg>
  )
  const NextIcon = ({ size = 14 }: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor">
      <path d="M12 3v10h-1.5V3H12zM9.5 8l-7-5v10l7-5z" />
    </svg>
  )
  const PlayIcon = ({ size = 16 }: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor"><path d="M5 3.5v9l8-4.5-8-4.5z" /></svg>
  )
  const CheckBadge = ({ color, size = 15 }: { color: string; size?: number }) => (
    <span style={{
      width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg viewBox="0 0 16 16" width={size * 0.62} height={size * 0.62} fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 8.5 6.3 12 13 4" />
      </svg>
    </span>
  )
  const LinkIcon = ({ size = 11 }: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 9.5 14 2M9 2h5v5M13 9v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" />
    </svg>
  )
  // Ticket-stub die-cut notches — two circles matching the card's own
  // background, straddling the stub bar's left/right mid-edge.
  function StubNotches({ bg }: { bg: string }) {
    return (
      <>
        <div style={{ position: 'absolute', left: -9, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', background: bg, zIndex: 2 }} />
        <div style={{ position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', background: bg, zIndex: 2 }} />
      </>
    )
  }

  const cardBg = '#161618'

  // ── GLASS ─────────────────────────────────────────────────────
  // True liquid glass: full-bleed art behind, a genuinely translucent
  // frosted panel (real backdrop-filter refraction, not a fake overlay)
  // floats over it, with a bright contour rim tracing its whole edge —
  // the same "chip floating in a track" language as an iOS glass pill.
  if (config.preset === 'glass') {
    const inset = config.artPadding // reused: panel inset from card edges
    const fallbackBg = accentColor
      ? `linear-gradient(160deg, color-mix(in srgb, ${accentColor} 22%, #2b2b30) 0%, #232327 45%, #18181a 100%)`
      : 'linear-gradient(160deg, #2b2b30 0%, #232327 45%, #18181a 100%)'

    return (
      <div ref={ref} style={{
        position: 'relative', overflow: 'hidden', width: '100%', aspectRatio: '4 / 5',
        borderRadius: '28px', fontFamily, containerType: 'inline-size',
        background: fallbackBg,
        boxShadow: shadow,
      }}>
        {config.showAlbumArt && track.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none', zIndex: 0 }}
          />
        )}
        {/* Gentle top/bottom depth so the glass panel reads clearly against busy art */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.30) 100%)',
        }} />
        <Watermark position="top-right" />
        {grainOverlay}
        {experimentalLayers}

        {/* Floating frosted glass panel — a blurred clone of the art (real `filter`,
            not `backdrop-filter`: Chromium doesn't sample <img> backdrops reliably,
            and `filter` rasterizes safely in exports) sits clipped beneath a
            translucent tint, giving genuine optical frosting. */}
        <div style={{
          position: 'absolute', left: inset, right: inset, bottom: inset,
          zIndex: 5, borderRadius: 20, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.32)',
          boxShadow: [
            'inset 0 1.5px 0 rgba(255,255,255,0.65)',
            'inset 0 -1px 0 rgba(255,255,255,0.14)',
            '0 2px 0 rgba(255,255,255,0.10)',
            '0 22px 44px -14px rgba(0,0,0,0.55)',
            '0 6px 16px -6px rgba(0,0,0,0.38)',
          ].join(', '),
        }}>
          {config.showAlbumArt && track.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt="" aria-hidden
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center 80%',
                filter: 'blur(20px) saturate(170%) brightness(1.05)',
                transform: 'scale(1.15)', display: 'block', border: 'none', outline: 'none',
              }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: fallbackBg }} />
          )}
          {/* Translucency tint over the blurred backdrop */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(155deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.10) 55%, rgba(255,255,255,0.19) 100%)',
          }} />
          {/* Diagonal sheen sweep across the glass */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            background: 'radial-gradient(120% 70% at 15% -20%, rgba(255,255,255,0.35), transparent 55%)',
            mixBlendMode: 'screen',
          }} />
          <div style={{
            position: 'relative', zIndex: 1,
            padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 3,
            textAlign: config.textAlign,
          }}>
            {config.showTitle && (
              <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15 }}>{track.title}</p>
            )}
            {config.showArtist && (
              <p style={{ margin: 0, fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.68)' }}>{track.artist}</p>
            )}
            <MetaRow color="rgba(255,255,255,0.42)" size={11} gap={5} />
            {config.showLyrics && config.lyricQuote && (
              <p style={{
                margin: 0, marginTop: 6, fontSize: 12, fontStyle: 'italic',
                color: 'rgba(255,255,255,0.55)', lineHeight: 1.5,
                borderLeft: `2px solid ${accentColor ? accentColor + '55' : 'rgba(255,255,255,0.25)'}`,
                paddingLeft: 8,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              } as React.CSSProperties}>{config.lyricQuote}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── TICKET — event-ticket card: art, glass name-strip, die-cut stub ──
  if (config.preset === 'ticket') {
    const stubBg = accentColor ?? '#c2410c'
    const artFallback = accentColor
      ? `radial-gradient(circle at 50% 45%, ${accentColor} 0%, color-mix(in srgb, ${accentColor} 40%, #1c1c1e) 55%, #1c1c1e 100%)`
      : 'radial-gradient(circle at 50% 45%, #ea580c 0%, #7c2d12 55%, #1c1c1e 100%)'

    return (
      <div ref={ref} style={{
        position: 'relative', overflow: 'hidden', width: '100%', aspectRatio: '4 / 5',
        borderRadius: '30px', fontFamily, containerType: 'inline-size',
        background: cardBg,
        display: 'flex', flexDirection: 'column',
        padding: '22px 22px 20px',
        boxShadow: shadow,
      }}>
        {grainOverlay}
        {experimentalLayers}

        {/* Art panel */}
        <div style={{
          position: 'relative', width: '100%', aspectRatio: '1 / 1',
          borderRadius: 22, overflow: 'hidden', flexShrink: 0,
          background: artFallback,
          boxShadow: '0 18px 34px -14px rgba(0,0,0,0.6)',
        }}>
          {config.showAlbumArt && track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, transparent 45%, rgba(0,0,0,0.35) 100%)', pointerEvents: 'none' }} />
          <div style={{
            position: 'absolute', top: 10, left: 10, zIndex: 3,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 8px 4px 5px', borderRadius: 999,
            background: 'rgba(0,0,0,0.34)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          }}>
            <BrandMark size={14} tone="light" />
            <span style={{ fontSize: 8.5, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>FrameSound</span>
          </div>
        </div>

        {/* Glass name strip — overlaps the art's bottom edge */}
        <div style={{
          position: 'relative', marginTop: -34, zIndex: 4,
          width: 'calc(100% - 24px)', marginLeft: 12, marginRight: 12,
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 14px 28px -10px rgba(0,0,0,0.55)',
        }}>
          {config.showAlbumArt && track.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt="" aria-hidden
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center 90%',
                filter: 'blur(16px) saturate(150%) brightness(0.85)', transform: 'scale(1.2)',
              }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: '#26262a' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(20,20,22,0.30) 0%, rgba(20,20,22,0.55) 100%)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px' }}>
            <div style={{ flex: 1, minWidth: 0, textAlign: config.textAlign }}>
              {config.showTitle && (
                <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
              )}
              {config.showArtist && (
                <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.artist}</p>
              )}
            </div>
            <span style={{ color: 'rgba(255,255,255,0.55)', flexShrink: 0 }}><ExpandIcon /></span>
          </div>
        </div>

        {/* Die-cut ticket-stub footer */}
        <div style={{
          position: 'relative', marginTop: 14, borderRadius: 14, flex: 1, minHeight: 56,
          background: stubBg,
          display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
        }}>
          <StubNotches bg={cardBg} />
          <div style={{
            flexShrink: 0, width: 46, height: 46, borderRadius: 10,
            background: 'rgba(255,255,255,0.18)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
          }}>
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' }}>Released</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{track.releaseYear || '—'}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {config.showLyrics && config.lyricQuote ? (
              <p style={{
                margin: 0, fontSize: 11.5, fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', lineHeight: 1.4,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
              } as React.CSSProperties}>{config.lyricQuote}</p>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.album || track.artist}</p>
                <MetaRow color="rgba(255,255,255,0.75)" size={11} gap={5} />
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── TAG — minimal recognition card: art, glass strip, brand-mark stub ──
  if (config.preset === 'tag') {
    const stubBg = accentColor ?? '#e11d48'
    const artFallback = accentColor
      ? `linear-gradient(160deg, color-mix(in srgb, ${accentColor} 55%, #1c1c1e) 0%, #1c1c1e 100%)`
      : 'linear-gradient(160deg, #7c2d12 0%, #1c1c1e 100%)'

    return (
      <div ref={ref} style={{
        position: 'relative', overflow: 'hidden', width: '100%', aspectRatio: '4 / 5',
        borderRadius: '30px', fontFamily, containerType: 'inline-size',
        background: cardBg,
        display: 'flex', flexDirection: 'column',
        padding: '22px 22px 20px',
        boxShadow: shadow,
      }}>
        {grainOverlay}
        {experimentalLayers}

        <div style={{
          position: 'relative', width: '100%', aspectRatio: '1 / 1',
          borderRadius: 22, overflow: 'hidden', flexShrink: 0,
          background: artFallback,
          boxShadow: '0 18px 34px -14px rgba(0,0,0,0.6)',
        }}>
          {config.showAlbumArt && track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, transparent 45%, rgba(0,0,0,0.32) 100%)', pointerEvents: 'none' }} />
        </div>

        <div style={{
          position: 'relative', marginTop: -30, zIndex: 4,
          width: 'calc(100% - 24px)', marginLeft: 12, marginRight: 12,
          borderRadius: 16, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.20)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.45), 0 14px 28px -10px rgba(0,0,0,0.5)',
        }}>
          {config.showAlbumArt && track.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt="" aria-hidden
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center 90%',
                filter: 'blur(14px) saturate(160%) brightness(0.9)', transform: 'scale(1.2)',
              }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, background: stubBg }} />
          )}
          <div style={{
            position: 'absolute', inset: 0,
            background: accentColor
              ? `linear-gradient(160deg, ${accentColor}33 0%, rgba(20,20,22,0.55) 100%)`
              : 'linear-gradient(160deg, rgba(225,29,72,0.28) 0%, rgba(20,20,22,0.55) 100%)',
          }} />
          <div style={{ position: 'relative', zIndex: 1, padding: '12px 14px', textAlign: config.textAlign }}>
            {config.showTitle && (
              <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>{track.title}</p>
            )}
            {config.showArtist && (
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.68)' }}>{track.artist}</p>
            )}
          </div>
        </div>

        <div style={{
          position: 'relative', marginTop: 14, borderRadius: 14, flex: 1, minHeight: 46,
          background: stubBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <StubNotches bg={cardBg} />
          <BrandMark size={26} tone="light" />
        </div>
      </div>
    )
  }

  // ── PROFILE — social-profile card ───────────────────────────────
  if (config.preset === 'profile') {
    const artFallback = accentColor
      ? `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 30%, #fdf6ec) 0%, #fdf6ec 60%)`
      : 'linear-gradient(135deg, #fbe3d0 0%, #fdf6ec 60%)'
    const handle = '@' + (track.artist.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'artist')

    return (
      <div ref={ref} style={{
        position: 'relative', overflow: 'hidden', width: '100%', aspectRatio: '4 / 5',
        borderRadius: '26px', fontFamily, containerType: 'inline-size',
        background: '#141414',
        display: 'flex', flexDirection: 'column',
        boxShadow: shadow,
      }}>
        {grainOverlay}
        {experimentalLayers}

        {/* Photo panel, inset with margin */}
        <div style={{
          position: 'relative', margin: '16px 16px 0', flexShrink: 0,
          aspectRatio: '5 / 4', borderRadius: 20, overflow: 'hidden',
          background: artFallback,
        }}>
          {config.showAlbumArt && track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
          )}
        </div>

        {/* Avatar overlapping the photo's bottom-left */}
        <div style={{
          position: 'relative', marginTop: -30, marginLeft: 20, zIndex: 3,
          width: 56, height: 56, borderRadius: 14, overflow: 'hidden',
          border: '3px solid #141414', background: '#222',
          boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
        }}>
          {config.showAlbumArt && track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
          )}
        </div>

        <div style={{ flex: 1, padding: '10px 20px 18px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
              {config.showTitle && (
                <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
              )}
              <CheckBadge color={accentColor ?? '#1db954'} />
            </div>
            <div style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 999,
              background: '#fff', color: '#0a0a0a', fontSize: 11.5, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 4,
            }}><PlayIcon size={9} /> Play</div>
          </div>
          {config.showArtist && <p style={{ margin: 0, fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>{handle}</p>}
          {config.showLyrics && config.lyricQuote && (
            <p style={{
              margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            } as React.CSSProperties}>{config.lyricQuote}</p>
          )}
          <div style={{ display: 'flex', gap: 18, marginTop: 2 }}>
            {config.showYear && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                <b style={{ color: '#fff' }}>{track.releaseYear}</b>{' '}
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Released</span>
              </span>
            )}
            {config.showDuration && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>
                <b style={{ color: '#fff' }}>{track.duration}</b>{' '}
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Duration</span>
              </span>
            )}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.38)' }}>
            <LinkIcon />
            <span style={{ fontSize: 11 }}>framesound.app</span>
          </div>
        </div>
      </div>
    )
  }

  // ── PLAYER — now-playing glass widget ───────────────────────────
  return (
    <div ref={ref} style={{
      position: 'relative', overflow: 'hidden', width: '100%', aspectRatio: '4 / 5',
      borderRadius: '30px', fontFamily, containerType: 'inline-size',
      background: accentColor
        ? `linear-gradient(160deg, color-mix(in srgb, ${accentColor} 35%, #1c1c1e) 0%, #0d0d0e 100%)`
        : 'linear-gradient(160deg, #2a2a2e 0%, #0d0d0e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: shadow,
    }}>
      {/* Ambient blurred backdrop — real optical blur, not backdrop-filter */}
      {config.showAlbumArt && track.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt="" aria-hidden
          style={{
            position: 'absolute', inset: '-8%', width: '116%', height: '116%', objectFit: 'cover',
            filter: 'blur(38px) saturate(160%) brightness(0.55)', zIndex: 0,
          }}
        />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 1 }} />
      {grainOverlay}
      {experimentalLayers}

      {/* Floating glass widget */}
      <div style={{
        position: 'relative', zIndex: 5, width: '84%', borderRadius: 26, overflow: 'hidden',
        background: 'linear-gradient(155deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.05) 55%, rgba(255,255,255,0.10) 100%)',
        border: '1px solid rgba(255,255,255,0.20)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 30px 60px -18px rgba(0,0,0,0.65)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px 8px' }}>
          <div style={{ position: 'relative', width: 28, height: 28, borderRadius: 9, overflow: 'hidden', flexShrink: 0, background: '#333' }}>
            {config.showAlbumArt && track.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
              />
            )}
            <div style={{ position: 'absolute', bottom: -2, right: -2 }}><BrandMark size={13} tone="light" /></div>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {config.showTitle && (
              <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
            )}
            {config.showArtist && (
              <p style={{ margin: 0, fontSize: 9.5, color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                @{track.artist.toLowerCase().replace(/[^a-z0-9]+/g, '') || 'artist'}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.75)' }}><ShareIcon size={10} /></span>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.75)' }}><HeartIcon size={10} /></span>
          </div>
        </div>

        {/* Photo */}
        {config.showAlbumArt && track.coverUrl && (
          <div style={{ margin: '0 10px', borderRadius: 16, overflow: 'hidden', aspectRatio: '1 / 1', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
          </div>
        )}

        {/* Progress */}
        <div style={{ padding: '10px 14px 2px' }}>
          <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
            <div style={{ width: '28%', height: '100%', background: '#fff' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span className="tnum" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>0:00</span>
            {config.showDuration && <span className="tnum" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>-{track.duration}</span>}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '8px 14px 14px' }}>
          <span style={{ color: 'rgba(255,255,255,0.75)' }}><PrevIcon /></span>
          <span style={{
            width: 34, height: 34, borderRadius: '50%',
            background: accentColor ?? '#1db954', color: '#0a0a0a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><PlayIcon /></span>
          <span style={{ color: 'rgba(255,255,255,0.75)' }}><NextIcon /></span>
        </div>
      </div>
    </div>
  )
})

CardCanvas.displayName = 'CardCanvas'
export default CardCanvas
