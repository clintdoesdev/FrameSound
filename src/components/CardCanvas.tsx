'use client'

import React from 'react'
import Image from 'next/image'
import { TrackData, CardConfig } from '@/types'

type Props = {
  track: TrackData
  config: CardConfig
  selectedLines: string[]
  cardRef: React.RefObject<HTMLDivElement>
}

const sizeMap: Record<CardConfig['size'], { width: number; height: number }> = {
  '1:1':  { width: 520, height: 520 },
  '16:9': { width: 640, height: 360 },
  '4:5':  { width: 480, height: 600 },
  '9:16': { width: 360, height: 640 },
}

function fmt(ms: number) {
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function fontFamily(font: CardConfig['font']): string {
  if (font === 'mono') return 'var(--font-mono)'
  if (font === 'serif') return "'Instrument Serif', ui-serif, Georgia, serif"
  return 'var(--font-display)'
}

function BlurBg({ hue, coverUrl }: { hue: number; coverUrl: string | null }) {
  if (coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={coverUrl}
        alt=""
        style={{
          position: 'absolute', inset: '-10%',
          width: '120%', height: '120%',
          objectFit: 'cover',
          filter: 'blur(48px) saturate(140%)',
          zIndex: 0,
        }}
      />
    )
  }
  return (
    <div
      style={{
        position: 'absolute', inset: '-10%',
        background: `radial-gradient(ellipse at 25% 20%, oklch(0.62 0.18 ${hue}) 0%, transparent 55%),
                     radial-gradient(ellipse at 80% 70%, oklch(0.40 0.16 ${hue + 30}) 0%, transparent 55%),
                     repeating-linear-gradient(135deg, oklch(0.32 0.10 ${hue}) 0 18px, oklch(0.22 0.08 ${hue}) 18px 36px)`,
        zIndex: 0,
      }}
    />
  )
}

function AlbumArtEl({
  coverUrl, album, hue, size, radius,
}: {
  coverUrl: string | null; album: string; hue: number; size: number; radius?: number
}) {
  if (coverUrl) {
    return (
      <Image
        src={coverUrl}
        alt={album}
        width={size}
        height={size}
        style={{ borderRadius: radius ?? 6, flexShrink: 0, display: 'block' }}
        unoptimized
      />
    )
  }
  return (
    <div
      className="albumart"
      style={{
        width: size, height: size,
        borderRadius: radius ?? 6,
        flexShrink: 0,
        '--art-hue': hue,
      } as React.CSSProperties}
    >
      <span style={{ position: 'relative', zIndex: 1, opacity: 0.85 }}>ART</span>
    </div>
  )
}

function SolidBg({ config }: { config: CardConfig }) {
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
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'repeating-conic-gradient(oklch(0.92 0 0) 0% 25%, oklch(0.85 0 0) 0% 50%) 0 0 / 16px 16px',
      }} />
    )
  }
  return null
}

export default function CardCanvas({ track, config, selectedLines, cardRef }: Props) {
  const { width, height } = sizeMap[config.size]
  const ff = fontFamily(config.font)
  const hue = config.tintHue
  const p = config.padding
  const r = config.borderRadius
  const lyric = selectedLines.join(' / ')
  const textClass = config.textColor === 'black' ? 'fcard text-dark' : 'fcard'
  const useBlur = config.bgStyle === 'blurred-art'

  const baseStyle: React.CSSProperties = {
    width, height,
    fontFamily: ff,
    ['--card-radius' as string]: `${r}px`,
  }

  if (config.preset === 'glass') {
    const artSize = Math.min(width, height) * 0.42
    return (
      <div ref={cardRef} className={textClass} style={baseStyle}>
        {useBlur
          ? <BlurBg hue={hue} coverUrl={track.coverUrl} />
          : <SolidBg config={config} />}
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', height: '100%', padding: p,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="glass" style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', gap: 16,
            alignItems: 'center', justifyContent: 'center',
            padding: p * 0.9, textAlign: 'center',
          }}>
            {config.showAlbumArt && (
              <AlbumArtEl coverUrl={track.coverUrl} album={track.album} hue={hue} size={artSize} radius={6} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '90%' }}>
              {config.showTitle && (
                <div style={{ fontSize: width * 0.058, fontWeight: 600, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  {track.title}
                </div>
              )}
              {config.showArtist && (
                <div style={{ fontSize: width * 0.030, fontWeight: 500, opacity: 0.85 }}>{track.artist}</div>
              )}
              {(config.showYear || config.showDuration) && (
                <div className="mono" style={{ fontSize: width * 0.022, opacity: 0.6, letterSpacing: '0.04em', marginTop: 4 }}>
                  {config.showYear && <span>{track.releaseYear}</span>}
                  {config.showYear && config.showDuration && <span style={{ margin: '0 8px', opacity: 0.5 }}>·</span>}
                  {config.showDuration && <span>{fmt(track.duration)}</span>}
                </div>
              )}
            </div>
            {config.showLyrics && lyric && (
              <div style={{
                fontSize: width * 0.026, fontStyle: 'italic', opacity: 0.85, lineHeight: 1.45,
                maxWidth: '85%', marginTop: 8,
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
              ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={track.coverUrl} alt="" style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', zIndex: 0,
                }} />
              )
              : (
                <div className="albumart" style={{
                  position: 'absolute', inset: 0, borderRadius: 0, zIndex: 0,
                  ['--art-hue' as string]: hue,
                }} />
              )
            }
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background: 'linear-gradient(180deg, transparent 30%, oklch(0 0 0 / 0.5) 65%, oklch(0 0 0 / 0.92) 100%)',
            }} />
          </>
        ) : (
          <SolidBg config={config} />
        )}
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, padding: p, zIndex: 2,
          display: 'flex', flexDirection: 'column', gap: 6,
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
              {config.showDuration && <span>{fmt(track.duration)}</span>}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (config.preset === 'minimal') {
    const artSize = height - p * 2
    const isDark = config.textColor !== 'black'
    const textPrimary = isDark ? 'oklch(0.97 0.003 80)' : 'oklch(0.14 0.005 80)'
    const bg = config.bgStyle === 'solid' ? config.bgColor
      : isDark ? 'oklch(0.13 0.005 80)' : 'oklch(0.97 0.003 80)'
    return (
      <div ref={cardRef} className={textClass} style={{ ...baseStyle, background: bg }}>
        <div style={{
          position: 'relative', zIndex: 1,
          width: '100%', height: '100%', padding: p,
          display: 'flex', alignItems: 'center', gap: p * 0.9,
        }}>
          {config.showAlbumArt && (
            <AlbumArtEl coverUrl={track.coverUrl} album={track.album} hue={hue} size={artSize} radius={4} />
          )}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
              {config.showDuration && <span>{fmt(track.duration)}</span>}
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
          position: 'relative', zIndex: 1,
          width: '100%', height: '100%', padding: p,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
          textAlign: 'center',
        }}>
          <div className="mono" style={{ fontSize: 11, opacity: 0.7, letterSpacing: '0.16em' }}>
            FRAMESOUND · STORY
          </div>
          {config.showAlbumArt && (
            <AlbumArtEl coverUrl={track.coverUrl} album={track.album} hue={hue} size={artSize} radius={8} />
          )}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            {config.showTitle && (
              <div style={{ fontSize: sw * 0.085, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.03em' }}>{track.title}</div>
            )}
            {config.showArtist && (
              <div style={{ fontSize: sw * 0.038, opacity: 0.85 }}>{track.artist}</div>
            )}
            {config.showLyrics && lyric && (
              <div className="glass" style={{
                marginTop: 8, padding: '12px 16px',
                fontSize: sw * 0.034, fontStyle: 'italic', lineHeight: 1.4,
                maxWidth: '92%',
              }}>
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
    <div ref={cardRef} className={textClass} style={{ ...baseStyle, width: width, height: width }}>
      <BlurBg hue={hue} coverUrl={track.coverUrl} />
      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', height: '100%',
        padding: p * 0.85,
        display: 'flex', flexDirection: 'column', gap: 12,
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
              {config.showDuration && fmt(track.duration)}
            </div>
          </div>
        </div>
        {config.showLyrics && lyric && (
          <div className="glass" style={{
            padding: 14, marginTop: 'auto',
            fontSize: width * 0.028, fontStyle: 'italic', lineHeight: 1.45,
          }}>
            &ldquo;{lyric}&rdquo;
          </div>
        )}
      </div>
    </div>
  )
}
