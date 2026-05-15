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

function resolveTextColor(config: CardConfig): string {
  if (config.textColor === 'black') return '#000000'
  if (config.textColor === 'white') return '#ffffff'
  if (config.bgStyle === 'solid') {
    const hex = config.bgColor.replace('#', '')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000000' : '#ffffff'
  }
  return '#ffffff'
}

function withGlow(shadow: string, hex: string | null | undefined, strength: number): string {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return shadow
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const alpha = Math.min(0.85, 0.15 + strength * 0.006).toFixed(2)
  const blur  = Math.round(20 + strength * 0.9)
  return `0 0 ${blur}px rgba(${r},${g},${b},${alpha}), ${shadow}`
}

// Per-family box-shadows drawn from the landing page demo cards
const GLASS_SHADOW  = '0 1px 0 rgba(255,255,255,0.50) inset, 0 22px 48px -12px rgba(0,0,0,0.42), 0 8px 18px -6px rgba(0,0,0,0.25)'
const POSTER_SHADOW = '0 24px 52px -10px rgba(0,0,0,0.55), 0 8px 18px -6px rgba(0,0,0,0.30)'
const PILL_SHADOW   = '0 14px 32px -8px rgba(0,0,0,0.50)'

const CardCanvas = forwardRef<HTMLDivElement, Props>(function CardCanvas(
  { track, config, exportMode = false, accentColor },
  ref
) {
  const textColor = resolveTextColor(config)

  const fontFamilyMap: Record<CardConfig['font'], string> = {
    syne:             'var(--font-syne)',
    'dm-serif':       'var(--font-dm-serif)',
    playfair:         'var(--font-playfair)',
    bebas:            'var(--font-bebas)',
    instrument:       'var(--font-instrument)',
    'space-grotesk':  'var(--font-space-grotesk)',
    raleway:          'var(--font-raleway)',
    cormorant:        'var(--font-cormorant)',
    oswald:           'var(--font-oswald)',
  }
  const fontFamily = fontFamilyMap[config.font]

  const sw = (base: string) =>
    config.glowEnabled ? withGlow(base, accentColor, config.glowStrength) : base

  // Shared base wrapper (no boxShadow — each preset sets its own)
  const wrapBase: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    aspectRatio: '1 / 1',
    borderRadius: '28px',
    fontFamily,
    color: textColor,
    containerType: 'inline-size',
  }

  const metaStyle: React.CSSProperties = {
    position: 'relative',
    fontSize: 'clamp(8px,1.8cqi,13px)',
    color: textColor,
    background: 'none',
    opacity: 0.5,
    margin: 0,
  }

  const lyricsStyle: React.CSSProperties = {
    position: 'relative',
    fontSize: 'clamp(9px,2.2cqi,16px)',
    fontStyle: 'italic',
    color: textColor,
    background: 'none',
    opacity: 0.85,
    margin: 0,
    lineHeight: 1.5,
  }

  const coverSrc = exportMode && track.coverUrl
    ? proxySrc(track.coverUrl)
    : (track.coverUrl ?? '')

  // Background element (blurred art, gradient, solid) for presets that support bgStyle
  let bgElement: React.ReactNode = null
  if (config.bgStyle === 'solid') {
    bgElement = <div style={{ position: 'absolute', inset: 0, background: config.bgColor }} />
  } else if (config.bgStyle === 'gradient') {
    bgElement = (
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(160deg,hsl(${config.tintHue},35%,22%),hsl(${config.tintHue + 40},20%,10%))`,
      }} />
    )
  } else if (config.bgStyle === 'blurred-art' && track.coverUrl) {
    bgElement = (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', border: 'none', outline: 'none',
          filter: 'blur(32px) brightness(0.42) saturate(1.2)',
          transform: 'scale(1.18)', transformOrigin: 'center',
        }}
      />
    )
  } else if (config.bgStyle === 'blurred-art') {
    bgElement = (
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 25% 20%,hsl(${config.tintHue},60%,40%) 0%,transparent 55%),radial-gradient(ellipse at 80% 70%,hsl(${config.tintHue+30},45%,25%) 0%,transparent 55%),hsl(${config.tintHue},20%,12%)`,
      }} />
    )
  }

  // Shared overlays (gloss + bevel) for poster/story/square family
  const glossOverlay = (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '44%',
      background: 'linear-gradient(180deg,rgba(255,255,255,0.07) 0%,transparent 100%)',
      borderRadius: '28px 28px 0 0',
      pointerEvents: 'none', zIndex: 5,
    }} />
  )
  const bevelOverlay = (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: '28px',
      background: 'linear-gradient(135deg,rgba(255,255,255,0.10) 0%,transparent 40%)',
      pointerEvents: 'none', zIndex: 5,
    }} />
  )
  // Specular — top-left radial, screen blend (DemoPosterCardView style)
  const specularOverlay = (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 4,
      background: 'radial-gradient(100% 45% at 30% 0%,rgba(255,255,255,0.22) 0%,transparent 55%)',
    }} />
  )

  // Film grain overlay (experimental)
  const grainSvg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="4" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="200" height="200" filter="url(#g)"/></svg>`
  )
  const grainOverlay = config.grainEnabled ? (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 8, pointerEvents: 'none',
      opacity: config.grainOpacity / 100,
      backgroundImage: `url("data:image/svg+xml,${grainSvg}")`,
      backgroundSize: '200px 200px',
      mixBlendMode: 'overlay' as React.CSSProperties['mixBlendMode'],
      borderRadius: '28px',
    }} />
  ) : null

  // ── GLASS — frosted glass (DemoBgCard) ────────────────────────
  // True translucent glass with white-tinted gradient, backdrop-filter,
  // white border, radial specular (screen blend), coloured art block
  if (config.preset === 'glass') {
    const accent = accentColor ?? '#1db954'
    return (
      <div ref={ref} style={{
        ...wrapBase,
        background: 'linear-gradient(135deg,rgba(255,255,255,0.18) 0%,rgba(255,255,255,0.06) 48%,rgba(255,255,255,0.12) 100%)',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(255,255,255,0.24)',
        boxShadow: sw(GLASS_SHADOW),
        display: 'flex', flexDirection: 'column',
        padding: '12px 12px 14px',
      }}>
        {/* Colour layer behind the frosted glass (bgStyle: blurred-art gives extra tint) */}
        {bgElement}

        {/* Specular radial highlight — screen blend, top-left corner (DemoBgCard inner div) */}
        <div style={{
          position: 'absolute', inset: 1, borderRadius: 27,
          background: 'radial-gradient(110% 50% at 20% 0%,rgba(255,255,255,0.30) 0%,rgba(255,255,255,0) 50%)',
          mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode'],
          pointerEvents: 'none', zIndex: 6,
        }} />
        {grainOverlay}

        {/* Art block — coloured gradient bg + full-opacity album art + inner gloss */}
        {config.showAlbumArt && (
          <div style={{
            width: '100%', aspectRatio: '1 / 1', borderRadius: '13px',
            background: `radial-gradient(circle at 40% 40%,${accent}66 0%,#111 100%)`,
            marginBottom: '11px', overflow: 'hidden', position: 'relative',
            boxShadow: '0 12px 32px -6px rgba(0,0,0,0.52)',
            zIndex: 1, flexShrink: 0,
          }}>
            {track.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none', zIndex: 1 }}
              />
            )}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(180deg,rgba(255,255,255,0.09) 0%,transparent 100%)', borderRadius: '13px 13px 0 0', zIndex: 2, pointerEvents: 'none' }} />
          </div>
        )}

        {/* Text — matching DemoBgCard font sizes */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '3px', textAlign: config.textAlign }}>
          {config.showTitle && (
            <p style={{ fontSize: 'clamp(11px,3cqi,22px)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2, margin: 0, color: textColor, background: 'none' }}>{track.title}</p>
          )}
          {config.showArtist && (
            <p style={{ fontSize: 'clamp(9px,2.3cqi,17px)', opacity: 0.65, marginTop: '3px', margin: 0, color: textColor, background: 'none', fontWeight: 400 }}>{track.artist}</p>
          )}
          <div style={{ display: 'flex', gap: '6px', marginTop: '2px', justifyContent: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
            {config.showYear     && <span style={metaStyle}>{track.releaseYear}</span>}
            {config.showYear && config.showDuration && <span style={{ ...metaStyle, opacity: 0.3 }}>·</span>}
            {config.showDuration && <span style={metaStyle}>{track.duration}</span>}
          </div>
          {config.showLyrics && config.lyricQuote && (
            <p style={{ ...lyricsStyle, marginTop: '4px', margin: 0 }}>{`"${config.lyricQuote}"`}</p>
          )}
        </div>
      </div>
    )
  }

  // ── POSTER — full-bleed art + specular (DemoPosterCardView) ───
  // Full-bleed gradient/art as background, top-left specular highlight,
  // bottom gradient fade, text at bottom
  if (config.preset === 'poster') {
    return (
      <div ref={ref} style={{ ...wrapBase, boxShadow: sw(POSTER_SHADOW) }}>
        {specularOverlay}
        {glossOverlay}
        {grainOverlay}
        {config.showAlbumArt && track.coverUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt={track.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }} />
          : bgElement}
        {/* Bottom gradient fade (DemoPosterCardView) */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top,rgba(0,0,0,0.88) 0%,transparent 100%)',
          padding: '28px 12px 12px',
          zIndex: 1,
        }}>
          <div style={{ textAlign: config.textAlign }}>
            {config.showLyrics && config.lyricQuote && (
              <p style={{ ...lyricsStyle, marginBottom: '8px', color: '#fff' }}>{`"${config.lyricQuote}"`}</p>
            )}
            {config.showTitle && (
              <p style={{ fontSize: 'clamp(11px,3cqi,22px)', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.01em', margin: 0, color: '#fff', background: 'none' }}>{track.title}</p>
            )}
            {config.showArtist && (
              <p style={{ fontSize: 'clamp(9px,2.3cqi,17px)', opacity: 0.6, marginTop: '2px', margin: 0, color: '#fff', background: 'none' }}>{track.artist}</p>
            )}
            <div style={{ display: 'flex', gap: '6px', marginTop: '4px', justifyContent: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
              {config.showYear     && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.55)' }}>{track.releaseYear}</span>}
              {config.showDuration && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.55)' }}>{track.duration}</span>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── MINIMAL — dark glass + coloured strip (DemoMinCardView) ───
  // Dark glass body with backdrop-filter, thin white border, left coloured
  // strip with album art, seam line, dark right panel with text
  if (config.preset === 'minimal') {
    const accent = accentColor ?? '#1db954'
    return (
      <div ref={ref} style={{
        ...wrapBase,
        boxShadow: sw(PILL_SHADOW),
        background: 'rgba(14,14,18,0.82)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.10)',
        display: 'flex', flexDirection: 'row',
      }}>
        {/* Full-card top gloss */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '44%',
          background: 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,transparent 100%)',
          borderRadius: '28px 28px 0 0', pointerEvents: 'none', zIndex: 10,
        }} />
        {bevelOverlay}
        {grainOverlay}

        {/* Left coloured strip */}
        <div style={{
          width: '34%', flexShrink: 0, alignSelf: 'stretch',
          position: 'relative', overflow: 'hidden',
          background: `linear-gradient(148deg,${accent} 0%,${accent}cc 48%,${accent}88 100%)`,
        }}>
          {config.showAlbumArt && track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none', zIndex: 1 }}
            />
          )}
          {/* Inner top gloss */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(180deg,rgba(255,255,255,0.15) 0%,transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
          {/* Left-edge highlight strip */}
          <div style={{ position: 'absolute', top: '15%', bottom: '15%', left: 0, width: '2px', background: 'linear-gradient(180deg,transparent,rgba(255,255,255,0.24) 35%,rgba(255,255,255,0.24) 65%,transparent)', zIndex: 3, pointerEvents: 'none' }} />
          {/* Right-edge seam shadow */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '18px', background: 'linear-gradient(90deg,transparent,rgba(0,0,0,0.55))', zIndex: 4, pointerEvents: 'none' }} />
        </div>

        {/* Seam line */}
        <div style={{ position: 'absolute', top: '10%', bottom: '10%', left: '34%', width: '1px', background: 'rgba(0,0,0,0.9)', boxShadow: '1px 0 4px rgba(0,0,0,0.6)', zIndex: 3 }} />

        {/* Right text panel (DemoMinCardView text div) */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 12px', gap: 2, overflow: 'hidden',
          textAlign: config.textAlign, position: 'relative', zIndex: 1,
        }}>
          {config.showTitle && (
            <p style={{ fontSize: 'clamp(10px,3cqi,20px)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2, margin: 0, color: '#fff', background: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
          )}
          {config.showArtist && (
            <p style={{ fontSize: 'clamp(9px,2.3cqi,16px)', opacity: 0.5, marginTop: '2px', margin: 0, color: '#fff', background: 'none', fontWeight: 400 }}>{track.artist}</p>
          )}
          <div style={{ display: 'flex', gap: '5px', marginTop: '3px', alignItems: 'center' }}>
            {config.showYear     && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.35)', fontSize: 'clamp(8px,1.8cqi,12px)' }}>{track.releaseYear}</span>}
            {config.showYear && config.showDuration && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.35)' }}>·</span>}
            {config.showDuration && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.35)', fontSize: 'clamp(8px,1.8cqi,12px)' }}>{track.duration}</span>}
          </div>
          {config.showLyrics && config.lyricQuote && (
            <p style={{ ...lyricsStyle, marginTop: '4px', margin: 0, fontSize: 'clamp(8px,2cqi,14px)', color: 'rgba(255,255,255,0.75)' }}>{`"${config.lyricQuote}"`}</p>
          )}
        </div>
      </div>
    )
  }

  // ── STORY — tall poster (DemoPosterCardView adapted) ──────────
  // Same visual language as poster: full-bleed art/bg, specular,
  // centred album art block, frosted text panel at bottom
  if (config.preset === 'story') {
    return (
      <div ref={ref} style={{ ...wrapBase, boxShadow: sw(POSTER_SHADOW) }}>
        {specularOverlay}
        {glossOverlay}
        {grainOverlay}
        {bgElement}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          height: '100%', padding: '28px',
          textAlign: 'center', background: 'none',
        }}>
          <div style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontSize: '14px', opacity: 0.6, letterSpacing: '0.16em', color: textColor, background: 'none' }}>
            FRAMESOUND · STORY
          </div>
          {config.showAlbumArt && track.coverUrl && (
            <div style={{
              width: '72%', aspectRatio: '1 / 1', borderRadius: '11px',
              overflow: 'hidden', flexShrink: 0, position: 'relative',
              boxShadow: '0 20px 48px rgba(0,0,0,0.75), 0 6px 16px rgba(0,0,0,0.55)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt={track.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
              />
            </div>
          )}
          <div style={{
            background: 'rgba(0,0,0,0.52)', backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '12px', padding: '14px 18px', width: '86%',
            display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center',
          }}>
            {config.showTitle && (
              <p style={{ fontSize: 'clamp(11px,3cqi,22px)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2, margin: 0, color: '#fff', background: 'none', textAlign: 'center' }}>{track.title}</p>
            )}
            {config.showArtist && (
              <p style={{ fontSize: 'clamp(9px,2.3cqi,17px)', opacity: 0.6, margin: 0, color: '#fff', background: 'none', textAlign: 'center' }}>{track.artist}</p>
            )}
            {config.showLyrics && config.lyricQuote && (
              <p style={{ ...lyricsStyle, textAlign: 'center', margin: 0 }}>{`"${config.lyricQuote}"`}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── NOW PLAYING — dark glass horizontal strip (DemoMinCardView) ─
  // Same card body as Minimal: dark glass + backdrop-filter + border,
  // left art strip, right text panel
  if (config.preset === 'nowplaying') {
    const stripBg = config.bgStyle === 'solid'
      ? config.bgColor
      : `linear-gradient(175deg,hsl(${config.tintHue},58%,28%) 0%,hsl(${config.tintHue+30},38%,14%) 100%)`

    return (
      <div ref={ref} style={{
        ...wrapBase,
        boxShadow: sw(PILL_SHADOW),
        background: 'rgba(14,14,18,0.82)',
        backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        border: '1px solid rgba(255,255,255,0.10)',
        display: 'flex', flexDirection: 'row',
      }}>
        {/* Full-card top gloss */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '44%',
          background: 'linear-gradient(180deg,rgba(255,255,255,0.06) 0%,transparent 100%)',
          borderRadius: '28px 28px 0 0', pointerEvents: 'none', zIndex: 10,
        }} />
        {bevelOverlay}
        {grainOverlay}

        {/* Left art strip */}
        <div style={{
          width: '36%', flexShrink: 0, position: 'relative', overflow: 'hidden',
          background: stripBg,
        }}>
          {config.showAlbumArt && track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt={track.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right,transparent 55%,rgba(14,14,18,0.45) 100%)', pointerEvents: 'none' }} />
        </div>

        {/* Right text panel */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 16px', gap: 4, overflow: 'hidden',
          textAlign: config.textAlign, background: 'none', position: 'relative', zIndex: 1,
        }}>
          {config.showTitle && (
            <p style={{ fontSize: 'clamp(10px,3cqi,20px)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2, margin: 0, color: '#fff', background: 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{track.title}</p>
          )}
          {config.showArtist && (
            <p style={{ fontSize: 'clamp(9px,2.3cqi,16px)', opacity: 0.5, margin: 0, color: '#fff', background: 'none', fontWeight: 400 }}>{track.artist}</p>
          )}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {config.showYear     && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.38)' }}>{track.releaseYear}</span>}
            {config.showYear && config.showDuration && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.38)' }}>·</span>}
            {config.showDuration && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.38)' }}>{track.duration}</span>}
          </div>
          {config.showLyrics && config.lyricQuote && (
            <p style={{ ...lyricsStyle, color: 'rgba(255,255,255,0.72)', margin: 0, marginTop: 2 }}>{`"${config.lyricQuote}"`}</p>
          )}
        </div>
      </div>
    )
  }

  // ── SQUARE — DemoBgCard-inspired: art-heavy + dark text panel ──
  // Art fills top 62%, dark glass-ish panel below with text
  return (
    <div ref={ref} style={{
      ...wrapBase,
      boxShadow: sw(GLASS_SHADOW),
      display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(160deg,#1a1a1e 0%,#0d0d0f 100%)',
    }}>
      {glossOverlay}
      {bevelOverlay}
      {grainOverlay}
      {bgElement}
      {config.showAlbumArt && track.coverUrl && (
        <div style={{ flex: '0 0 62%', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt={track.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
          />
          {/* Art specular */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(100% 45% at 30% 0%,rgba(255,255,255,0.15) 0%,transparent 55%)', pointerEvents: 'none', zIndex: 2 }} />
          {/* Bottom fade into text panel */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top,rgba(13,13,15,0.95) 0%,transparent 100%)', zIndex: 2, pointerEvents: 'none' }} />
        </div>
      )}
      <div style={{
        flex: 1, background: 'rgba(8,8,10,0.96)',
        padding: '12px 16px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        gap: '4px', position: 'relative', zIndex: 1,
        textAlign: config.textAlign,
        alignItems: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start',
      }}>
        {config.showTitle && (
          <p style={{ fontSize: 'clamp(11px,3cqi,22px)', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2, margin: 0, color: '#fff', background: 'none' }}>{track.title}</p>
        )}
        {config.showArtist && (
          <p style={{ fontSize: 'clamp(9px,2.3cqi,17px)', opacity: 0.6, margin: 0, color: '#fff', background: 'none', fontWeight: 400, marginTop: '2px' }}>{track.artist}</p>
        )}
        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
          {config.showYear     && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.45)' }}>{track.releaseYear}</span>}
          {config.showYear && config.showDuration && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.45)' }}>·</span>}
          {config.showDuration && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.45)' }}>{track.duration}</span>}
        </div>
        {config.showLyrics && config.lyricQuote && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 10px', width: '100%', marginTop: '2px' }}>
            <p style={{ ...lyricsStyle, color: 'rgba(255,255,255,0.8)' }}>{`"${config.lyricQuote}"`}</p>
          </div>
        )}
      </div>
    </div>
  )
})

CardCanvas.displayName = 'CardCanvas'
export default CardCanvas
