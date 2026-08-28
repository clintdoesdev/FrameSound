'use client'

import { useState, useEffect, useRef } from 'react'

type Props = {
  lines: string[]
  loading: boolean
  /** Current quote from config — lets a restored/shared quote survive mount. */
  value?: string
  onQuoteChange: (quote: string) => void
  accentColor?: string | null
}

const MusicIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
)

export default function LyricsPanel({ lines, loading, value, onQuoteChange, accentColor }: Props) {
  const ac = accentColor ?? 'var(--accent)'
  // Seeded from the incoming quote so a card restored from a shared link keeps
  // its lyric. The quote is emitted on interaction only — an effect-driven
  // upward sync would clobber that value on mount.
  const [selected, setSelected] = useState<string[]>([])
  const [custom, setCustom] = useState(value ?? '')

  // Clear the local selection when a different track's lyrics arrive. The page
  // resets config.lyricQuote itself, so this must not emit.
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    setSelected([])
    setCustom('')
  }, [lines])

  const emit = (sel: string[], cus: string) => {
    setSelected(sel)
    setCustom(cus)
    onQuoteChange(cus.trim() || sel.join('\n'))
  }

  const toggleLine = (line: string) => {
    const next = selected.includes(line)
      ? selected.filter(l => l !== line)
      : selected.length < 2 ? [...selected, line] : [selected[1], line]
    emit(next, custom)
  }

  const clearAll = () => emit([], '')
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
            fontSize: 12, color: ac, padding: '2px 0',
            fontFamily: 'inherit', fontWeight: 500,
          }}>Clear</button>
        )}
      </div>

      {/* Quote preview */}
      {hasSelection && (
        <div className="glass-soft" style={{
          margin: '10px 16px 2px',
          padding: '10px 14px',
          borderLeft: `3px solid ${ac}`,
          borderRadius: '0 8px 8px 0',
          animation: 'fadeIn 0.2s ease both',
        }}>
          <div style={{ fontSize: 20, color: ac, lineHeight: 1, marginBottom: 3, fontFamily: 'Georgia, serif' }}>&ldquo;</div>
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
                  background: isSel ? `${ac}18` : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${isSel ? ac : 'transparent'}`,
                  color: isSel ? 'var(--fg)' : isMaxed ? 'var(--fg-4)' : 'var(--fg-2)',
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
          onChange={e => emit(selected, e.target.value)}
          placeholder={showLines ? 'Override with your own text…' : 'Type your lyric quote…'}
          rows={2}
          style={{
            width: '100%', resize: 'none',
            background: 'var(--glass-faint)',
            border: '1px solid var(--glass-border)',
            borderRadius: 8, padding: '9px 11px',
            fontSize: 13, color: 'var(--fg)', fontFamily: 'inherit',
            outline: 'none', lineHeight: 1.5,
            transition: 'border-color 150ms',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = ac }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--glass-border)' }}
        />
      </div>
    </div>
  )
}
