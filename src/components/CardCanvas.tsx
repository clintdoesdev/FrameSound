'use client'

import React from 'react'
import Image from 'next/image'
import { TrackData, CardConfig } from '@/types'

type Props = {
  track: TrackData
  config: CardConfig
  cardRef: React.RefObject<HTMLDivElement>
}

const sizeMap: Record<CardConfig['size'], { width: number; height: number }> = {
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
      background: `radial-gradient(ellipse at 25% 20%, oklch(0.62 0.18 ${hue}) 0%, transparent 55%),
                   radial-gradient(ellipse at 80% 70%, oklch(0.40 0.16 ${hue + 30}) 0%, transparent 55%),
                   repeating-linear-gradient(135deg, oklch(0.32 0.10 ${hue}) 0 18px, oklch(0.22 0.08 ${hue}) 18px 36px)`,
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

function BgLayer({ config }: { config: CardConfig }) {
  if (config.bgStyle === 'solid') {
    return <div style={{ position: 'absolute', inset: 0, background: config.bgColor, zIndex: 0 }} />
  }
  if (config.bgStyle === 'gradient') {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: `linear-gradient(160deg, oklch(0.24 0.10 ${config.tintHue}), oklch(0.14 0.06 ${config.tintHue + 30}))`,
      }} />
    )
  }
  if (config.bgStyle === 'transparent') {
    return null
  }
  return null
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
  const textClass = config.textColor === 'black' ? 'fcard text-dark' : 'fcard'
  const textAlign = config.textAlign ?? 'left'

  const baseStyle: React.CSSProperties = {
    width, height,
    fontFamily: ff,
    ['--card-radius' as string]: `${r}px`,
    transition: 'opacity 150ms ease',
  }

  if (config.preset === 'glass') {
    // Liquid glass preset — iOS-style frosted card, artwork at top, meta below
    const artRadius = r * 0.7
    const isLandscape = width > height * 1.15

    if (isLandscape) {
      // Side-by-side layout for landscape
      const artSize = Math.round(height - p * 2)
      return (
        <div ref={cardRef} className="fcard liquid-glass" style={{
          ...baseStyle, color: 'white',
          display: 'flex', flexDirection: 'row',
          overflow: 'hidden',
          background: 'transparent',
        }}>
          {useBlur
            ? <BlurBg hue={hue} coverUrl={track.coverUrl} />
            : <BgLayer config={config} />}

          <div style={{
            position: 'absolute', inset: 1, borderRadius: r - 1,
            background:
              'radial-gradient(120% 60% at 20% 0%, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0) 52%),' +
              'radial-gradient(80% 40% at 80% 0%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 58%)',
            mixBlendMode: 'screen', zIndex: 2, pointerEvents: 'none',
          }} />

          <div style={{
            position: 'absolute', left: 1, right: 1, bottom: 1, height: '38%',
            borderRadius: `0 0 ${r - 1}px ${r - 1}px`,
            background: 'linear-gradient(to top, rgba(255,255,255,0.09), rgba(255,255,255,0))',
            zIndex: 2, pointerEvents: 'none',
          }} />

          <div style={{
            position: 'relative', zIndex: 3, padding: p,
            display: 'flex', flexDirection: 'row', gap: p * 0.8,
            width: '100%', height: '100%',
            background: 'transparent',
          }}>
            {config.showAlbumArt && (
              <div style={{
                width: artSize, height: artSize, position: 'relative',
                borderRadius: artRadius, overflow: 'hidden', flexShrink: 0,
                boxShadow: '0 18px 40px -12px rgba(0,0,0,0.6), 0 4px 12px -2px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.10) inset',
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
              textAlign: textAlign,
              background: 'transparent',
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
                <div className="mono" style={{ fontSize: width * 0.022, opacity: 0.55, letterSpacing: '0.04em', marginTop: 2 }}>
                  {config.showYear && <span>{track.releaseYear}</span>}
                  {config.showYear && config.showDuration && <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>}
                  {config.showDuration && <span>{track.duration}</span>}
                </div>
              )}
              {config.showLyrics && lyric && (
                <div style={{
                  marginTop: 6, padding: '8px 10px',
                  background: 'rgba(0,0,0,0.22)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: r * 0.4,
                  fontSize: width * 0.026, fontStyle: 'italic', opacity: 0.9, lineHeight: 1.45,
                }}>
                  &ldquo;{lyric}&rdquo;
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div ref={cardRef} className="fcard liquid-glass" style={{
        ...baseStyle, color: 'white',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        background: 'transparent',
      }}>
        {/* Blurred art or colour background fills the entire card behind everything */}
        {useBlur
          ? <BlurBg hue={hue} coverUrl={track.coverUrl} />
          : <BgLayer config={config} />}

        {/* Specular top-left highlight — simulates ::before */}
        <div style={{
          position: 'absolute', inset: 1, borderRadius: r - 1,
          background:
            'radial-gradient(120% 60% at 20% 0%, rgba(255,255,255,0.40) 0%, rgba(255,255,255,0) 52%),' +
            'radial-gradient(80% 40% at 80% 0%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 58%)',
          mixBlendMode: 'screen', zIndex: 2, pointerEvents: 'none',
        }} />

        {/* Bottom refraction glint — simulates ::after */}
        <div style={{
          position: 'absolute', left: 1, right: 1, bottom: 1, height: '38%',
          borderRadius: `0 0 ${r - 1}px ${r - 1}px`,
          background: 'linear-gradient(to top, rgba(255,255,255,0.09), rgba(255,255,255,0))',
          zIndex: 2, pointerEvents: 'none',
        }} />

        {/* Content layer */}
        <div style={{
          position: 'relative', zIndex: 3, padding: p,
          display: 'flex', flexDirection: 'column', height: '100%', gap: p * 0.6,
          background: 'transparent',
        }}>
          {/* Artwork — full width, square */}
          {config.showAlbumArt && (
            <div style={{
              width: '100%', aspectRatio: '1 / 1',
              borderRadius: artRadius, overflow: 'hidden', flexShrink: 0,
              boxShadow: '0 18px 40px -12px rgba(0,0,0,0.6), 0 4px 12px -2px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.10) inset',
              position: 'relative',
              background: 'transparent',
            }}>
              {track.coverUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={track.coverUrl} alt={track.album} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div className="albumart" style={{ width: '100%', height: '100%', borderRadius: 0, ['--art-hue' as string]: hue }}>
                    <span style={{ position: 'relative', zIndex: 1, opacity: 0.85 }}>ART</span>
                  </div>
              }
              {/* Artwork corner sheen */}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 35%)',
              }} />
            </div>
          )}

          {/* Metadata */}
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 2,
            textAlign: textAlign,
            background: 'transparent',
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
              <div className="mono" style={{ fontSize: width * 0.022, opacity: 0.55, letterSpacing: '0.04em', marginTop: 2 }}>
                {config.showYear && <span>{track.releaseYear}</span>}
                {config.showYear && config.showDuration && <span style={{ margin: '0 6px', opacity: 0.5 }}>·</span>}
                {config.showDuration && <span>{track.duration}</span>}
              </div>
            )}
            {config.showLyrics && lyric && (
              <div style={{
                marginTop: 6, padding: '8px 10px',
                background: 'rgba(0,0,0,0.22)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: r * 0.4,
                fontSize: width * 0.026, fontStyle: 'italic', opacity: 0.9, lineHeight: 1.45,
              }}>
                &ldquo;{lyric}&rdquo;
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (config.preset === 'poster') {
    return (
      <div ref={cardRef} className="fcard" style={{ ...baseStyle, color: 'white' }}>
        {useBlur ? (
          <>
            {track.coverUrl
              ? <img src={track.coverUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
              : <div className="albumart" style={{ position: 'absolute', inset: 0, borderRadius: 0, zIndex: 0, ['--art-hue' as string]: hue }} />
            }
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background: 'linear-gradient(180deg, transparent 30%, oklch(0 0 0 / 0.5) 65%, oklch(0 0 0 / 0.92) 100%)',
            }} />
          </>
        ) : (
          <BgLayer config={config} />
        )}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, padding: p, zIndex: 2,
          display: 'flex', flexDirection: 'column', gap: 6,
          textAlign: textAlign,
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
            <div className="mono" style={{ fontSize: width * 0.020, opacity: 0.65, letterSpacing: '0.04em' }}>
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
    const textPrimary = isDark ? 'oklch(0.97 0.003 80)' : 'oklch(0.14 0.005 80)'
    const bg = config.bgStyle === 'solid' ? config.bgColor
      : isDark ? 'oklch(0.13 0.005 80)' : 'oklch(0.97 0.003 80)'
    return (
      <div ref={cardRef} className={textClass} style={{ ...baseStyle, background: bg }}>
        <div style={{
          position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: p,
          display: 'flex', alignItems: 'center', gap: p * 0.9,
        }}>
          {config.showAlbumArt && (
            <AlbumArtEl coverUrl={track.coverUrl} album={track.album} hue={hue} size={artSize} radius={4} />
          )}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, textAlign: textAlign }}>
            <div className="mono" style={{ fontSize: width * 0.020, letterSpacing: '0.08em', opacity: 0.55, textTransform: 'uppercase' }}>
              FrameSound · {track.album}
            </div>
            {config.showTitle && (
              <div style={{ fontSize: width * 0.060, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.025em' }}>{track.title}</div>
            )}
            {config.showArtist && (
              <div style={{ fontSize: width * 0.030, fontWeight: 500, opacity: 0.78 }}>{track.artist}</div>
            )}
            <div style={{ marginTop: 6, height: 1, background: isDark ? 'oklch(1 0 0 / 0.14)' : 'oklch(0 0 0 / 0.12)' }} />
            <div className="mono" style={{ fontSize: width * 0.022, opacity: 0.6, letterSpacing: '0.04em', display: 'flex', gap: 14 }}>
              {config.showYear && <span>{track.releaseYear}</span>}
              {config.showDuration && <span>{track.duration}</span>}
            </div>
            {config.showLyrics && lyric && (
              <div style={{ fontSize: width * 0.026, fontStyle: 'italic', opacity: 0.7, lineHeight: 1.45, marginTop: 10, color: textPrimary }}>
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
      <div ref={cardRef} className="fcard" style={{ ...baseStyle, width: sw, height: sh, color: 'white' }}>
        <BlurBg hue={hue} coverUrl={track.coverUrl} />
        <div style={{
          position: 'relative', zIndex: 1, width: '100%', height: '100%', padding: p,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
          textAlign: 'center',
        }}>
          <div className="mono" style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.16em' }}>FRAMESOUND · STORY</div>
          {config.showAlbumArt && (
            <AlbumArtEl coverUrl={track.coverUrl} album={track.album} hue={hue} size={artSize} radius={8} />
          )}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', textAlign: textAlign }}>
            {config.showTitle && (
              <div style={{ fontSize: sw * 0.085, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>{track.title}</div>
            )}
            {config.showArtist && (
              <div style={{ fontSize: sw * 0.038, opacity: 0.85 }}>{track.artist}</div>
            )}
            {config.showLyrics && lyric && (
              <div className="glass" style={{ marginTop: 8, padding: '12px 16px', fontSize: sw * 0.034, fontStyle: 'italic', lineHeight: 1.4, maxWidth: '92%' }}>
                &ldquo;{lyric}&rdquo;
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
    <div ref={cardRef} className={textClass} style={{ ...baseStyle, width, height: width }}>
      <BlurBg hue={hue} coverUrl={track.coverUrl} />
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', height: '100%',
        padding: p * 0.85, display: 'flex', flexDirection: 'column', gap: 12,
        textAlign: textAlign,
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
            <div className="mono" style={{ fontSize: width * 0.020, opacity: 0.6, marginTop: 4, letterSpacing: '0.04em' }}>
              {config.showYear && track.releaseYear}
              {config.showYear && config.showDuration && ' · '}
              {config.showDuration && track.duration}
            </div>
          </div>
        </div>
        {config.showLyrics && lyric && (
          <div className="glass" style={{ padding: 14, marginTop: 'auto', fontSize: width * 0.028, fontStyle: 'italic', lineHeight: 1.45 }}>
            &ldquo;{lyric}&rdquo;
          </div>
        )}
      </div>
    </div>
  )
}
