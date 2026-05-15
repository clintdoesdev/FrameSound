'use client'

import React, { forwardRef } from 'react'
import { TrackData, CardConfig } from '@/types'

type Props = {
  track: TrackData
  config: CardConfig
  exportMode?: boolean   // only changes image src to proxy URL — NO visual changes
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

  const cardWrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    aspectRatio: '1 / 1',
    borderRadius: '20px',
    fontFamily,
    color: textColor,
    containerType: 'inline-size',
    boxShadow: '0 40px 80px rgba(0,0,0,0.88), 0 16px 36px rgba(0,0,0,0.65), 0 6px 14px rgba(0,0,0,0.5), inset 1px 1px 0 rgba(255,255,255,0.09), inset -1px -1px 0 rgba(0,0,0,0.55)',
  }

  const titleStyle: React.CSSProperties = {
    position: 'relative',
    fontSize: 'clamp(14px, 5cqi, 38px)',
    fontWeight: 700,
    lineHeight: 1.15,
    margin: 0,
    color: textColor,
    background: 'none',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    overflow: 'visible',
  }

  const artistStyle: React.CSSProperties = {
    position: 'relative',
    fontSize: '18px',
    fontWeight: 400,
    margin: 0,
    color: textColor,
    background: 'none',
    opacity: 0.75,
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflow: 'visible',
  }

  const metaStyle: React.CSSProperties = {
    position: 'relative',
    fontSize: '14px',
    color: textColor,
    background: 'none',
    opacity: 0.5,
    margin: 0,
  }

  const lyricsStyle: React.CSSProperties = {
    position: 'relative',
    fontSize: '15px',
    fontStyle: 'italic',
    color: textColor,
    background: 'none',
    opacity: 0.85,
    margin: 0,
    lineHeight: 1.5,
  }

  // exportMode ONLY switches cover source to proxy URL for CORS-safe export.
  const coverSrc = exportMode && track.coverUrl
    ? proxySrc(track.coverUrl)
    : (track.coverUrl ?? '')

  // Background element for presets that use bgStyle
  let bgElement: React.ReactNode = null
  if (config.bgStyle === 'solid') {
    bgElement = <div style={{ position: 'absolute', inset: 0, background: config.bgColor }} />
  } else if (config.bgStyle === 'gradient') {
    bgElement = (
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(160deg, hsl(${config.tintHue},35%,22%), hsl(${config.tintHue + 40},20%,10%))`,
      }} />
    )
  } else if (config.bgStyle === 'blurred-art') {
    if (track.coverUrl) {
      bgElement = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverSrc}
          crossOrigin="anonymous"
          loading="eager"
          alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            border: 'none', outline: 'none',
            filter: 'blur(32px) brightness(0.42) saturate(1.2)',
            transform: 'scale(1.18)',
            transformOrigin: 'center',
          }}
        />
      )
    } else {
      bgElement = (
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at 25% 20%, hsl(${config.tintHue},60%,40%) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 70%, hsl(${config.tintHue + 30},45%,25%) 0%, transparent 55%),
            hsl(${config.tintHue},20%,12%)
          `,
        }} />
      )
    }
  }

  // Shared depth overlays — first and second children of every preset
  const glossOverlay = (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0,
      height: '44%',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, transparent 100%)',
      borderRadius: '20px 20px 0 0',
      pointerEvents: 'none',
      zIndex: 5,
    }} />
  )

  const bevelOverlay = (
    <div style={{
      position: 'absolute',
      inset: 0,
      borderRadius: '20px',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 38%)',
      pointerEvents: 'none',
      zIndex: 5,
    }} />
  )

  // ── GLASS ─────────────────────────────────────────────────────
  if (config.preset === 'glass') {
    const accent = accentColor ?? '#1db954'
    return (
      <div ref={ref} style={{
        ...cardWrapperStyle,
        background: 'linear-gradient(150deg, #2c2c30 0%, #1a1a1d 30%, #131315 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '28px',
        gap: 16,
      }}>
        {glossOverlay}
        {bevelOverlay}
        {config.bgStyle === 'blurred-art' && track.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            crossOrigin="anonymous"
            loading="eager"
            alt=""
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', border: 'none', outline: 'none',
              filter: 'blur(32px) brightness(0.42) saturate(1.2)',
              transform: 'scale(1.18)',
              transformOrigin: 'center',
            }}
          />
        )}
        {config.showAlbumArt && (
          <div style={{
            width: '80%', aspectRatio: '1 / 1',
            borderRadius: '12px',
            overflow: 'hidden', position: 'relative', flexShrink: 0, zIndex: 1,
            background: `radial-gradient(circle at 40% 40%, ${accent}cc 0%, ${accent}33 60%, #111 100%)`,
            boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(0,0,0,0.9)',
          }}>
            {track.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', opacity: 0.28,
                  mixBlendMode: 'overlay' as React.CSSProperties['mixBlendMode'],
                  display: 'block', border: 'none', outline: 'none',
                }}
              />
            )}
          </div>
        )}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', display: 'flex', flexDirection: 'column',
          alignItems: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start',
          gap: 4,
          paddingLeft: '14px',
          textAlign: config.textAlign,
        }}>
          {config.showTitle  && <p style={{ ...titleStyle, whiteSpace: 'normal', wordBreak: 'break-word', margin: 0 }}>{track.title}</p>}
          {config.showArtist && <p style={{ ...artistStyle, margin: 0 }}>{track.artist}</p>}
          <div style={{ display: 'flex', gap: 6, justifyContent: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start', background: 'none' }}>
            {config.showYear     && <span style={metaStyle}>{track.releaseYear}</span>}
            {config.showYear && config.showDuration && <span style={{ ...metaStyle, opacity: 0.3 }}>·</span>}
            {config.showDuration && <span style={metaStyle}>{track.duration}</span>}
          </div>
          {config.showLyrics && config.lyricQuote && (
            <p style={{ ...lyricsStyle, margin: 0 }}>{`"${config.lyricQuote}"`}</p>
          )}
        </div>
      </div>
    )
  }

  // ── POSTER ────────────────────────────────────────────────────
  if (config.preset === 'poster') {
    return (
      <div ref={ref} style={cardWrapperStyle}>
        {glossOverlay}
        {bevelOverlay}
        {config.showAlbumArt && track.coverUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt={track.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }} />
          : bgElement}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.4) 45%, transparent 100%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '28px',
          display: 'flex', flexDirection: 'column', gap: '4px',
          textAlign: config.textAlign,
          background: 'none',
          zIndex: 1,
        }}>
          {config.showLyrics && config.lyricQuote && (
            <p style={{ ...lyricsStyle, marginBottom: '8px' }}>{`"${config.lyricQuote}"`}</p>
          )}
          {config.showTitle  && <p style={titleStyle}>{track.title}</p>}
          {config.showArtist && <p style={artistStyle}>{track.artist}</p>}
          <div style={{ display: 'flex', gap: '8px', background: 'none' }}>
            {config.showYear     && <span style={metaStyle}>{track.releaseYear}</span>}
            {config.showDuration && <span style={metaStyle}>{track.duration}</span>}
          </div>
        </div>
      </div>
    )
  }

  // ── MINIMAL ───────────────────────────────────────────────────
  if (config.preset === 'minimal') {
    const accent = accentColor ?? '#1db954'
    return (
      <div ref={ref} style={{
        ...cardWrapperStyle,
        display: 'flex', flexDirection: 'row',
        overflow: 'hidden',
        background: config.bgColor || '#0a0a0a',
      }}>
        {glossOverlay}
        {bevelOverlay}
        {/* Left accent block */}
        <div style={{
          width: '38%', flexShrink: 0,
          alignSelf: 'stretch',
          backgroundColor: accent,
          position: 'relative', overflow: 'hidden',
        }}>
          {config.showAlbumArt && track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt=""
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', opacity: 0.35,
                mixBlendMode: 'luminosity' as React.CSSProperties['mixBlendMode'],
                display: 'block', border: 'none', outline: 'none',
              }}
            />
          )}
          {/* Right-edge seam shadow */}
          <div style={{
            position: 'absolute',
            top: 0, bottom: 0, right: 0,
            width: '18px',
            background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.55))',
            zIndex: 2,
            pointerEvents: 'none',
          }} />
        </div>
        {/* Left-right seam line */}
        <div style={{
          position: 'absolute',
          top: '10%', bottom: '10%',
          left: '38%',
          width: '1px',
          background: 'rgba(0,0,0,0.9)',
          boxShadow: '1px 0 4px rgba(0,0,0,0.6)',
          zIndex: 3,
        }} />
        {/* Right dark panel */}
        <div style={{
          flex: 1, background: 'rgba(7,7,9,0.97)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 28px',
          gap: 5, overflow: 'hidden',
          textAlign: config.textAlign,
          position: 'relative', zIndex: 1,
        }}>
          {config.showTitle  && <p style={{ ...titleStyle, fontSize: 'clamp(15px,3.5cqi,28px)', margin: 0 }}>{track.title}</p>}
          {config.showArtist && <p style={{ ...artistStyle, margin: 0 }}>{track.artist}</p>}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'none' }}>
            {config.showYear     && <span style={metaStyle}>{track.releaseYear}</span>}
            {config.showYear && config.showDuration && <span style={{ ...metaStyle, opacity: 0.3 }}>·</span>}
            {config.showDuration && <span style={metaStyle}>{track.duration}</span>}
          </div>
          {config.showLyrics && config.lyricQuote && (
            <p style={{ ...lyricsStyle, margin: 0 }}>{`"${config.lyricQuote}"`}</p>
          )}
        </div>
      </div>
    )
  }

  // ── STORY ─────────────────────────────────────────────────────
  if (config.preset === 'story') {
    return (
      <div ref={ref} style={cardWrapperStyle}>
        {glossOverlay}
        {bevelOverlay}
        {bgElement}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          height: '100%',
          padding: '28px',
          textAlign: 'center',
          background: 'none',
        }}>
          <div style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontSize: '14px', opacity: 0.6, letterSpacing: '0.16em', color: textColor, background: 'none' }}>
            FRAMESOUND · STORY
          </div>
          {config.showAlbumArt && track.coverUrl && (
            <div style={{
              width: '72%', aspectRatio: '1 / 1',
              borderRadius: '11px',
              overflow: 'hidden', flexShrink: 0, position: 'relative',
              boxShadow: '0 20px 48px rgba(0,0,0,0.75), 0 6px 16px rgba(0,0,0,0.55), inset 0 3px 8px rgba(0,0,0,0.6)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverSrc}
                crossOrigin="anonymous"
                loading="eager"
                alt={track.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
              />
            </div>
          )}
          <div style={{
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '12px',
            padding: '14px 18px',
            width: '82%',
            display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center',
          }}>
            {config.showTitle  && <p style={{ ...titleStyle, textAlign: 'center', margin: 0 }}>{track.title}</p>}
            {config.showArtist && <p style={{ ...artistStyle, textAlign: 'center', margin: 0 }}>{track.artist}</p>}
            {config.showLyrics && config.lyricQuote && (
              <p style={{ ...lyricsStyle, textAlign: 'center', margin: 0 }}>{`"${config.lyricQuote}"`}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── NOW PLAYING (horizontal strip) ────────────────────────────
  if (config.preset === 'nowplaying') {
    const stripBg = config.bgStyle === 'solid'
      ? config.bgColor
      : `linear-gradient(175deg, hsl(${config.tintHue},58%,28%) 0%, hsl(${config.tintHue + 30},38%,14%) 100%)`

    return (
      <div ref={ref} style={{ ...cardWrapperStyle, display: 'flex', flexDirection: 'row', background: '#0d0d0d' }}>
        {glossOverlay}
        {bevelOverlay}
        {/* Left colour strip — album art full-bleed, or tint gradient fallback */}
        <div style={{
          width: '36%', flexShrink: 0,
          position: 'relative', overflow: 'hidden',
          background: stripBg,
        }}>
          {config.showAlbumArt && track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverSrc}
              crossOrigin="anonymous"
              loading="eager"
              alt={track.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
          )}
          {/* Subtle right-edge fade into dark panel */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, transparent 55%, rgba(13,13,13,0.45) 100%)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Right text panel */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '28px',
          gap: 6, overflow: 'hidden',
          textAlign: config.textAlign,
          background: 'none',
          position: 'relative', zIndex: 1,
        }}>
          {config.showTitle  && <p style={{ ...titleStyle, color: '#ffffff' }}>{track.title}</p>}
          {config.showArtist && <p style={{ ...artistStyle, color: 'rgba(255,255,255,0.65)' }}>{track.artist}</p>}
          <div style={{ display: 'flex', gap: 8, background: 'none' }}>
            {config.showYear     && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.38)' }}>{track.releaseYear}</span>}
            {config.showYear && config.showDuration && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.38)' }}>·</span>}
            {config.showDuration && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.38)' }}>{track.duration}</span>}
          </div>
          {config.showLyrics && config.lyricQuote && (
            <p style={{ ...lyricsStyle, color: 'rgba(255,255,255,0.72)' }}>{`"${config.lyricQuote}"`}</p>
          )}
        </div>
      </div>
    )
  }

  // ── SQUARE (default) ──────────────────────────────────────────
  return (
    <div ref={ref} style={{ ...cardWrapperStyle, display: 'flex', flexDirection: 'column' }}>
      {glossOverlay}
      {bevelOverlay}
      {bgElement}
      {config.showAlbumArt && track.coverUrl && (
        <div style={{ flex: '0 0 62%', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc}
            crossOrigin="anonymous"
            loading="eager"
            alt={track.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
          />
        </div>
      )}
      <div style={{
        flex: 1,
        background: 'rgba(8,8,10,0.94)',
        padding: '12px 16px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        gap: '6px',
        position: 'relative', zIndex: 1,
        textAlign: config.textAlign,
        alignItems: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start',
      }}>
        {config.showTitle  && <p style={titleStyle}>{track.title}</p>}
        {config.showArtist && <p style={artistStyle}>{track.artist}</p>}
        <div style={{ display: 'flex', gap: '8px', background: 'none' }}>
          {config.showYear     && <span style={metaStyle}>{track.releaseYear}</span>}
          {config.showYear && config.showDuration && <span style={metaStyle}>·</span>}
          {config.showDuration && <span style={metaStyle}>{track.duration}</span>}
        </div>
        {config.showLyrics && config.lyricQuote && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 10px', width: '100%' }}>
            <p style={lyricsStyle}>{`"${config.lyricQuote}"`}</p>
          </div>
        )}
      </div>
    </div>
  )
})

CardCanvas.displayName = 'CardCanvas'
export default CardCanvas
