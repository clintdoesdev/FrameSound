'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { TrackData } from '@/types'
import { searchTracksAction } from '@/actions/spotify'

type Props = {
  onSelect: (track: TrackData) => void
  /** Rendered above the results — lets the page keep owning the paste field. */
  children?: React.ReactNode
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
      setResults([]); setOpen(false); setError(null)
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
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => (i + 1) % results.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => (i - 1 + results.length) % results.length) }
    else if (e.key === 'Enter') { e.preventDefault(); choose(results[active]) }
    else if (e.key === 'Escape') { setOpen(false) }
  }

  return (
    <div ref={boxRef} style={{ position: 'relative', width: '100%' }} onKeyDown={onKeyDown}>
      {children}

      {searching && (
        <div style={{ position: 'absolute', right: 14, top: 18, zIndex: 3 }}>
          <span className="spin" style={{
            display: 'block', width: 15, height: 15,
            border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%',
          }} />
        </div>
      )}

      {open && (results.length > 0 || error) && (
        <div
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 40,
            background: 'var(--panel)', border: '1px solid var(--panel-line)',
            borderRadius: 14, overflow: 'hidden',
            boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
            maxHeight: 340, overflowY: 'auto',
          }}
          className="scroll"
        >
          {error && (
            <div style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--danger)' }}>{error}</div>
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
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '9px 12px', border: 0, cursor: 'pointer', textAlign: 'left',
                background: i === active ? 'var(--panel-well)' : 'transparent',
              }}
            >
              <span style={{
                position: 'relative', width: 36, height: 36, borderRadius: 7,
                overflow: 'hidden', flexShrink: 0, background: 'var(--panel-well-2)',
              }}>
                {t.coverUrl && (
                  <Image src={t.coverUrl} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
                )}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--fg)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{t.title}</span>
                <span style={{
                  display: 'block', fontSize: 11.5, color: 'var(--fg-3)', marginTop: 1,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{t.artist} · {t.releaseYear}</span>
              </span>
              <span className="tnum" style={{ fontSize: 11, color: 'var(--fg-3)', flexShrink: 0 }}>{t.duration}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
