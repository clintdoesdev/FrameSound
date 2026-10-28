'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { TrackData } from '@/types'
import { Glass } from '@/lib/liquid-glass/LiquidGlass'

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
  // Read after mount: the server render has no localStorage, and reading it
  // during the first client render would mismatch hydration.
  const [recent, setRecent] = useState<TrackData[]>([])
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setRecent(JSON.parse(raw))
    } catch { /* localStorage unavailable */ }
  }, [])

  if (recent.length === 0) return null

  return (
    <Glass className="recent-bar" style={{
      display: 'flex', alignItems: 'center', gap: 10, minWidth: 0,
      borderRadius: 16, padding: '7px 8px 7px 14px',
    }}>
      <span className="eyebrow" style={{ flex: 'none' }}>Recent</span>
      <div className="scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: 2 }}>
        {recent.map(track => (
          <button
            key={track.id}
            type="button"
            onClick={() => onSelect(track)}
            title={`${track.title} — ${track.artist}`}
            aria-label={`Open ${track.title} by ${track.artist}`}
            className="recent-tile"
          >
            {track.coverUrl ? (
              <Image src={track.coverUrl} alt="" fill sizes="40px" style={{ objectFit: 'cover' }} unoptimized />
            ) : (
              <span style={{ position: 'absolute', inset: 0, background: 'var(--surface-3)' }} />
            )}
          </button>
        ))}
      </div>
    </Glass>
  )
}
