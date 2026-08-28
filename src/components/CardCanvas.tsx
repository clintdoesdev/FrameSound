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

  // Shared gloss overlay
  const glossOverlay = (
    <div style={{
      position: 'absolute', inset: 0,
      background:
        'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 40%), ' +
        'linear-gradient(135deg, rgba(255,255,255,0.09) 0%, transparent 35%)',
      pointerEvents: 'none', zIndex: 5,
    }} />
  )

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

  // accentColor tint — square only
  const accentTint = accentColor ? (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
      background: `radial-gradient(ellipse 75% 55% at 80% 20%, ${accentColor}18 0%, transparent 65%)`,
    }} />
  ) : null

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

  // ── MINIMAL ───────────────────────────────────────────────────
  if (config.preset === 'minimal') {
    return (
      <div ref={ref} style={{
        position: 'relative', overflow: 'hidden', width: '100%', height: 106,
        borderRadius: '20px', fontFamily, containerType: 'inline-size',
        background: '#1c1c1e',
        display: 'flex', flexDirection: 'row',
        boxShadow: shadow,
      }}>
        {glossOverlay}
        <Watermark position="top-right" />
        {grainOverlay}
        {experimentalLayers}

        <div style={{ width: '38%', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
          {track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
          )}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '15%', bottom: '15%', left: 0, width: 2, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.22) 35%, rgba(255,255,255,0.22) 65%, transparent)', zIndex: 3, pointerEvents: 'none' }} />
        </div>

        <div style={{ position: 'absolute', top: '10%', bottom: '10%', left: '38%', width: 1, background: 'rgba(0,0,0,0.9)', zIndex: 3 }} />

        <div style={{ flex: 1, background: '#1c1c1e', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', gap: 3, textAlign: config.textAlign }}>
          {config.showTitle && (
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
          )}
          {config.showArtist && (
            <p style={{ margin: 0, fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.50)' }}>{track.artist}</p>
          )}
          <MetaRow color="rgba(255,255,255,0.13)" size={11} gap={5} />
          {config.showLyrics && config.lyricQuote && (
            <p style={{
              margin: 0, fontSize: 11, fontStyle: 'italic', color: 'rgba(255,255,255,0.25)',
              display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            } as React.CSSProperties}>{config.lyricQuote}</p>
          )}
        </div>
      </div>
    )
  }

  // ── POSTER ────────────────────────────────────────────────────
  if (config.preset === 'poster') {
    return (
      <div ref={ref} style={{
        position: 'relative', overflow: 'hidden', width: '100%', aspectRatio: '3 / 4',
        borderRadius: '28px', fontFamily, containerType: 'inline-size',
        boxShadow: shadow,
      }}>
        {glossOverlay}
        {/* Watermark at top-right to stay clear of bottom text/bar */}
        <Watermark position="top-right" />
        {grainOverlay}
        {experimentalLayers}

        {track.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
          />
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '62%', background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.72) 40%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />

        {/* Duration bar sits above text at z:6 */}
        {accentColor && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, width: '35%', background: accentColor, zIndex: 6 }} />
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '26px 26px 30px', zIndex: 5, display: 'flex', flexDirection: 'column', gap: 5, textAlign: config.textAlign }}>
          {config.showLyrics && config.lyricQuote && (
            <p style={{
              margin: 0, fontSize: 13, fontStyle: 'italic', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            } as React.CSSProperties}>{config.lyricQuote}</p>
          )}
          {config.showTitle && (
            <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.035em', lineHeight: 1.05 }}>{track.title}</p>
          )}
          {config.showArtist && (
            <p style={{ margin: 0, fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.60)' }}>{track.artist}</p>
          )}
          <MetaRow color="rgba(255,255,255,0.22)" size={12} gap={5} />
        </div>
      </div>
    )
  }

  // ── STORY ─────────────────────────────────────────────────────
  if (config.preset === 'story') {
    return (
      <div ref={ref} style={{
        position: 'relative', overflow: 'hidden', width: '100%', aspectRatio: '9 / 16',
        borderRadius: '24px', fontFamily, containerType: 'inline-size',
        background: '#1c1c1e',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px 16px 18px', gap: 14,
        boxShadow: shadow,
      }}>
        {glossOverlay}
        <Watermark position="top-right" />
        {grainOverlay}
        {experimentalLayers}

        {config.showAlbumArt && track.coverUrl && (
          <div style={{
            width: '78%', aspectRatio: '1 / 1', borderRadius: '14px',
            overflow: 'hidden', position: 'relative', flexShrink: 0,
            boxShadow: '0 12px 28px rgba(0,0,0,0.7), inset 0 3px 8px rgba(0,0,0,0.6)',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
          </div>
        )}

        <div style={{
          width: '100%', borderRadius: 12,
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.07)',
          padding: '12px 14px',
          display: 'flex', flexDirection: 'column', gap: 3,
          textAlign: config.textAlign,
        }}>
          {config.showTitle && (
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{track.title}</p>
          )}
          {config.showArtist && (
            <p style={{ margin: 0, fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.50)' }}>{track.artist}</p>
          )}
          <MetaRow color="rgba(255,255,255,0.14)" size={10} gap={4} />
          {config.showLyrics && config.lyricQuote && (
            <p style={{
              margin: 0, fontSize: 11, fontStyle: 'italic', color: 'rgba(255,255,255,0.38)', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            } as React.CSSProperties}>{config.lyricQuote}</p>
          )}
        </div>
      </div>
    )
  }

  // ── NOW PLAYING ───────────────────────────────────────────────
  if (config.preset === 'nowplaying') {
    return (
      <div ref={ref} style={{
        position: 'relative', overflow: 'hidden', width: '100%', height: 106,
        borderRadius: '20px', fontFamily, containerType: 'inline-size',
        background: '#1c1c1e',
        display: 'flex', flexDirection: 'row',
        boxShadow: shadow,
      }}>
        {glossOverlay}
        <Watermark position="top-right" />
        {grainOverlay}
        {experimentalLayers}

        <div style={{ width: '40%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          {track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
          )}
        </div>

        <div style={{ position: 'absolute', top: '10%', bottom: '10%', left: '40%', width: 1, background: 'rgba(0,0,0,0.9)', zIndex: 3 }} />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px', gap: 3, textAlign: config.textAlign }}>
          {config.showTitle && (
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
          )}
          {config.showArtist && (
            <p style={{ margin: 0, fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.50)' }}>{track.artist}</p>
          )}
          <MetaRow color="rgba(255,255,255,0.13)" size={11} gap={5} />
          {accentColor && (
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 2 }}>
              <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 1 }}>
                <div style={{ width: '35%', height: '100%', background: accentColor, borderRadius: 1 }} />
              </div>
            </div>
          )}
          {config.showLyrics && config.lyricQuote && (
            <p style={{
              margin: 0, fontSize: 11, fontStyle: 'italic', color: 'rgba(255,255,255,0.25)',
              display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
            } as React.CSSProperties}>{config.lyricQuote}</p>
          )}
        </div>
      </div>
    )
  }

  // ── SQUARE ────────────────────────────────────────────────────
  return (
    <div ref={ref} style={{
      position: 'relative', overflow: 'hidden', width: '100%', aspectRatio: '1 / 1',
      borderRadius: '24px', fontFamily, containerType: 'inline-size',
      background: '#1c1c1e',
      display: 'flex', flexDirection: 'column',
      boxShadow: shadow,
    }}>
      {glossOverlay}
      <Watermark position="bottom-right" />
      {accentTint}
      {grainOverlay}
      {experimentalLayers}

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {track.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
          />
        )}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '38%', background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', zIndex: 2, pointerEvents: 'none' }} />
      </div>

      <div style={{
        background: '#1c1c1e', padding: '13px 16px 15px',
        display: 'flex', flexDirection: 'column', gap: 3,
        textAlign: config.textAlign,
        alignItems: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start',
      }}>
        {config.showTitle && (
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.2 }}>{track.title}</p>
        )}
        {config.showArtist && (
          <p style={{ margin: 0, fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.50)' }}>{track.artist}</p>
        )}
        <MetaRow color="rgba(255,255,255,0.14)" size={10} gap={4} />
        {config.showLyrics && config.lyricQuote && (
          <p style={{
            margin: 0, fontSize: 11, fontStyle: 'italic', color: 'rgba(255,255,255,0.28)',
            display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          } as React.CSSProperties}>{config.lyricQuote}</p>
        )}
      </div>
    </div>
  )
})

CardCanvas.displayName = 'CardCanvas'
export default CardCanvas
