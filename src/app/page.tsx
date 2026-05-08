'use client'

import { useState, useRef } from 'react'
import { getTrackFromUrl } from '@/actions/spotify'
import { getLyrics } from '@/actions/lyrics'
import { TrackData, CardConfig, defaultConfig } from '@/types'
import CardCanvas from '@/components/CardCanvas'
import LyricsPanel from '@/components/LyricsPanel'
import CustomizePanel from '@/components/CustomizePanel'
import ExportBar from '@/components/ExportBar'
import AudioPreview from '@/components/AudioPreview'
import RecentTracks, { addRecentTrack } from '@/components/RecentTracks'

export default function Home() {
  const [spotifyUrl, setSpotifyUrl] = useState('')
  const [track, setTrack] = useState<TrackData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lyrics, setLyrics] = useState<string[]>([])
  const [lyricsLoading, setLyricsLoading] = useState(false)
  const [selectedLines, setSelectedLines] = useState<string[]>([])
  const [customQuote, setCustomQuote] = useState('')
  const [config, setConfig] = useState<CardConfig>(defaultConfig)
  const [showCustomize, setShowCustomize] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)
  const [isDark, setIsDark] = useState(true)

  const cardRef = useRef<HTMLDivElement>(null!)

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSpotifyUrl(val)
    if (val.includes('spotify.com/track/') || val.includes('spotify:track:')) {
      setLoading(true)
      setError(null)
      setTrack(null)
      setLyrics([])
      setSelectedLines([])
      setCustomQuote('')
      const result = await getTrackFromUrl(val)
      if (result.data) {
        setTrack(result.data)
        addRecentTrack(result.data)
        setLyricsLoading(true)
        const lyricsResult = await getLyrics(result.data.artist, result.data.title)
        setLyrics(lyricsResult.lines)
        setLyricsLoading(false)
      } else {
        setError(result.error)
      }
      setLoading(false)
    }
  }

  const handleLineSelect = (line: string) => {
    setSelectedLines((prev) =>
      prev.includes(line)
        ? prev.filter((l) => l !== line)
        : prev.length < 2
        ? [...prev, line]
        : [prev[1], line]
    )
  }

  const effectiveSelectedLines =
    customQuote && lyrics.length === 0 ? [customQuote] : selectedLines

  return (
    <main
      style={{
        minHeight: '100vh',
        background: isDark ? '#0a0a0a' : '#f4f4f5',
        color: isDark ? '#f4f4f5' : '#09090b',
      }}
    >
      {/* HEADER */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: `1px solid ${isDark ? '#18181b' : '#e4e4e7'}`,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-syne)',
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Frame<span style={{ color: '#22c55e' }}>Sound</span>
          </h1>
          <p style={{ fontSize: 12, color: '#71717a', margin: '2px 0 0' }}>
            Spotify → Beautiful Cards
          </p>
        </div>
        <button
          onClick={() => setIsDark(!isDark)}
          style={{
            fontSize: 12,
            color: '#71717a',
            border: `1px solid ${isDark ? '#27272a' : '#d4d4d8'}`,
            padding: '6px 12px',
            borderRadius: 9999,
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          {isDark ? '☀ Light' : '🌙 Dark'}
        </button>
      </header>

      {/* INPUT BAR */}
      <div style={{ padding: '20px 16px', maxWidth: 672, margin: '0 auto' }}>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#22c55e',
              fontSize: 18,
            }}
          >
            ♫
          </span>
          <input
            type="text"
            value={spotifyUrl}
            onChange={handleInput}
            placeholder="Paste a Spotify track link..."
            style={{
              width: '100%',
              background: isDark ? '#18181b' : '#fff',
              border: `1px solid ${isDark ? '#27272a' : '#d4d4d8'}`,
              borderRadius: 16,
              padding: '16px 40px 16px 44px',
              fontSize: 14,
              color: isDark ? '#e4e4e7' : '#18181b',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = isDark ? '#27272a' : '#d4d4d8')}
          />
          {spotifyUrl && (
            <button
              onClick={() => {
                setSpotifyUrl('')
                setTrack(null)
                setError(null)
              }}
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#71717a',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              ×
            </button>
          )}
        </div>
        {error && (
          <p style={{ color: '#f87171', fontSize: 12, marginTop: 8, paddingLeft: 4 }}>{error}</p>
        )}
      </div>

      {/* RECENT TRACKS */}
      <div style={{ padding: '0 16px 8px', maxWidth: 672, margin: '0 auto' }}>
        <RecentTracks
          onSelect={(t) => {
            setTrack(t)
            setSpotifyUrl(`https://open.spotify.com/track/${t.id}`)
            setLyricsLoading(true)
            getLyrics(t.artist, t.title).then((r) => {
              setLyrics(r.lines)
              setLyricsLoading(false)
            })
          }}
        />
      </div>

      {/* EMPTY STATE */}
      {!track && !loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 16px',
          }}
        >
          <div
            style={{
              border: `2px dashed ${isDark ? '#27272a' : '#d4d4d8'}`,
              borderRadius: 24,
              padding: '48px 32px',
              textAlign: 'center',
              maxWidth: 384,
              width: '100%',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
            <p style={{ color: '#71717a', fontSize: 14, marginBottom: 24 }}>
              Paste a Spotify link above to get started
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {['Liquid Glass Cards', 'Lyrics Quotes', 'HD Export'].map((f) => (
                <span
                  key={f}
                  style={{
                    fontSize: 12,
                    background: isDark ? '#18181b' : '#f4f4f5',
                    border: `1px solid ${isDark ? '#27272a' : '#d4d4d8'}`,
                    color: '#71717a',
                    padding: '6px 12px',
                    borderRadius: 9999,
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LOADING SKELETON */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div
            className="animate-pulse-slow"
            style={{
              width: 340,
              height: 340,
              background: '#18181b',
              borderRadius: 24,
            }}
          />
        </div>
      )}

      {/* MAIN EDITOR */}
      {track && !loading && (
        <>
          {/* DESKTOP: 3 column layout */}
          <div
            className="hidden lg:flex"
            style={{ gap: 16, padding: '16px 24px', maxWidth: 1280, margin: '0 auto' }}
          >
            {/* Lyrics - left */}
            <div
              style={{
                width: 256,
                flexShrink: 0,
                background: isDark ? 'rgba(24,24,27,0.5)' : '#fff',
                border: `1px solid ${isDark ? 'rgba(39,39,42,0.5)' : '#e4e4e7'}`,
                borderRadius: 16,
                padding: 16,
                maxHeight: 600,
                overflowY: 'auto',
              }}
            >
              <LyricsPanel
                lines={lyrics}
                loading={lyricsLoading}
                selectedLines={selectedLines}
                onSelect={handleLineSelect}
                customQuote={customQuote}
                onCustomQuote={setCustomQuote}
              />
            </div>

            {/* Card - center */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                paddingTop: 16,
              }}
            >
              <CardCanvas
                track={track}
                config={config}
                selectedLines={effectiveSelectedLines}
                cardRef={cardRef}
              />
              {track.previewUrl && <AudioPreview previewUrl={track.previewUrl} />}
            </div>

            {/* Customize - right */}
            <div
              style={{
                width: 288,
                flexShrink: 0,
                background: isDark ? 'rgba(24,24,27,0.5)' : '#fff',
                border: `1px solid ${isDark ? 'rgba(39,39,42,0.5)' : '#e4e4e7'}`,
                borderRadius: 16,
                padding: 16,
                maxHeight: 600,
                overflowY: 'auto',
              }}
            >
              <CustomizePanel
                config={config}
                onChange={(u) => setConfig((p) => ({ ...p, ...u }))}
              />
            </div>
          </div>

          {/* MOBILE: card + buttons */}
          <div
            className="lg:hidden"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px',
              gap: 16,
            }}
          >
            <div style={{ overflowX: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
              <CardCanvas
                track={track}
                config={config}
                selectedLines={effectiveSelectedLines}
                cardRef={cardRef}
              />
            </div>
            {track.previewUrl && <AudioPreview previewUrl={track.previewUrl} />}
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button
                onClick={() => setShowLyrics(true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: isDark ? '#18181b' : '#fff',
                  border: `1px solid ${isDark ? '#27272a' : '#d4d4d8'}`,
                  borderRadius: 16,
                  fontSize: 14,
                  color: isDark ? '#d4d4d8' : '#18181b',
                  cursor: 'pointer',
                }}
              >
                🎤 Lyrics
              </button>
              <button
                onClick={() => setShowCustomize(true)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: isDark ? '#18181b' : '#fff',
                  border: `1px solid ${isDark ? '#27272a' : '#d4d4d8'}`,
                  borderRadius: 16,
                  fontSize: 14,
                  color: isDark ? '#d4d4d8' : '#18181b',
                  cursor: 'pointer',
                }}
              >
                🎨 Customize
              </button>
            </div>
          </div>

          {/* MOBILE BOTTOM SHEET — Customize */}
          {showCustomize && (
            <div
              className="lg:hidden"
              style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
            >
              <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
                onClick={() => setShowCustomize(false)}
              />
              <div
                style={{
                  position: 'relative',
                  background: '#09090b',
                  borderTop: '1px solid #27272a',
                  borderRadius: '24px 24px 0 0',
                  padding: 20,
                  maxHeight: '80vh',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 4,
                    background: '#3f3f46',
                    borderRadius: 9999,
                    margin: '0 auto 16px',
                  }}
                />
                <CustomizePanel
                  config={config}
                  onChange={(u) => setConfig((p) => ({ ...p, ...u }))}
                />
              </div>
            </div>
          )}

          {/* MOBILE BOTTOM SHEET — Lyrics */}
          {showLyrics && (
            <div
              className="lg:hidden"
              style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
            >
              <div
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
                onClick={() => setShowLyrics(false)}
              />
              <div
                style={{
                  position: 'relative',
                  background: '#09090b',
                  borderTop: '1px solid #27272a',
                  borderRadius: '24px 24px 0 0',
                  padding: 20,
                  maxHeight: '80vh',
                  overflowY: 'auto',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 4,
                    background: '#3f3f46',
                    borderRadius: 9999,
                    margin: '0 auto 16px',
                  }}
                />
                <LyricsPanel
                  lines={lyrics}
                  loading={lyricsLoading}
                  selectedLines={selectedLines}
                  onSelect={handleLineSelect}
                  customQuote={customQuote}
                  onCustomQuote={setCustomQuote}
                />
              </div>
            </div>
          )}

          {/* EXPORT BAR */}
          <div style={{ position: 'sticky', bottom: 0, zIndex: 40 }}>
            <ExportBar cardRef={cardRef} track={track} />
          </div>
        </>
      )}
    </main>
  )
}
