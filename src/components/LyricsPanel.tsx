'use client'

import { useState, useEffect } from 'react'

type Props = {
  lines: string[]
  loading: boolean
  onQuoteChange: (quote: string) => void
}

const MusicIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
)

export default function LyricsPanel({ lines, loading, onQuoteChange }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [custom, setCustom] = useState('')

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSelected([]); setCustom('') }, [lines])

  useEffect(() => {
    onQuoteChange(custom.trim() || selected.join('\n'))
  }, [selected, custom, onQuoteChange])

  const toggleLine = (line: string) => {
    setSelected(prev =>
      prev.includes(line)
        ? prev.filter(l => l !== line)
        : prev.length < 2 ? [...prev, line] : [prev[1], line]
    )
  }

  const clearAll = () => { setSelected([]); setCustom('') }
  const activeQuote = custom.trim() || selected.join('\n')
  const hasSelection = selected.length > 0 || !!custom.trim()

  if (loading) {
    return (
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse-slow" style={{
            height: 14, background: 'var(--bg-2)', borderRadius: 4,
            width: i % 3 === 0 ? '55%' : i % 3 === 1 ? '82%' : '68%',
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
        padding: '11px 20px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--line-soft)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-1)', letterSpacing: '0.06em' }}>LYRICS</span>
          {showLines && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--fg-2)', display: 'inline-block' }} />
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-2)' }}>{selected.length}/2</span>
            </>
          )}
        </div>
        {hasSelection && (
          <button onClick={clearAll} style={{
            background: 'none', border: 0, cursor: 'pointer',
            fontSize: 12, color: 'var(--accent)', padding: '2px 0',
            fontFamily: 'inherit', fontWeight: 500,
          }}>Clear</button>
        )}
      </div>

      {/* Quote preview */}
      {hasSelection && (
        <div style={{
          margin: '10px 16px 2px',
          padding: '10px 14px',
          background: 'var(--bg-1)',
          border: '1px solid var(--line)',
          borderLeft: '3px solid var(--accent)',
          borderRadius: '0 8px 8px 0',
          animation: 'fadeIn 0.2s ease both',
        }}>
          <div style={{ fontSize: 20, color: 'var(--accent)', lineHeight: 1, marginBottom: 3, fontFamily: 'Georgia, serif' }}>&ldquo;</div>
          <div style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.55, fontStyle: 'italic', whiteSpace: 'pre-line' }}>
            {activeQuote}
          </div>
        </div>
      )}

      {/* Lyric lines list */}
      {showLines && (
        <div className="scroll" style={{ maxHeight: 210, overflowY: 'auto' }}>
          {lines.map((line, i) => {
            const isSel = selected.includes(line)
            const isMaxed = !isSel && selected.length >= 2
            if (!line.trim()) return null
            return (
              <button
                key={i}
                disabled={isMaxed}
                onClick={() => toggleLine(line)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 20px',
                  background: isSel ? 'var(--accent-quiet)' : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${isSel ? 'var(--accent)' : 'transparent'}`,
                  color: isSel ? 'var(--fg)' : isMaxed ? 'var(--fg-3)' : 'var(--fg-1)',
                  cursor: isMaxed ? 'not-allowed' : 'pointer',
                  fontSize: 13.5, lineHeight: 1.5,
                  transition: 'background 100ms, color 100ms',
                  fontWeight: isSel ? 500 : 400,
                }}
                onMouseEnter={e => { if (!isSel && !isMaxed) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-1)' }}
                onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
              >
                {line}
              </button>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!showLines && (
        <div style={{ padding: '20px 20px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--fg-3)' }}>
          <MusicIcon />
          <span style={{ fontSize: 12.5 }}>No lyrics found for this track</span>
        </div>
      )}

      {/* Custom quote */}
      <div style={{ padding: '10px 16px 14px', borderTop: showLines ? '1px solid var(--line-soft)' : 'none' }}>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-2)', letterSpacing: '0.05em', marginBottom: 7 }}>
          {showLines ? 'OR CUSTOM' : 'TYPE QUOTE'}
        </div>
        <textarea
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder={showLines ? 'Override with your own text…' : 'Type your lyric quote…'}
          rows={2}
          style={{
            width: '100%', resize: 'none',
            background: 'var(--bg-inset)',
            border: '1px solid var(--line)',
            borderRadius: 8, padding: '9px 11px',
            fontSize: 13, color: 'var(--fg)', fontFamily: 'inherit',
            outline: 'none', lineHeight: 1.5,
            transition: 'border-color 150ms',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)' }}
        />
      </div>
    </div>
  )
}
