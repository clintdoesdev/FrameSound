'use client'

import React, { forwardRef } from 'react'
import { TrackData, CardConfig } from '@/types'

type Props = {
  track: TrackData
  config: CardConfig
  exportMode?: boolean
}

// Kept for any callers that still import it
export const sizeMap: Record<CardConfig['size'], { width: number; height: number }> = {
  '1:1':  { width: 520, height: 520 },
  '16:9': { width: 640, height: 360 },
  '4:5':  { width: 480, height: 600 },
  '9:16': { width: 360, height: 640 },
}

function proxySrc(url: string) {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`
}

function resolveTextColor(config: CardConfig): string {
  if (config.textColor === 'black') return '#000000'
  if (config.textColor === 'white') return '#ffffff'
  // auto: derive from background
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
  { track, config, exportMode = false },
  ref
) {
  const textColor = resolveTextColor(config)

  const fontFamilyMap: Record<CardConfig['font'], string> = {
    syne:       'var(--font-syne)',
    'dm-serif': 'var(--font-dm-sans)',
    playfair:   '"Playfair Display", serif',
    bebas:      '"Bebas Neue", sans-serif',
    instrument: '"Instrument Serif", serif',
  }
  const fontFamily = fontFamilyMap[config.font]

  const aspectRatioMap: Record<CardConfig['size'], string> = {
    '1:1':  '1 / 1',
    '16:9': '16 / 9',
    '4:5':  '4 / 5',
    '9:16': '9 / 16',
  }

  const cardWrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    aspectRatio: aspectRatioMap[config.size],
    borderRadius: `${config.borderRadius}px`,
    fontFamily,
    color: textColor,
  }

  // In export mode, strip overflow:hidden + textOverflow:ellipsis — dom-to-image's
  // SVG foreignObject renderer draws a white clip rect for any overflow:hidden element.
  const clip: React.CSSProperties = exportMode
    ? {}
    : { overflow: 'hidden', textOverflow: 'ellipsis' }

  const titleStyle: React.CSSProperties = {
    fontSize: 'clamp(18px, 4vw, 32px)',
    fontWeight: 700,
    lineHeight: 1.1,
    margin: 0,
    color: textColor,
    backgroundColor: 'transparent',
    whiteSpace: 'nowrap',
    ...clip,
  }

  const artistStyle: React.CSSProperties = {
    fontSize: 'clamp(12px, 2.5vw, 18px)',
    fontWeight: 400,
    margin: 0,
    color: textColor,
    backgroundColor: 'transparent',
    opacity: 0.75,
    whiteSpace: 'nowrap',
    ...clip,
  }

  const metaStyle: React.CSSProperties = {
    fontSize: 'clamp(10px, 2vw, 14px)',
    color: textColor,
    backgroundColor: 'transparent',
    opacity: 0.5,
    margin: 0,
  }

  const lyricsStyle: React.CSSProperties = {
    fontSize: 'clamp(11px, 2.2vw, 15px)',
    fontStyle: 'italic',
    color: textColor,
    backgroundColor: 'transparent',
    opacity: 0.85,
    margin: 0,
    lineHeight: 1.5,
  }

  // In export mode, route through /api/proxy-image so inlineImages can fetch same-origin
  const coverSrc = exportMode && track.coverUrl
    ? proxySrc(track.coverUrl)
    : (track.coverUrl ?? '')

  // Background element — position absolute, fills the card
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
          alt=""
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            border: 'none', outline: 'none',
            filter: `blur(32px) brightness(0.6) hue-rotate(${config.tintHue}deg)`,
            transform: 'scale(1.15)',
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
  // transparent: bgElement stays null

  // ── GLASS ─────────────────────────────────────────────────────
  if (config.preset === 'glass') {
    return (
      <div ref={ref} style={cardWrapperStyle}>
        {bgElement}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100%',
          padding: `${config.padding}px`,
          backgroundColor: 'transparent',
        }}>
          <div style={{
            // In export mode use a dark panel — backdrop-filter doesn't work in dom-to-image,
            // and rgba(white,0.08) at the img corners creates a visible white ring artifact.
            background: exportMode ? 'rgba(0,0,0,0.40)' : 'rgba(255,255,255,0.08)',
            backdropFilter: exportMode ? undefined : 'blur(12px)',
            WebkitBackdropFilter: exportMode ? undefined : 'blur(12px)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '12px',
            width: '100%', maxWidth: '320px',
            border: exportMode ? 'none' : '1px solid rgba(255,255,255,0.2)',
            textAlign: config.textAlign,
            backgroundColor: exportMode ? 'rgba(0,0,0,0.40)' : undefined,
          }}>
            {config.showAlbumArt && track.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverSrc}
                crossOrigin="anonymous"
                alt={track.title}
                style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '8px', display: 'block', border: 'none', outline: 'none' }}
              />
            )}
            {config.showTitle    && <p style={titleStyle}>{track.title}</p>}
            {config.showArtist   && <p style={artistStyle}>{track.artist}</p>}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', backgroundColor: 'transparent' }}>
              {config.showYear     && <span style={metaStyle}>{track.releaseYear}</span>}
              {config.showYear && config.showDuration && <span style={metaStyle}>·</span>}
              {config.showDuration && <span style={metaStyle}>{track.duration}</span>}
            </div>
            {config.showLyrics && config.lyricQuote && (
              <p style={lyricsStyle}>"{config.lyricQuote}"</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── POSTER ────────────────────────────────────────────────────
  if (config.preset === 'poster') {
    return (
      <div ref={ref} style={cardWrapperStyle}>
        {config.showAlbumArt && track.coverUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={coverSrc} crossOrigin="anonymous" alt={track.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }} />
          : bgElement}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)',
          backgroundColor: 'transparent',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: `${config.padding}px`,
          display: 'flex', flexDirection: 'column', gap: '4px',
          textAlign: config.textAlign,
          backgroundColor: 'transparent',
        }}>
          {config.showLyrics && config.lyricQuote && (
            <p style={{ ...lyricsStyle, marginBottom: '8px' }}>"{config.lyricQuote}"</p>
          )}
          {config.showTitle    && <p style={titleStyle}>{track.title}</p>}
          {config.showArtist   && <p style={artistStyle}>{track.artist}</p>}
          <div style={{ display: 'flex', gap: '8px', backgroundColor: 'transparent' }}>
            {config.showYear     && <span style={metaStyle}>{track.releaseYear}</span>}
            {config.showDuration && <span style={metaStyle}>{track.duration}</span>}
          </div>
        </div>
      </div>
    )
  }

  // ── MINIMAL ───────────────────────────────────────────────────
  if (config.preset === 'minimal') {
    const minBg = config.bgStyle === 'solid'
      ? config.bgColor
      : textColor === '#000000' ? '#f5f4f2' : '#111111'
    return (
      <div ref={ref} style={{ ...cardWrapperStyle, display: 'flex', flexDirection: 'row', alignItems: 'stretch', backgroundColor: minBg }}>
        {config.showAlbumArt && track.coverUrl && (
          <div style={{ width: '40%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverSrc}
              crossOrigin="anonymous"
              alt={track.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
          </div>
        )}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: `${config.padding}px`,
          gap: '8px',
          // strip overflow:hidden on the text column in export mode
          ...(exportMode ? {} : { overflow: 'hidden' }),
          textAlign: config.textAlign,
          backgroundColor: 'transparent',
        }}>
          {config.showTitle    && <p style={titleStyle}>{track.title}</p>}
          {config.showArtist   && <p style={artistStyle}>{track.artist}</p>}
          <div style={{ display: 'flex', gap: '8px', backgroundColor: 'transparent' }}>
            {config.showYear     && <span style={metaStyle}>{track.releaseYear}</span>}
            {config.showDuration && <span style={metaStyle}>{track.duration}</span>}
          </div>
          {config.showLyrics && config.lyricQuote && (
            <p style={lyricsStyle}>"{config.lyricQuote}"</p>
          )}
        </div>
      </div>
    )
  }

  // ── STORY ─────────────────────────────────────────────────────
  if (config.preset === 'story') {
    return (
      <div ref={ref} style={cardWrapperStyle}>
        {bgElement}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'space-between',
          height: '100%',
          padding: `${config.padding}px`,
          textAlign: 'center',
          backgroundColor: 'transparent',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.6, letterSpacing: '0.16em', color: textColor, backgroundColor: 'transparent' }}>
            FRAMESOUND · STORY
          </div>
          {config.showAlbumArt && track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverSrc}
              crossOrigin="anonymous"
              alt={track.title}
              style={{ width: '62%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '12px', display: 'block', border: 'none', outline: 'none' }}
            />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '100%', backgroundColor: 'transparent' }}>
            {config.showTitle  && <p style={{ ...titleStyle,  whiteSpace: 'normal', textAlign: 'center' }}>{track.title}</p>}
            {config.showArtist && <p style={{ ...artistStyle, textAlign: 'center' }}>{track.artist}</p>}
            {config.showLyrics && config.lyricQuote && (
              <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', maxWidth: '92%' }}>
                <p style={{ ...lyricsStyle, textAlign: 'center' }}>"{config.lyricQuote}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── SQUARE (default) ──────────────────────────────────────────
  return (
    <div ref={ref} style={cardWrapperStyle}>
      {bgElement}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: config.textAlign === 'center' ? 'center' : config.textAlign === 'right' ? 'flex-end' : 'flex-start',
        justifyContent: 'center',
        height: '100%',
        padding: `${config.padding}px`,
        gap: '12px',
        textAlign: config.textAlign,
        backgroundColor: 'transparent',
      }}>
        {config.showAlbumArt && track.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            crossOrigin="anonymous"
            alt={track.title}
            style={{ width: '55%', maxWidth: '200px', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '8px', display: 'block', border: 'none', outline: 'none' }}
          />
        )}
        {config.showTitle    && <p style={titleStyle}>{track.title}</p>}
        {config.showArtist   && <p style={artistStyle}>{track.artist}</p>}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'transparent' }}>
          {config.showYear     && <span style={metaStyle}>{track.releaseYear}</span>}
          {config.showYear && config.showDuration && <span style={metaStyle}>·</span>}
          {config.showDuration && <span style={metaStyle}>{track.duration}</span>}
        </div>
        {config.showLyrics && config.lyricQuote && (
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', width: '100%' }}>
            <p style={lyricsStyle}>"{config.lyricQuote}"</p>
          </div>
        )}
      </div>
    </div>
  )
})

CardCanvas.displayName = 'CardCanvas'
export default CardCanvas
