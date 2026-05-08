'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  previewUrl: string
}

export default function AudioPreview({ previewUrl }: Props) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(previewUrl)
    audioRef.current = audio

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    }
    const handleEnded = () => {
      setPlaying(false)
      setProgress(0)
    }
    const handleError = () => setError(true)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.pause()
    }
  }, [previewUrl])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setError(true))
    }
  }

  if (error) return null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: 9999,
        padding: '8px 16px',
        marginTop: 12,
      }}
    >
      {/* Play/pause button */}
      <button
        onClick={togglePlay}
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: '#22c55e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {playing ? (
          <div style={{ display: 'flex', gap: 3 }}>
            <div style={{ width: 3, height: 12, background: '#fff', borderRadius: 2 }} />
            <div style={{ width: 3, height: 12, background: '#fff', borderRadius: 2 }} />
          </div>
        ) : (
          <svg width="12" height="14" viewBox="0 0 12 14" fill="white">
            <path d="M2 1.5l9 5-9 5v-10z" />
          </svg>
        )}
      </button>

      {/* Equalizer bars */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 16 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 3,
              background: '#4ade80',
              borderRadius: 2,
              height: playing ? undefined : 4,
              animation: playing
                ? `eq-bounce-${i} ${0.6 + i * 0.15}s ease-in-out infinite alternate`
                : 'none',
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes eq-bounce-0 { from { height: 4px; } to { height: 16px; } }
        @keyframes eq-bounce-1 { from { height: 8px; } to { height: 12px; } }
        @keyframes eq-bounce-2 { from { height: 6px; } to { height: 14px; } }
      `}</style>

      {/* Progress bar */}
      <div
        style={{
          flex: 1,
          height: 4,
          background: '#3f3f46',
          borderRadius: 9999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: '#22c55e',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      <span style={{ fontSize: 11, color: '#71717a', whiteSpace: 'nowrap' }}>30s preview</span>
    </div>
  )
}
