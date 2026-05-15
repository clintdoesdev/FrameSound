'use client'

import React, { forwardRef } from 'react'
import { TrackData, CardConfig } from '@/types'

type Props = {
  track: TrackData
  config: CardConfig
  exportMode?: boolean   // only changes image src to proxy URL — NO visual changes
}

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

  // Fixed CSS variable names matching layout.tsx font registrations
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

  const aspectRatioMap: Record<CardConfig['size'], string> = {
    '1:1':  '1 / 1',
    '16:9': '16 / 9',
    '4:5':  '4 / 5',
    '9:16': '9 / 16',
  }

  const cw = sizeMap[config.size].width
  const artistPx  = `${Math.round(Math.max(12, Math.min(18, cw * 0.035)))}px`
  const metaPx    = `${Math.round(Math.max(10, Math.min(14, cw * 0.027)))}px`
  const lyricsPx  = `${Math.round(Math.max(11, Math.min(15, cw * 0.029)))}px`

  const cardWrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    aspectRatio: aspectRatioMap[config.size],
    borderRadius: `${config.borderRadius}px`,
    fontFamily,
    color: textColor,
    containerType: 'inline-size',
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
    fontSize: artistPx,
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
    fontSize: metaPx,
    color: textColor,
    background: 'none',
    opacity: 0.5,
    margin: 0,
  }

  const lyricsStyle: React.CSSProperties = {
    position: 'relative',
    fontSize: lyricsPx,
    fontStyle: 'italic',
    color: textColor,
    background: 'none',
    opacity: 0.85,
    margin: 0,
    lineHeight: 1.5,
  }

  // exportMode ONLY switches cover source to proxy URL for CORS-safe export.
  // Every visual aspect stays identical to the preview.
  const coverSrc = exportMode && track.coverUrl
    ? proxySrc(track.coverUrl)
    : (track.coverUrl ?? '')

  // Background element — absolutely positioned, fills card
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

  // ── GLASS (thick bezel/frame style) ───────────────────────────
  if (config.preset === 'glass') {
    const bezel = Math.round(Math.max(12, cw * 0.033))
    const artRadius = Math.max(6, config.borderRadius - 8)
    return (
      <div ref={ref} style={{
        ...cardWrapperStyle,
        background: '#1c1c1e',
        display: 'flex', flexDirection: 'column',
        padding: `${bezel}px`,
      }}>
        {/* Album art — fills the top portion of the dark bezel frame */}
        {config.showAlbumArt && (
          <div style={{ flex: '0 0 73%', borderRadius: artRadius, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
            {track.coverUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt={track.title}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }} />
              : <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(160deg, hsl(${config.tintHue},50%,28%), hsl(${config.tintHue + 40},25%,12%))` }} />
            }
          </div>
        )}
        {/* Text strip — in the dark bezel area below the art */}
        <div style={{
          flex: 1, minHeight: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          paddingTop: Math.round(bezel * 0.65),
          gap: 3,
          textAlign: config.textAlign,
          color: '#ffffff',
          background: 'none',
        }}>
          {config.showTitle  && <p style={{ ...titleStyle, color: '#ffffff' }}>{track.title}</p>}
          {config.showArtist && <p style={{ ...artistStyle, color: 'rgba(255,255,255,0.65)' }}>{track.artist}</p>}
          <div style={{ display: 'flex', gap: 8, background: 'none' }}>
            {config.showYear     && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.4)' }}>{track.releaseYear}</span>}
            {config.showYear && config.showDuration && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.4)' }}>·</span>}
            {config.showDuration && <span style={{ ...metaStyle, color: 'rgba(255,255,255,0.4)' }}>{track.duration}</span>}
          </div>
          {config.showLyrics && config.lyricQuote && (
            <p style={{ ...lyricsStyle, marginTop: 4, color: 'rgba(255,255,255,0.75)' }}>{`"${config.lyricQuote}"`}</p>
          )}
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
          ? <img src={coverSrc} crossOrigin="anonymous" loading="eager" alt={track.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }} />
          : bgElement}
        {/* gradient overlay */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, transparent 100%)',
        }} />
        {/* text layer */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: `${config.padding}px`,
          display: 'flex', flexDirection: 'column', gap: '4px',
          textAlign: config.textAlign,
          background: 'none',
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
              loading="eager"
              alt={track.title}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', border: 'none', outline: 'none' }}
            />
          </div>
        )}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: `${config.padding}px`,
          gap: '8px', overflow: 'hidden',
          textAlign: config.textAlign,
          background: 'none',
        }}>
          {config.showTitle  && <p style={titleStyle}>{track.title}</p>}
          {config.showArtist && <p style={artistStyle}>{track.artist}</p>}
          <div style={{ display: 'flex', gap: '8px', background: 'none' }}>
            {config.showYear     && <span style={metaStyle}>{track.releaseYear}</span>}
            {config.showDuration && <span style={metaStyle}>{track.duration}</span>}
          </div>
          {config.showLyrics && config.lyricQuote && (
            <p style={lyricsStyle}>{`"${config.lyricQuote}"`}</p>
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
          background: 'none',
        }}>
          <div style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontSize: metaPx, opacity: 0.6, letterSpacing: '0.16em', color: textColor, background: 'none' }}>
            FRAMESOUND · STORY
          </div>
          {config.showAlbumArt && track.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverSrc}
              crossOrigin="anonymous"
              loading="eager"
              alt={track.title}
              style={{ width: '62%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '12px', display: 'block', border: 'none', outline: 'none' }}
            />
          )}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', width: '100%', background: 'none' }}>
            {config.showTitle  && <p style={{ ...titleStyle, textAlign: 'center' }}>{track.title}</p>}
            {config.showArtist && <p style={{ ...artistStyle, textAlign: 'center' }}>{track.artist}</p>}
            {config.showLyrics && config.lyricQuote && (
              <div style={{ position: 'relative', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', maxWidth: '92%' }}>
                <p style={{ ...lyricsStyle, textAlign: 'center' }}>{`"${config.lyricQuote}"`}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── NOW PLAYING (horizontal strip) ────────────────────────────
  if (config.preset === 'nowplaying') {
    // Left strip background — solid or gradient from tintHue
    const stripBg = config.bgStyle === 'solid'
      ? config.bgColor
      : `linear-gradient(175deg, hsl(${config.tintHue},58%,28%) 0%, hsl(${config.tintHue + 30},38%,14%) 100%)`

    return (
      <div ref={ref} style={{ ...cardWrapperStyle, display: 'flex', flexDirection: 'row', background: '#0d0d0d' }}>
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
            position: 'absolute', inset: 0, right: 0,
            background: 'linear-gradient(to right, transparent 55%, rgba(13,13,13,0.45) 100%)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Right text panel */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: `${config.padding}px`,
          gap: 6, overflow: 'hidden',
          textAlign: config.textAlign,
          background: 'none',
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
        background: 'none',
      }}>
        {config.showAlbumArt && track.coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverSrc}
            crossOrigin="anonymous"
            loading="eager"
            alt={track.title}
            style={{ width: '55%', maxWidth: '200px', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '8px', display: 'block', border: 'none', outline: 'none' }}
          />
        )}
        {config.showTitle  && <p style={titleStyle}>{track.title}</p>}
        {config.showArtist && <p style={artistStyle}>{track.artist}</p>}
        <div style={{ display: 'flex', gap: '8px', background: 'none' }}>
          {config.showYear     && <span style={metaStyle}>{track.releaseYear}</span>}
          {config.showYear && config.showDuration && <span style={metaStyle}>·</span>}
          {config.showDuration && <span style={metaStyle}>{track.duration}</span>}
        </div>
        {config.showLyrics && config.lyricQuote && (
          <div style={{ position: 'relative', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '10px 14px', width: '100%' }}>
            <p style={lyricsStyle}>{`"${config.lyricQuote}"`}</p>
          </div>
        )}
      </div>
    </div>
  )
})

CardCanvas.displayName = 'CardCanvas'
export default CardCanvas
