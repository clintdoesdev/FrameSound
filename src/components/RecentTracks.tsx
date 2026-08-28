'use client'

import { useState } from 'react'
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
  const [recent] = useState<TrackData[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })

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
            className="glass dock-tile"
            style={{
              position: 'relative', width: 44, height: 44,
              borderRadius: 10, overflow: 'hidden', flexShrink: 0,
              cursor: 'pointer', padding: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)' }}
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
