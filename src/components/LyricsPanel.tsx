'use client'

import { useState } from 'react'

type Props = {
  lines: string[]
  loading: boolean
  selectedLines: string[]
  onSelect: (line: string) => void
  customQuote: string
  onCustomQuote: (q: string) => void
}

export default function LyricsPanel({
  lines,
  loading,
  selectedLines,
  onSelect,
  customQuote,
  onCustomQuote,
}: Props) {
  const [_internal] = useState(null)
  void _internal

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse-slow"
            style={{
              height: 16,
              background: '#27272a',
              borderRadius: 4,
              width: i % 3 === 0 ? '60%' : i % 3 === 1 ? '85%' : '75%',
            }}
          />
        ))}
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div>
        <p style={{ color: '#71717a', fontSize: 14, marginBottom: 12 }}>No lyrics found</p>
        <textarea
          placeholder="Type a custom quote..."
          value={customQuote}
          onChange={(e) => onCustomQuote(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-sm text-zinc-200 resize-none h-24 focus:outline-none focus:border-zinc-500"
        />
      </div>
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: '#f5f5f5' }}>Lyrics</span>
        <span style={{ fontSize: 11, color: '#71717a' }}>Select up to 2 lines</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {lines.map((line, i) => {
          const isSelected = selectedLines.includes(line)
          return (
            <button
              key={i}
              onClick={() => onSelect(line)}
              style={{
                width: '100%',
                textAlign: 'left',
                fontSize: 13,
                padding: '8px 12px',
                borderRadius: 8,
                border: isSelected ? '1px solid rgba(34,197,94,0.3)' : '1px solid transparent',
                background: isSelected ? 'rgba(34,197,94,0.2)' : 'transparent',
                color: isSelected ? '#86efac' : '#a1a1aa',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#e4e4e7'
                  ;(e.currentTarget as HTMLButtonElement).style.background =
                    'rgba(39,39,42,0.5)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  ;(e.currentTarget as HTMLButtonElement).style.color = '#a1a1aa'
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }
              }}
            >
              {line}
            </button>
          )
        })}
      </div>
    </div>
  )
}
