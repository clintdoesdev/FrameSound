'use client'

type Props = {
  lines: string[]
  loading: boolean
  selectedLines: string[]
  onSelect: (line: string) => void
  customQuote: string
  onCustomQuote: (q: string) => void
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12 5 5 9-11"/>
  </svg>
)

export default function LyricsPanel({
  lines, loading, selectedLines, onSelect, customQuote, onCustomQuote,
}: Props) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '0 var(--pad-x)' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse-slow" style={{
            height: 14, background: 'var(--bg-2)', borderRadius: 4,
            width: i % 3 === 0 ? '60%' : i % 3 === 1 ? '85%' : '75%',
          }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div style={{
        padding: '10px var(--pad-x) 6px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em' }}>
          {lines.length > 0 ? 'LYRICS · LYRICS.OVH' : 'NO LYRICS FOUND'}
        </div>
        {lines.length > 0 && (
          <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>
            {selectedLines.length}/2 selected
          </div>
        )}
      </div>

      {/* Lines */}
      {lines.length > 0 && (
        <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '0 var(--pad-x) 6px', minHeight: 0 }}>
          {lines.map((line, i) => {
            const isSel = selectedLines.includes(line)
            const disabled = !isSel && selectedLines.length >= 2
            return (
              <button
                key={i}
                disabled={disabled}
                onClick={() => onSelect(line)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', textAlign: 'left',
                  padding: '7px 8px',
                  background: isSel ? 'var(--accent-quiet)' : 'transparent',
                  border: `1px solid ${isSel ? 'var(--accent-soft)' : 'transparent'}`,
                  borderRadius: 'var(--r-2)',
                  color: disabled ? 'var(--fg-4)' : isSel ? 'var(--fg)' : 'var(--fg-1)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontSize: 13, lineHeight: 1.45, marginBottom: 2,
                  transition: 'background 120ms, color 120ms',
                }}
              >
                <span style={{
                  width: 14, height: 14, flexShrink: 0,
                  borderRadius: 3,
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
      <div style={{ padding: '10px var(--pad-x)', borderTop: lines.length > 0 ? '1px solid var(--line-soft)' : undefined }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '0.04em', marginBottom: 8 }}>
          {lines.length === 0 ? 'ENTER YOUR OWN QUOTE' : 'CUSTOM QUOTE'}
        </div>
        <textarea
          value={customQuote}
          onChange={(e) => onCustomQuote(e.target.value)}
          placeholder="Or type your own…"
          rows={2}
          style={{
            width: '100%', resize: 'none',
            background: 'var(--bg-inset)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-3)',
            padding: '8px 10px',
            fontSize: 13, color: 'var(--fg)', fontFamily: 'inherit',
            outline: 'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--line)' }}
        />
      </div>
    </div>
  )
}
