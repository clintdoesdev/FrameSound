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
    const deduped = [track, ...existing.filter((t) => t.id !== track.id)].slice(0, 5)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped))
  } catch {
    // localStorage not available
  }
}

export default function RecentTracks({ onSelect }: Props) {
  const [recent, setRecent] = useState<TrackData[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setRecent(JSON.parse(raw))
    } catch {
      // localStorage not available
    }
  }, [])

  if (recent.length === 0) return null

  return (
    <div>
      <span
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#52525b',
          display: 'block',
          marginBottom: 8,
        }}
      >
        Recent
      </span>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {recent.map((track) => (
          <div
            key={track.id}
            onClick={() => onSelect(track)}
            title={`${track.title} - ${track.artist}`}
            style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              overflow: 'hidden',
              cursor: 'pointer',
              flexShrink: 0,
              position: 'relative',
            }}
            className="hover:ring-2 ring-green-500/50"
          >
            {track.coverUrl ? (
              <Image
                src={track.coverUrl}
                alt={track.title}
                fill
                style={{ objectFit: 'cover' }}
                unoptimized
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: '#27272a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                🎵
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
