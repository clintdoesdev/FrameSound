'use client'

import { useState, useEffect } from 'react'

type Props = {
  lines: string[]
  loading: boolean
  onQuoteChange: (quote: string) => void
}

const MusicNoteIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
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

  const showLines = lines.length > 0
  const previewText = custom.trim() || (selected.length > 0 ? selected.join('\n') : '')

  if (loading) {
    return (
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse-slow" style={{
            height: 14, background: 'var(--bg-2)', borderRadius: 4,
            width: i % 3 === 0 ? '60%' : i % 3 === 1 ? '85%' : '72%',
          }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        padding: '12px 20px 10px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        borderBottom: showLines ? '1px solid var(--line-soft)' : undefined,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.06em' }}>LYRICS</span>
          {showLines && (
            <>
              <span style={{ color: 'var(--fg-4)', fontSize: 10 }}>·</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', letterSpacing: '0.04em' }}>{lines.length} lines</span>
            </>
          )}
        </div>
        {(selected.length > 0 || custom) && (
          <button onClick={clearSelection} style={{
            background: 'none', border: 0, cursor: 'pointer',
            fontSize: 12, color: 'var(--accent)', padding: 0,
            fontFamily: 'inherit', fontWeight: 500,
          }}>
            Clear
          </button>
        )}
      </div>

      {/* Quote preview */}
      {previewText && (
        <div style={{
          margin: '10px 20px 0',
          background: 'var(--bg-1)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          padding: '10px 14px 12px',
          flexShrink: 0,
        }}>
          <span style={{
            fontSize: 24, lineHeight: 1, color: 'var(--accent)',
            display: 'block', marginBottom: 2, fontFamily: 'Georgia, serif',
          }}>&ldquo;</span>
          <div style={{
            fontSize: 13, color: 'var(--fg-1)', fontStyle: 'italic', lineHeight: 1.55,
            whiteSpace: 'pre-line',
          }}>
            {previewText}
          </div>
        </div>
      )}

      {/* Lyric lines */}
      {showLines ? (
        <div className="scroll" style={{
          maxHeight: 220, overflowY: 'auto',
          marginTop: 8,
          flexShrink: 0,
        }}>
          {lines.map((line, i) => {
            const isSel = selected.includes(line)
            const disabled = !isSel && selected.length >= 2
            return (
              <button
                key={i}
                disabled={disabled}
                onClick={() => toggleLine(line)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 20px',
                  minHeight: 40,
                  background: isSel ? 'var(--accent-quiet)' : 'transparent',
                  border: 'none',
                  borderLeft: isSel ? '3px solid var(--accent)' : '3px solid transparent',
                  color: disabled ? 'var(--fg-4)' : isSel ? 'var(--accent)' : 'var(--fg-1)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontSize: 13.5, lineHeight: 1.5,
                  transition: 'background 120ms, color 120ms, border-color 120ms',
                }}
                onMouseEnter={e => {
                  if (!isSel && !disabled) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-1)'
                }}
                onMouseLeave={e => {
                  if (!isSel) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                {line}
              </button>
            )
          })}
        </div>
      ) : (
        /* Empty state */
        <div style={{
          padding: '24px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          textAlign: 'center',
          flexShrink: 0,
        }}>
          <MusicNoteIcon />
          <div style={{ fontSize: 12.5, color: 'var(--fg-3)', lineHeight: 1.5 }}>No lyrics found</div>
        </div>
      )}

      {/* Divider */}
      <hr style={{
        margin: '10px 20px 0',
        border: 'none',
        borderTop: '1px solid var(--line-soft)',
        flexShrink: 0,
      }} />

      {/* Custom quote textarea */}
      <div style={{ padding: '10px 20px 16px', flexShrink: 0 }}>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', letterSpacing: '0.06em', marginBottom: 7 }}>
          CUSTOM QUOTE
        </div>
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
            fontSize: 12.5, color: 'var(--fg)', fontFamily: 'inherit',
            outline: 'none', lineHeight: 1.5,
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--line)' }}
        />
      </div>
    </div>
  )
}
