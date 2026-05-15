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
  const alpha = Math.min(0.85, 0.15 + strength * 0.006).toFixed(2)
  const blur = Math.round(20 + strength * 0.9)
  return `0 0 ${blur}px rgba(${r},${g},${b},${alpha}), ${shadow}`
}

const DEPTH_SHADOW =
  '0 40px 80px rgba(0,0,0,0.88), 0 12px 32px rgba(0,0,0,0.6), ' +
  'inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.5)'

const CardCanvas = forwardRef<HTMLDivElement, Props>(function CardCanvas(
  { track, config, exportMode = false, accentColor },
  ref
) {
  const fontFamilyMap: Record<CardConfig['font'], string> = {
    syne:            'var(--font-syne)',
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

  // Shared gloss overlay — first child of every cardRef
  const glossOverlay = (
    <div style={{
      position: 'absolute', inset: 0,
      borderRadius: '20px',
      background:
        'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 44%), ' +
        'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 38%)',
      pointerEvents: 'none',
      zIndex: 5,
    }} />
  )

  // FrameSound watermark — always present, zIndex 6
  const watermark = (
    <div style={{
      position: 'absolute', bottom: 10, right: 12,
      fontFamily: 'var(--font-syne)',
      fontSize: 9, letterSpacing: '0.12em',
      textTransform: 'uppercase' as const,
      color: 'rgba(255,255,255,0.18)',
      zIndex: 6, pointerEvents: 'none',
    }}>
      FrameSound
    </div>
  )

  // Film grain (experimental)
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

  // accentColor tint — glass and square only
  const accentTint = accentColor ? (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
      background: `radial-gradient(ellipse at 80% 20%, ${accentColor}12 0%, transparent 60%)`,
    }} />
  ) : null

  // Meta row helper
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
  if (config.preset === 'glass') {
    return (
      <div ref={ref} style={{
        position: 'relative', overflow: 'hidden', width: '100%', aspectRatio: '4 / 5',
        borderRadius: '28px', fontFamily, containerType: 'inline-size',
        background: 'linear-gradient(150deg, #2c2c30 0%, #1a1a1d 30%, #131315 100%)',
        display: 'flex', flexDirection: 'column',
        boxShadow: shadow,
      }}>
        {glossOverlay}
        {watermark}
        {accentTint}
        {grainOverlay}

        {/* Bezel padding + art */}
        <div style={{ padding: '12px 12px 0' }}>
          {config.showAlbumArt && (
            <div style={{
              width: '100%', aspectRatio: '1 / 1', borderRadius: '14px',
              overflow: 'hidden', position: 'relative',
              boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.65)',
              background: '#111',
            }}>
              {track.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none', zIndex: 1 }}
                />
              )}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
            </div>
          )}
        </div>

        {/* Text area */}
        <div style={{ padding: '14px 16px 18px', display: 'flex', flexDirection: 'column', gap: 3, textAlign: config.textAlign, color: textColor }}>
          {config.showTitle && (
            <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15 }}>{track.title}</p>
          )}
          {config.showArtist && (
            <p style={{ margin: 0, fontSize: 15, fontWeight: 400, color: 'rgba(255,255,255,0.38)' }}>{track.artist}</p>
          )}
          <MetaRow color="rgba(255,255,255,0.17)" size={11} gap={5} />
          {config.showLyrics && config.lyricQuote && (
            <p style={{
              margin: 0, marginTop: 6, fontSize: 12, fontStyle: 'italic',
              color: 'rgba(255,255,255,0.44)', lineHeight: 1.5,
              borderLeft: `2px solid ${accentColor ? accentColor + '40' : 'rgba(255,255,255,0.15)'}`,
              paddingLeft: 8,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            } as React.CSSProperties}>{config.lyricQuote}</p>
          )}
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
        background: 'rgba(7,7,9,0.96)',
        display: 'flex', flexDirection: 'row',
        boxShadow: shadow,
      }}>
        {glossOverlay}
        {watermark}
        {grainOverlay}

        {/* Left column — album art */}
        <div style={{ width: '38%', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
          {track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
          )}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '15%', bottom: '15%', left: 0, width: 2, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.24) 35%, rgba(255,255,255,0.24) 65%, transparent)', zIndex: 3, pointerEvents: 'none' }} />
        </div>

        {/* Seam */}
        <div style={{ position: 'absolute', top: '10%', bottom: '10%', left: '38%', width: 1, background: 'rgba(0,0,0,0.9)', boxShadow: '1px 0 4px rgba(0,0,0,0.6)', zIndex: 3 }} />

        {/* Right column */}
        <div style={{ flex: 1, background: 'rgba(7,7,9,0.96)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px', gap: 3, textAlign: config.textAlign }}>
          {config.showTitle && (
            <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
          )}
          {config.showArtist && (
            <p style={{ margin: 0, fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.33)' }}>{track.artist}</p>
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
        {watermark}
        {grainOverlay}

        {/* Full-bleed cover */}
        {track.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
          />
        )}

        {/* Bottom gradient fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '62%', background: 'linear-gradient(to top, rgba(0,0,0,0.97) 0%, rgba(0,0,0,0.72) 40%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />

        {/* Duration bar */}
        {accentColor && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: 2, width: '35%', background: accentColor, zIndex: 6 }} />
        )}

        {/* Text block */}
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
            <p style={{ margin: 0, fontSize: 17, fontWeight: 400, color: 'rgba(255,255,255,0.50)' }}>{track.artist}</p>
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
        background: 'linear-gradient(150deg, #2c2c30 0%, #1a1a1d 30%, #131315 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '20px 16px 18px', gap: 14,
        boxShadow: shadow,
      }}>
        {glossOverlay}
        {watermark}
        {grainOverlay}

        {/* Art block */}
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
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
          </div>
        )}

        {/* Frosted text panel */}
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
            <p style={{ margin: 0, fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.33)' }}>{track.artist}</p>
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
        background: 'rgba(10,10,14,0.96)',
        display: 'flex', flexDirection: 'row',
        boxShadow: shadow,
      }}>
        {glossOverlay}
        {watermark}
        {grainOverlay}

        {/* Left art strip */}
        <div style={{ width: '40%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          {track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
          )}
        </div>

        {/* Seam */}
        <div style={{ position: 'absolute', top: '10%', bottom: '10%', left: '40%', width: 1, background: 'rgba(0,0,0,0.9)', boxShadow: '1px 0 4px rgba(0,0,0,0.6)', zIndex: 3 }} />

        {/* Right text */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 20px', gap: 3, textAlign: config.textAlign }}>
          {config.showTitle && (
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
          )}
          {config.showArtist && (
            <p style={{ margin: 0, fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.40)' }}>{track.artist}</p>
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
      background: 'linear-gradient(150deg, #2c2c30 0%, #1a1a1d 30%, #131315 100%)',
      display: 'flex', flexDirection: 'column',
      boxShadow: shadow,
    }}>
      {glossOverlay}
      {watermark}
      {accentTint}
      {grainOverlay}

      {/* Art area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {track.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
          />
        )}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '38%', background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)', zIndex: 2, pointerEvents: 'none' }} />
      </div>

      {/* Bottom strip */}
      <div style={{
        background: 'rgba(8,8,10,0.96)', padding: '13px 16px 15px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', flexDirection: 'column', gap: 3,
        textAlign: config.textAlign,
        alignItems: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start',
      }}>
        {config.showTitle && (
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.2 }}>{track.title}</p>
        )}
        {config.showArtist && (
          <p style={{ margin: 0, fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.31)' }}>{track.artist}</p>
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
