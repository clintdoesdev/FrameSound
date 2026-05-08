'use client'

import { useState, useEffect } from 'react'

type Props = {
  lines: string[]
  loading: boolean
  onQuoteChange: (quote: string) => void
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12 5 5 9-11"/>
  </svg>
)

export default function LyricsPanel({ lines, loading, onQuoteChange }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [custom, setCustom] = useState('')

  // Reset when lines change (new track)
  useEffect(() => {
    setSelected([])
    setCustom('')
  }, [lines])

  // Propagate quote to parent
  useEffect(() => {
    if (custom.trim()) {
      onQuoteChange(custom.trim())
    } else {
      onQuoteChange(selected.join('\n'))
    }
  }, [selected, custom, onQuoteChange])

  const toggleLine = (line: string) => {
    setSelected(prev =>
      prev.includes(line)
        ? prev.filter(l => l !== line)
        : prev.length < 2 ? [...prev, line] : [prev[1], line]
    )
  }

  const clearSelection = () => { setSelected([]); setCustom('') }

  if (loading) {
    return (
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse-slow" style={{
            height: 13, background: 'var(--bg-2)', borderRadius: 4,
            width: i % 3 === 0 ? '60%' : i % 3 === 1 ? '85%' : '72%',
          }} />
        ))}
      </div>
    )
  }

  const showLines = lines.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '12px 20px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em' }}>
          {showLines ? 'LYRICS' : 'CUSTOM QUOTE'}
        </div>
        {(selected.length > 0 || custom) && (
          <button onClick={clearSelection} style={{
            background: 'none', border: 0, cursor: 'pointer',
            fontSize: 11, color: 'var(--fg-3)', padding: 0,
            textDecoration: 'underline', fontFamily: 'inherit',
          }}>
            Clear
          </button>
        )}
      </div>

      {/* Lyric lines */}
      {showLines && (
        <div className="scroll" style={{
          maxHeight: 200, overflowY: 'auto',
          padding: '0 20px 8px',
        }}>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', marginBottom: 6, letterSpacing: '0.04em' }}>
            {selected.length}/2 selected
          </div>
          {lines.map((line, i) => {
            const isSel = selected.includes(line)
            const disabled = !isSel && selected.length >= 2
            return (
              <button
                key={i}
                disabled={disabled}
                onClick={() => toggleLine(line)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', textAlign: 'left',
                  padding: '6px 8px',
                  background: isSel ? 'var(--accent-quiet)' : 'transparent',
                  border: `1px solid ${isSel ? 'var(--accent-soft)' : 'transparent'}`,
                  borderRadius: 'var(--r-2)',
                  color: disabled ? 'var(--fg-4)' : isSel ? 'var(--fg)' : 'var(--fg-1)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontSize: 12.5, lineHeight: 1.45, marginBottom: 2,
                  transition: 'background 120ms, color 120ms',
                }}
              >
                <span style={{
                  width: 14, height: 14, flexShrink: 0, borderRadius: 3,
                  border: `1px solid ${isSel ? 'var(--accent)' : 'var(--line-1)'}`,
                  background: isSel ? 'var(--accent)' : 'transparent',
                  display: 'grid', placeItems: 'center',
                  color: 'var(--accent-fg)',
                }}>
                  {isSel && <CheckIcon />}
                </span>
                <span>{line}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Custom quote */}
      <div style={{ padding: showLines ? '8px 20px 16px' : '0 20px 16px' }}>
        {showLines && (
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', letterSpacing: '0.04em', marginBottom: 6 }}>
            OR CUSTOM QUOTE
          </div>
        )}
        <textarea
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder={showLines ? 'Override with your own…' : 'Type your lyric quote…'}
          rows={2}
          style={{
            width: '100%', resize: 'none',
            background: 'var(--bg-inset)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-3)',
            padding: '8px 10px',
            fontSize: 13, color: 'var(--fg)', fontFamily: 'inherit',
            outline: 'none', lineHeight: 1.5,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)' }}
        />
      </div>
    </div>
  )
}
