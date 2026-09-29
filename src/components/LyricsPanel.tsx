'use client'

import { useState, useEffect, useRef } from 'react'

type Props = {
  lines: string[]
  loading: boolean
  /** Current quote from config — lets a restored/shared quote survive mount. */
  value?: string
  onQuoteChange: (quote: string) => void
}

const Check = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)

export default function LyricsPanel({ lines, loading, value, onQuoteChange }: Props) {
  // Seeded from the incoming quote so a card restored from a shared link keeps
  // its lyric. The quote is emitted on interaction only — an effect-driven
  // upward sync would clobber that value on mount.
  // The panel remounts on every tab switch, so picks that match this track's
  // lines are restored as picks rather than dumped into the custom field.
  const [initial] = useState(() => {
    const picked = (value ?? '').split('\n').filter(Boolean)
    const fromLines = picked.length > 0 && picked.length <= 2 && picked.every(l => lines.includes(l))
    return fromLines ? { selected: picked, custom: '' } : { selected: [], custom: value ?? '' }
  })
  const [selected, setSelected] = useState<string[]>(initial.selected)
  const [custom, setCustom] = useState(initial.custom)

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

  const hasSelection = selected.length > 0 || !!custom.trim()
  const showLines = lines.length > 0

  return (
    <section className="group">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 14px' }}>
        <h3 className="group-title" style={{ padding: 0 }}>
          Lyrics{showLines && <span className="tnum"> · {selected.length}/2</span>}
        </h3>
        {hasSelection && (
          <button type="button" className="btn" data-variant="plain" data-size="sm"
            style={{ padding: 0, minHeight: 0 }} onClick={() => emit([], '')}>Clear</button>
        )}
      </div>

      <div className="group-body" style={{ overflow: 'hidden' }}>
        {loading && (
          <div className="cell">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="pulse" style={{
                height: 12, background: 'var(--fill)', borderRadius: 6,
                width: ['55%', '82%', '68%', '74%'][i],
              }} />
            ))}
          </div>
        )}

        {!loading && showLines && (
          <div className="scroll" style={{ maxHeight: 232, overflowY: 'auto' }}>
            {lines.map((line, i) => {
              if (!line.trim()) return null
              const isSel = selected.includes(line)
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={isSel}
                  onClick={() => toggleLine(line)}
                  className="lyric-line"
                  data-selected={isSel || undefined}
                >
                  <span style={{ flex: 1 }}>{line}</span>
                  <span style={{ width: 18, flex: 'none', color: 'var(--tint)', opacity: isSel ? 1 : 0 }}><Check /></span>
                </button>
              )
            })}
          </div>
        )}

        {!loading && !showLines && (
          <div className="cell" style={{ alignItems: 'center', color: 'var(--text-3)', fontSize: 13, padding: '18px 14px' }}>
            No lyrics found for this track
          </div>
        )}

        <div className="cell">
          <textarea
            className="field"
            value={custom}
            onChange={e => emit(selected, e.target.value)}
            placeholder={showLines ? 'Or write your own quote…' : 'Type a quote for the card…'}
            aria-label="Custom quote"
            rows={2}
          />
        </div>
      </div>
      <p className="group-footer">Pick up to two lines. Your own text overrides the picks.</p>
    </section>
  )
}
