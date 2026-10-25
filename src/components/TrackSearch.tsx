'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { TrackData } from '@/types'
import { searchTracksAction } from '@/actions/spotify'

type Props = {
  onSelect: (track: TrackData) => void
  /**
   * Rendered above the results — lets the page keep owning the paste field.
   * A function receives the search state, so the field can show its own spinner.
   */
  children?: React.ReactNode | ((state: { searching: boolean }) => React.ReactNode)
  /** Live text from the field the page renders as `children`. */
  query: string
}

const DEBOUNCE_MS = 300

export default function TrackSearch({ onSelect, query, children }: Props) {
  const [results, setResults] = useState<TrackData[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  // Guards against a slow earlier request landing after a newer one.
  const seq = useRef(0)
  const boxRef = useRef<HTMLDivElement>(null)

  const looksLikeUrl = /spotify\.com\/|spotify:/.test(query)

  // Debounced query against a remote service: an effect is the right home for
  // this, and clearing stale results is part of that synchronisation.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const q = query.trim()
    if (looksLikeUrl || q.length < 2) {
      // Drop any request still in flight, or its spinner would never clear.
      seq.current++
      setResults([]); setOpen(false); setError(null); setSearching(false)
      return
    }
    const mine = ++seq.current
    const t = setTimeout(() => {
      setSearching(true)
      searchTracksAction(q).then(r => {
        if (mine !== seq.current) return
        setResults(r.data)
        setError(r.error)
        setOpen(true)
        setActive(0)
        setSearching(false)
      })
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query, looksLikeUrl])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Dismiss on outside click
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const choose = useCallback((t: TrackData) => {
    setOpen(false)
    setResults([])
    onSelect(t)
  }, [onSelect])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    // Escape should dismiss even an error-only dropdown, which has no results.
    if (e.key === 'Escape') { setOpen(false); return }
    if (results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % results.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i - 1 + results.length) % results.length) }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[active]) }
  }

  const showDropdown = open && (results.length > 0 || error)

  return (
    <div ref={boxRef} style={{ position: 'relative', width: '100%' }} onKeyDown={onKeyDown}>
      {/* Raised above the scrim below so the field stays fully visible and
          interactive while the dropdown is open. */}
      <div style={{ position: 'relative', zIndex: 35 }}>
        {typeof children === 'function' ? children({ searching }) : children}
      </div>

      {/* No page scrim: the app sits in its own stacking layer, so a body-level
          overlay would cover these results and swallow clicks on them. The list
          is opaque instead, and outside clicks are handled above. */}
      {showDropdown && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 40,
            borderRadius: 16, overflow: 'hidden', padding: 6,
            maxHeight: 360, overflowY: 'auto',
            animation: 'popIn 0.25s cubic-bezier(.2,.9,.25,1.05) both',
          }}
          className="scroll material dropdown"
        >
          {error && (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'var(--danger)' }}>{error}</div>
          )}
          {results.map((t, i) => (
            <button
              key={t.id}
              type="button"
              role="option"
              aria-selected={i === active}
              onClick={() => choose(t)}
              onMouseEnter={() => setActive(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '8px 10px', border: 0, cursor: 'pointer', textAlign: 'left',
                borderRadius: 11, minHeight: 52,
                background: i === active ? 'var(--surface-2)' : 'transparent',
              }}
            >
              <span style={{
                position: 'relative', width: 40, height: 40, borderRadius: 9,
                overflow: 'hidden', flexShrink: 0, background: 'var(--surface-3)',
              }}>
                {t.coverUrl && (
                  <Image src={t.coverUrl} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                )}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--text)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{t.title}</span>
                <span style={{
                  display: 'block', fontSize: 13, color: 'var(--text-3)', marginTop: 1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{t.artist} · {t.releaseYear}</span>
              </span>
              <span className="tnum" style={{ fontSize: 13, color: 'var(--text-3)', flexShrink: 0 }}>{t.duration}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
