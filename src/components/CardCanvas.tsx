'use client'

import React from 'react'
import Image from 'next/image'
import { TrackData, CardConfig } from '@/types'

type Props = {
  track: TrackData
  config: CardConfig
  cardRef: React.RefObject<HTMLDivElement>
}

export const sizeMap: Record<CardConfig['size'], { width: number; height: number }> = {
  '1:1':  { width: 520, height: 520 },
  '16:9': { width: 640, height: 360 },
  '4:5':  { width: 480, height: 600 },
  '9:16': { width: 360, height: 640 },
}

function fontFamily(font: CardConfig['font']): string {
  switch (font) {
    case 'syne':       return 'var(--font-syne)'
    case 'dm-serif':   return 'var(--font-dm-serif)'
    case 'playfair':   return 'var(--font-playfair)'
    case 'bebas':      return 'var(--font-bebas)'
    case 'instrument': return 'var(--font-instrument)'
  }
}

// Export-safe: hsl() instead of oklch() so dom-to-image can parse it
function BlurBg({ hue, coverUrl }: { hue: number; coverUrl: string | null }) {
  if (coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverUrl}
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          filter: 'blur(48px) saturate(140%)',
          transform: 'scale(1.15)',
          transformOrigin: 'center',
          zIndex: 0,
        }}
      />
    )
  }
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 0,
      transform: 'scale(1.15)',
      transformOrigin: 'center',
      background: `
        radial-gradient(ellipse at 25% 20%, hsl(${hue},65%,50%) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 70%, hsl(${hue + 30},50%,32%) 0%, transparent 55%),
        repeating-linear-gradient(135deg, hsl(${hue},30%,24%) 0 18px, hsl(${hue},20%,16%) 18px 36px)
      `,
    }} />
  )
}

function AlbumArtEl({ coverUrl, album, hue, size, radius = 6 }: {
  coverUrl: string | null; album: string; hue: number; size: number; radius?: number
}) {
  if (coverUrl) {
    return (
      <Image
        src={coverUrl} alt={album}
        width={size} height={size}
        style={{ borderRadius: radius, flexShrink: 0, display: 'block' }}
        unoptimized
      />
    )
  }
  return (
    <div className="albumart" style={{
      width: size, height: size, borderRadius: radius, flexShrink: 0,
      ['--art-hue' as string]: hue,
    }}>
      <span style={{ position: 'relative', zIndex: 1, opacity: 0.85 }}>ART</span>
    </div>
  )
}

// Export-safe: hsl() instead of oklch()
function BgLayer({ config }: { config: CardConfig }) {
  if (config.bgStyle === 'solid') {
    return <div style={{ position: 'absolute', inset: 0, background: config.bgColor, zIndex: 0 }} />
  }
  if (config.bgStyle === 'gradient') {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: `linear-gradient(160deg, hsl(${config.tintHue},30%,18%), hsl(${config.tintHue + 30},15%,10%))`,
      }} />
    )
  }
  return null
}

// All rgba — no oklch, no CSS variables that resolve to oklch
const GLASS_SHADOW =
  '0 1px 0 rgba(255,255,255,0.5) inset,' +
  '0 -1px 0 rgba(255,255,255,0.10) inset,' +
  '0 30px 60px -20px rgba(0,0,0,0.50),' +
  '0 10px 25px -10px rgba(0,0,0,0.35)'

const CARD_SHADOW =
  '0 1px 0 rgba(255,255,255,0.05) inset,' +
  '0 24px 64px rgba(0,0,0,0.55)'

// Lyric box for glass preset — no backdropFilter (not supported by dom-to-image)
function LyricQuote({ lyric, width, r }: { lyric: string; width: number; r: number }) {
  return (
    <div style={{
      marginTop: 6, padding: '8px 10px',
      background: 'rgba(0,0,0,0.30)',
      border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: r * 0.4,
      fontSize: width * 0.026, fontStyle: 'italic', opacity: 0.9, lineHeight: 1.45,
    }}>
      &ldquo;{lyric}&rdquo;
    </div>
  )
}

// Story/Square lyric box — replaces .glass className (whose oklch computed style may cause issues)
function GlassLyric({ lyric, fontSize, dark = false }: { lyric: string; fontSize: number; dark?: boolean }) {
  return (
    <div style={{
      padding: '12px 16px', fontSize, fontStyle: 'italic', lineHeight: 1.4,
      background: dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.30)',
      border: `1px solid ${dark ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.18)'}`,
      borderRadius: 14,
    }}>
      &ldquo;{lyric}&rdquo;
    </div>
  )
}

export default function CardCanvas({ track, config, cardRef }: Props) {
  const { width, height } = sizeMap[config.size]
  const ff = fontFamily(config.font)
  const hue = config.tintHue
  const p = config.padding
  const r = config.borderRadius
  const lyric = config.lyricQuote
  const useBlur = config.bgStyle === 'blurred-art'
  const isDark = config.textColor !== 'black'
  const textColor = isDark ? '#f5f4f2' : '#222220'
  const textAlign = config.textAlign ?? 'left'

  const baseStyle: React.CSSProperties = {
    width, height,
    fontFamily: ff,
    ['--card-radius' as string]: `${r}px`,
    transition: 'opacity 150ms ease',
  }

  if (config.preset === 'glass') {
    const artRadius = r * 0.7
    const isLandscape = width > height * 1.15

    // All glass styles inline — no className, no CSS variable oklch references
    const glassCardStyle: React.CSSProperties = {
      ...baseStyle,
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      flexShrink: 0,
      color: 'white',
      borderRadius: r,
      border: '1px solid rgba(255,255,255,0.28)',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.12) 100%)',
      backdropFilter: 'blur(34px) saturate(180%)',
      WebkitBackdropFilter: 'blur(34px) saturate(180%)',
      boxShadow: GLASS_SHADOW,
    }

    // Specular highlight — reduced opacity so it works WITHOUT mix-blend-mode: screen
    // mix-blend-mode: screen is not supported by dom-to-image and causes white overlay artifacts
    const specularDiv = (
      <div style={{
        position: 'absolute', inset: 1, borderRadius: r - 1, zIndex: 2, pointerEvents: 'none',
        background:
          'radial-gradient(120% 60% at 20% 0%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 52%),' +
          'radial-gradient(80% 40% at 80% 0%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 58%)',
      }} />
    )

    const refractionDiv = (
      <div style={{
        position: 'absolute', left: 1, right: 1, bottom: 1, height: '38%',
        borderRadius: `0 0 ${r - 1}px ${r - 1}px`,
        background: 'linear-gradient(to top, rgba(255,255,255,0.09), rgba(255,255,255,0))',
        zIndex: 2, pointerEvents: 'none',
      }} />
    )

    if (isLandscape) {
      const artSize = Math.round(height - p * 2)
      return (
        <div ref={cardRef} style={{ ...glassCardStyle, display: 'flex', flexDirection: 'row' }}>
          {useBlur
            ? <BlurBg hue={hue} coverUrl={track.coverUrl} />
            : <BgLayer config={config} />}
          {specularDiv}
          {refractionDiv}
          <div style={{
            position: 'relative', zIndex: 3, padding: p,
            display: 'flex', flexDirection: 'row', gap: p * 0.8,
            width: '100%', height: '100%', background: 'transparent',
          }}>
            {config.showAlbumArt && (
              <div style={{
                width: artSize, height: artSize, position: 'relative',
                borderRadius: artRadius, overflow: 'hidden', flexShrink: 0,
                boxShadow: '0 18px 40px -12px rgba(0,0,0,0.6),0 4px 12px -2px rgba(0,0,0,0.40),0 0 0 1px rgba(255,255,255,0.10) inset',
                background: 'transparent',
              }}>
                {track.coverUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={track.coverUrl} alt={track.album} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <div className="albumart" style={{ width: '100%', height: '100%', borderRadius: 0, ['--art-hue' as string]: hue }}>
                      <span style={{ position: 'relative', zIndex: 1, opacity: 0.85 }}>ART</span>
                    </div>
                }
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 35%)',
                }} />
              </div>
            )}
            <div style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              gap: 4, flex: 1, minWidth: 0, paddingBottom: 2,
              textAlign, background: 'transparent',
            }}>
              {config.showTitle && (
                <div style={{ fontSize: width * 0.058, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                  {track.title}
                </div>
              )}
              {config.showArtist && (
                <div style={{ fontSize: width * 0.034, fontWeight: 500, opacity: 0.78, letterSpacing: '-0.01em' }}>
                  {track.artist}
                </div>
              )}
              {(config.showYear || config.showDuration) && (
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: width * 0.022, opacity: 0.55, letterSpacing: '0.04em', marginTop: 2 }}>
                  {config.showYear && <span>{track.releaseYear}</span>}
                  {config.showYear && config.showDuration && <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>}
                  {config.showDuration && <span>{track.duration}</span>}
                </div>
              )}
              {config.showLyrics && lyric && <LyricQuote lyric={lyric} width={width} r={r} />}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div ref={cardRef} style={{ ...glassCardStyle, display: 'flex', flexDirection: 'column' }}>
        {useBlur
          ? <BlurBg hue={hue} coverUrl={track.coverUrl} />
          : <BgLayer config={config} />}
        {specularDiv}
        {refractionDiv}
        <div style={{
          position: 'relative', zIndex: 3, padding: p,
          display: 'flex', flexDirection: 'column', height: '100%', gap: p * 0.6,
          background: 'transparent',
        }}>
          {config.showAlbumArt && (
            <div style={{
              width: '100%', aspectRatio: '1 / 1',
              borderRadius: artRadius, overflow: 'hidden', flexShrink: 0,
              boxShadow: '0 18px 40px -12px rgba(0,0,0,0.6),0 4px 12px -2px rgba(0,0,0,0.40),0 0 0 1px rgba(255,255,255,0.10) inset',
              position: 'relative', background: 'transparent',
            }}>
              {track.coverUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={track.coverUrl} alt={track.album} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div className="albumart" style={{ width: '100%', height: '100%', borderRadius: 0, ['--art-hue' as string]: hue }}>
                    <span style={{ position: 'relative', zIndex: 1, opacity: 0.85 }}>ART</span>
                  </div>
              }
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 35%)',
              }} />
            </div>
          )}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 2,
            textAlign, background: 'transparent',
          }}>
            {config.showTitle && (
              <div style={{ fontSize: width * 0.058, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                {track.title}
              </div>
            )}
            {config.showArtist && (
              <div style={{ fontSize: width * 0.034, fontWeight: 500, opacity: 0.78, letterSpacing: '-0.01em' }}>
                {track.artist}
              </div>
            )}
            {(config.showYear || config.showDuration) && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: width * 0.022, opacity: 0.55, letterSpacing: '0.04em', marginTop: 2 }}>
                {config.showYear && <span>{track.releaseYear}</span>}
                {config.showYear && config.showDuration && <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>}
                {config.showDuration && <span>{track.duration}</span>}
              </div>
            )}
            {config.showLyrics && lyric && <LyricQuote lyric={lyric} width={width} r={r} />}
          </div>
        </div>
      </div>
    )
  }

  if (config.preset === 'poster') {
    return (
      <div ref={cardRef} style={{
        ...baseStyle,
        position: 'relative', overflow: 'hidden', isolation: 'isolate',
        flexShrink: 0, color: 'white',
        borderRadius: r,
        boxShadow: CARD_SHADOW,
      }}>
        {useBlur ? (
          <>
            {track.coverUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={track.coverUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
              : <div className="albumart" style={{ position: 'absolute', inset: 0, borderRadius: 0, zIndex: 0, ['--art-hue' as string]: hue }} />
            }
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.92) 100%)',
            }} />
          </>
        ) : (
          <BgLayer config={config} />
        )}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, padding: p, zIndex: 2,
          display: 'flex', flexDirection: 'column', gap: 6,
          textAlign,
        }}>
          {config.showLyrics && lyric && (
            <div style={{ fontSize: width * 0.028, fontStyle: 'italic', opacity: 0.85, lineHeight: 1.4, marginBottom: 10, maxWidth: '82%' }}>
              &ldquo;{lyric}&rdquo;
            </div>
          )}
          {config.showTitle && (
            <div style={{ fontSize: width * 0.07, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>{track.title}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            {config.showArtist && <div style={{ fontSize: width * 0.030, fontWeight: 500 }}>{track.artist}</div>}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: width * 0.020, opacity: 0.65, letterSpacing: '0.04em' }}>
              {config.showYear && <span>{track.releaseYear}</span>}
              {config.showYear && config.showDuration && <span style={{ margin: '0 6px', opacity: 0.5 }}>—</span>}
              {config.showDuration && <span>{track.duration}</span>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (config.preset === 'minimal') {
    const artSize = height - p * 2
    const bgColor = config.bgStyle === 'solid' ? config.bgColor
      : isDark ? '#1f1e1c' : '#f5f4f2'
    return (
      <div ref={cardRef} style={{
        ...baseStyle,
        position: 'relative', overflow: 'hidden', isolation: 'isolate',
        flexShrink: 0,
        color: textColor,
        borderRadius: r,
        background: bgColor,
        boxShadow: isDark ? CARD_SHADOW : '0 1px 0 rgba(255,255,255,1) inset,0 18px 48px rgba(0,0,0,0.12)',
      }}>
        <div style={{
          position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: p,
          display: 'flex', alignItems: 'center', gap: p * 0.9,
        }}>
          {config.showAlbumArt && (
            <AlbumArtEl coverUrl={track.coverUrl} album={track.album} hue={hue} size={artSize} radius={4} />
          )}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, textAlign }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: width * 0.020, letterSpacing: '0.08em', opacity: 0.55, textTransform: 'uppercase' }}>
              FrameSound · {track.album}
            </div>
            {config.showTitle && (
              <div style={{ fontSize: width * 0.060, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.025em' }}>{track.title}</div>
            )}
            {config.showArtist && (
              <div style={{ fontSize: width * 0.030, fontWeight: 500, opacity: 0.78 }}>{track.artist}</div>
            )}
            <div style={{ marginTop: 6, height: 1, background: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)' }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: width * 0.022, opacity: 0.6, letterSpacing: '0.04em', display: 'flex', gap: 14 }}>
              {config.showYear && <span>{track.releaseYear}</span>}
              {config.showDuration && <span>{track.duration}</span>}
            </div>
            {config.showLyrics && lyric && (
              <div style={{ fontSize: width * 0.026, fontStyle: 'italic', opacity: 0.7, lineHeight: 1.45, marginTop: 10 }}>
                &ldquo;{lyric}&rdquo;
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (config.preset === 'story') {
    const sw = width
    const sh = config.size === '9:16' ? height : Math.round(width * 16 / 9)
    const artSize = sw * 0.62
    return (
      <div ref={cardRef} style={{
        ...baseStyle, width: sw, height: sh,
        position: 'relative', overflow: 'hidden', isolation: 'isolate',
        flexShrink: 0, color: 'white',
        borderRadius: r,
        boxShadow: CARD_SHADOW,
      }}>
        <BlurBg hue={hue} coverUrl={track.coverUrl} />
        <div style={{
          position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: p,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.7, letterSpacing: '0.16em' }}>FRAMESOUND · STORY</div>
          {config.showAlbumArt && (
            <AlbumArtEl coverUrl={track.coverUrl} album={track.album} hue={hue} size={artSize} radius={8} />
          )}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', textAlign }}>
            {config.showTitle && (
              <div style={{ fontSize: sw * 0.085, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>{track.title}</div>
            )}
            {config.showArtist && (
              <div style={{ fontSize: sw * 0.038, opacity: 0.85 }}>{track.artist}</div>
            )}
            {config.showLyrics && lyric && (
              <div style={{ marginTop: 8, maxWidth: '92%' }}>
                <GlassLyric lyric={lyric} fontSize={sw * 0.034} />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // square
  const artSize = Math.min(width, height) * 0.36
  return (
    <div ref={cardRef} style={{
      ...baseStyle, width, height: width,
      position: 'relative', overflow: 'hidden', isolation: 'isolate',
      flexShrink: 0,
      color: isDark ? 'white' : '#222220',
      borderRadius: r,
      boxShadow: isDark ? CARD_SHADOW : '0 1px 0 rgba(255,255,255,1) inset,0 18px 48px rgba(0,0,0,0.12)',
    }}>
      <BlurBg hue={hue} coverUrl={track.coverUrl} />
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', height: '100%',
        padding: p * 0.85, display: 'flex', flexDirection: 'column', gap: 12,
        textAlign,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {config.showAlbumArt && (
            <AlbumArtEl coverUrl={track.coverUrl} album={track.album} hue={hue} size={artSize} radius={4} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {config.showTitle && (
              <div style={{ fontSize: width * 0.052, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.02em' }}>{track.title}</div>
            )}
            {config.showArtist && (
              <div style={{ fontSize: width * 0.028, opacity: 0.8, marginTop: 4 }}>{track.artist}</div>
            )}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: width * 0.020, opacity: 0.6, marginTop: 4, letterSpacing: '0.04em' }}>
              {config.showYear && track.releaseYear}
              {config.showYear && config.showDuration && ' · '}
              {config.showDuration && track.duration}
            </div>
          </div>
        </div>
        {config.showLyrics && lyric && (
          <div style={{ marginTop: 'auto' }}>
            <GlassLyric lyric={lyric} fontSize={width * 0.028} dark={!isDark} />
          </div>
        )}
      </div>
    </div>
  )
}
