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
  '1:1': { width: 500, height: 500 },
  '16:9': { width: 600, height: 338 },
  '4:5': { width: 480, height: 600 },
  '9:16': { width: 360, height: 640 },
}

const fontMap: Record<CardConfig['font'], string> = {
  syne: 'var(--font-syne)',
  'dm-serif': "'DM Serif Display', serif",
  playfair: "'Playfair Display', serif",
  bebas: "'Bebas Neue', cursive",
  instrument: "'Instrument Serif', serif",
}

function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000)
  const secs = Math.floor((ms % 60000) / 1000)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function CardCanvas({ track, config, selectedLines, cardRef }: Props) {
  const { width, height } = sizeMap[config.size]
  const fontFamily = fontMap[config.font]
  const tintFilter = config.tintHue !== 0 ? `hue-rotate(${config.tintHue}deg)` : undefined

  const coverSrc = track.coverUrl ?? '/next.svg'

  function renderGlass() {
    return (
      <div
        ref={cardRef}
        style={{
          width,
          height,
          borderRadius: config.borderRadius,
          position: 'relative',
          overflow: 'hidden',
          fontFamily,
          flexShrink: 0,
        }}
      >
        {/* Background blurred art */}
        <img
          src={coverSrc}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `blur(40px) saturate(150%)${tintFilter ? ` ${tintFilter}` : ''}`,
            transform: 'scale(1.3)',
            opacity: 0.7,
          }}
        />
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
        {/* Center content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 16,
            padding: config.padding,
          }}
        >
          {config.showAlbumArt && track.coverUrl && (
            <Image
              src={track.coverUrl}
              alt={track.album}
              width={200}
              height={200}
              style={{ borderRadius: 16, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
              unoptimized
            />
          )}
          {/* Glass info panel */}
          <div
            className="glass-panel"
            style={{ padding: '16px 24px', textAlign: 'center', maxWidth: '80%' }}
          >
            {config.showTitle && (
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                {track.title}
              </div>
            )}
            {config.showArtist && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{track.artist}</div>
            )}
            {(config.showYear || config.showDuration) && (
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'monospace',
                  marginTop: 4,
                }}
              >
                {config.showYear && track.releaseYear}
                {config.showYear && config.showDuration && ' · '}
                {config.showDuration && formatDuration(track.duration)}
              </div>
            )}
          </div>
          {config.showLyrics && selectedLines.length > 0 && (
            <div
              style={{
                marginTop: 4,
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 9999,
                fontSize: 12,
                color: 'rgba(255,255,255,0.8)',
                fontStyle: 'italic',
                textAlign: 'center',
                maxWidth: 320,
              }}
            >
              &ldquo;{selectedLines.join(' / ')}&rdquo;
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderPoster() {
    return (
      <div
        ref={cardRef}
        className="noise-bg"
        style={{
          width,
          height,
          borderRadius: config.borderRadius,
          position: 'relative',
          overflow: 'hidden',
          fontFamily,
          flexShrink: 0,
        }}
      >
        <img
          src={coverSrc}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: tintFilter,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: config.padding,
          }}
        >
          {config.showArtist && (
            <div
              style={{
                fontSize: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: 4,
              }}
            >
              {track.artist}
            </div>
          )}
          {config.showTitle && (
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: '#fff',
                lineHeight: 1.1,
              }}
            >
              {track.title}
            </div>
          )}
          {config.showLyrics && selectedLines.length > 0 && (
            <div
              style={{ marginTop: 12, fontSize: 14, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}
            >
              &ldquo;{selectedLines.join(' / ')}&rdquo;
            </div>
          )}
          {config.showYear && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: 'rgba(255,255,255,0.4)',
                fontFamily: 'monospace',
              }}
            >
              {track.releaseYear}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderMinimal() {
    const bg =
      config.bgStyle === 'solid'
        ? config.bgColor
        : config.textColor === 'black'
        ? '#fff'
        : '#111'
    const textPrimary = config.textColor === 'black' ? '#111' : '#f5f5f5'
    return (
      <div
        ref={cardRef}
        style={{
          width,
          height,
          borderRadius: config.borderRadius,
          position: 'relative',
          overflow: 'hidden',
          fontFamily,
          background: bg,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 24,
            padding: config.padding,
            height: '100%',
          }}
        >
          {config.showAlbumArt && track.coverUrl && (
            <Image
              src={track.coverUrl}
              alt={track.album}
              width={160}
              height={160}
              style={{ borderRadius: 12, flexShrink: 0 }}
              unoptimized
            />
          )}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {config.showTitle && (
              <div style={{ fontSize: 24, fontWeight: 700, color: textPrimary }}>{track.title}</div>
            )}
            <hr style={{ width: '100%', borderColor: textPrimary, opacity: 0.2, margin: '12px 0' }} />
            {config.showArtist && (
              <div style={{ fontSize: 14, color: textPrimary, opacity: 0.6 }}>{track.artist}</div>
            )}
            {(config.showYear || config.showDuration) && (
              <div
                style={{
                  fontSize: 12,
                  fontFamily: 'monospace',
                  color: textPrimary,
                  opacity: 0.4,
                  marginTop: 8,
                }}
              >
                {config.showYear && track.releaseYear}
                {config.showYear && config.showDuration && ' · '}
                {config.showDuration && formatDuration(track.duration)}
              </div>
            )}
            {config.showLyrics && selectedLines.length > 0 && (
              <div
                style={{
                  fontSize: 12,
                  fontStyle: 'italic',
                  color: textPrimary,
                  opacity: 0.5,
                  marginTop: 12,
                  lineHeight: 1.6,
                }}
              >
                &ldquo;{selectedLines.join(' / ')}&rdquo;
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  function renderStory() {
    return (
      <div
        ref={cardRef}
        style={{
          width,
          height,
          borderRadius: config.borderRadius,
          position: 'relative',
          overflow: 'hidden',
          fontFamily,
          flexShrink: 0,
        }}
      >
        <img
          src={coverSrc}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `blur(40px) saturate(150%)${tintFilter ? ` ${tintFilter}` : ''}`,
            transform: 'scale(1.3)',
            opacity: 0.7,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} />
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 24,
            padding: '0 24px',
          }}
        >
          {config.showAlbumArt && track.coverUrl && (
            <Image
              src={track.coverUrl}
              alt={track.album}
              width={220}
              height={220}
              style={{ borderRadius: 24, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
              unoptimized
            />
          )}
          {config.showTitle && (
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#fff',
                textAlign: 'center',
                marginTop: 16,
              }}
            >
              {track.title}
            </div>
          )}
          {config.showArtist && (
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
              {track.artist}
            </div>
          )}
          {config.showLyrics && selectedLines.length > 0 && (
            <div
              className="glass-panel"
              style={{
                marginTop: 8,
                padding: '12px 24px',
                fontSize: 14,
                color: 'rgba(255,255,255,0.8)',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              &ldquo;{selectedLines.join(' / ')}&rdquo;
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderSquare() {
    return (
      <div
        ref={cardRef}
        style={{
          width,
          height,
          borderRadius: config.borderRadius,
          position: 'relative',
          overflow: 'hidden',
          fontFamily,
          flexShrink: 0,
        }}
      >
        <img
          src={coverSrc}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `blur(40px) saturate(150%)${tintFilter ? ` ${tintFilter}` : ''}`,
            transform: 'scale(1.3)',
            opacity: 0.7,
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: 12,
            padding: config.padding,
          }}
        >
          {config.showAlbumArt && track.coverUrl && (
            <Image
              src={track.coverUrl}
              alt={track.album}
              width={180}
              height={180}
              style={{ borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
              unoptimized
            />
          )}
          <div
            className="glass-panel"
            style={{ padding: '12px 20px', textAlign: 'center', maxWidth: '85%' }}
          >
            {config.showTitle && (
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                {track.title}
              </div>
            )}
            {config.showArtist && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{track.artist}</div>
            )}
            {(config.showYear || config.showDuration) && (
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'monospace',
                  marginTop: 4,
                }}
              >
                {config.showYear && track.releaseYear}
                {config.showYear && config.showDuration && ' · '}
                {config.showDuration && formatDuration(track.duration)}
              </div>
            )}
          </div>
          {config.showLyrics && selectedLines.length > 0 && (
            <div
              style={{
                padding: '6px 14px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 9999,
                fontSize: 11,
                color: 'rgba(255,255,255,0.8)',
                fontStyle: 'italic',
                textAlign: 'center',
                maxWidth: 300,
              }}
            >
              &ldquo;{selectedLines.join(' / ')}&rdquo;
            </div>
          )}
        </div>
      </div>
    )
  }

  switch (config.preset) {
    case 'poster':
      return renderPoster()
    case 'minimal':
      return renderMinimal()
    case 'story':
      return renderStory()
    case 'square':
      return renderSquare()
    default:
      return renderGlass()
  }
}
