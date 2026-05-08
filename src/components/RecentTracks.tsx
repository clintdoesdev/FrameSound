'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { TrackData } from '@/types'

type Props = { onSelect: (track: TrackData) => void }

const STORAGE_KEY = 'framesound_recent'
const MAX_RECENT = 5

export function addRecentTrack(track: TrackData) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const existing: TrackData[] = raw ? JSON.parse(raw) : []
    const deduped = [track, ...existing.filter(t => t.id !== track.id)].slice(0, MAX_RECENT)
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
    <div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em', marginBottom: 8 }}>RECENT</div>
      <div className="scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
        {recent.map(track => (
          <button
            key={track.id}
            onClick={() => onSelect(track)}
            title={`${track.title} — ${track.artist}`}
            style={{
              position: 'relative', width: 44, height: 44,
              borderRadius: 6, overflow: 'hidden', flexShrink: 0,
              border: '1px solid var(--line)', cursor: 'pointer',
              background: 'var(--bg-2)', padding: 0,
              transition: 'border-color 120ms, transform 120ms',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.transform = 'scale(1.06)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--line)'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {track.coverUrl ? (
              <Image src={track.coverUrl} alt={track.title} fill style={{ objectFit: 'cover' }} unoptimized />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--bg-3)' }} />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
