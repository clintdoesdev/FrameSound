'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { TrackData } from '@/types'

type Props = {
  onSelect: (track: TrackData) => void
}

const STORAGE_KEY = 'framesound_recent'

export function addRecentTrack(track: TrackData) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const existing: TrackData[] = raw ? JSON.parse(raw) : []
    const deduped = [track, ...existing.filter((t) => t.id !== track.id)].slice(0, 8)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped))
  } catch { /* localStorage unavailable */ }
}

export default function RecentTracks({ onSelect }: Props) {
  const [recent, setRecent] = useState<TrackData[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setRecent(JSON.parse(raw))
    } catch { /* localStorage unavailable */ }
  }, [])

  if (recent.length === 0) return null

  return (
    <div style={{
      borderBottom: '1px solid var(--line-soft)',
      background: 'var(--bg)',
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      flexShrink: 0,
    }}>
      <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
        RECENT
      </div>
      <div className="scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', flex: 1 }}>
        {recent.map((track) => (
          <button
            key={track.id}
            onClick={() => onSelect(track)}
            title={`${track.title} — ${track.artist}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '4px 8px 4px 4px',
              background: 'var(--bg-1)',
              border: '1px solid var(--line)',
              borderRadius: 999, cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 120ms, border-color 120ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-2)'
              e.currentTarget.style.borderColor = 'var(--line-1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-1)'
              e.currentTarget.style.borderColor = 'var(--line)'
            }}
          >
            <div style={{ width: 20, height: 20, borderRadius: 4, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
              {track.coverUrl ? (
                <Image src={track.coverUrl} alt={track.title} fill style={{ objectFit: 'cover' }} unoptimized />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--bg-3)' }} />
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--fg-1)', whiteSpace: 'nowrap' }}>{track.title}</span>
            <span style={{ fontSize: 12, color: 'var(--fg-3)', whiteSpace: 'nowrap' }}>· {track.artist}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
