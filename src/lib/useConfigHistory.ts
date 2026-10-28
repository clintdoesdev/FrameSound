'use client'

import { useCallback, useRef, useState } from 'react'
import { CardConfig } from '@/types'

const LIMIT = 60
// Dragging a slider fires dozens of updates; without coalescing, one drag
// would bury every meaningful earlier state under near-identical entries.
const COALESCE_MS = 450

type Hist = { stack: CardConfig[]; idx: number }

export type ConfigHistory = {
  config: CardConfig
  /** Merge a patch into the current config, recording an undo step. */
  update: (patch: Partial<CardConfig>) => void
  /** Replace the whole config and clear history. */
  reset: (next: CardConfig) => void
  /** Keep the current look, optionally patched, but start a fresh timeline. */
  resetHere: (patch?: Partial<CardConfig>) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

export function useConfigHistory(initial: CardConfig): ConfigHistory {
  const [hist, setHist] = useState<Hist>({ stack: [initial], idx: 0 })
  const lastPush = useRef(0)

  const config = hist.stack[hist.idx]

  const update = useCallback((patch: Partial<CardConfig>) => {
    const now = Date.now()
    const coalesce = now - lastPush.current < COALESCE_MS
    lastPush.current = now

    setHist(h => {
      const cur = h.stack[h.idx]
      const next = { ...cur, ...patch }
      // No-op patches (re-selecting the active preset) shouldn't cost a step.
      if (Object.keys(patch).every(k =>
        cur[k as keyof CardConfig] === next[k as keyof CardConfig])) return h

      if (coalesce) {
        const stack = h.stack.slice(0, h.idx + 1)
        stack[h.idx] = next
        return { stack, idx: h.idx }
      }
      const stack = [...h.stack.slice(0, h.idx + 1), next].slice(-LIMIT)
      return { stack, idx: stack.length - 1 }
    })
  }, [])

  const reset = useCallback((next: CardConfig) => {
    lastPush.current = 0
    setHist({ stack: [next], idx: 0 })
  }, [])

  // Reads the live config inside the updater, so callers don't need a ref.
  const resetHere = useCallback((patch?: Partial<CardConfig>) => {
    lastPush.current = 0
    setHist(h => ({ stack: [{ ...h.stack[h.idx], ...patch }], idx: 0 }))
  }, [])

  const undo = useCallback(() => {
    lastPush.current = 0
    setHist(h => (h.idx > 0 ? { ...h, idx: h.idx - 1 } : h))
  }, [])

  const redo = useCallback(() => {
    lastPush.current = 0
    setHist(h => (h.idx < h.stack.length - 1 ? { ...h, idx: h.idx + 1 } : h))
  }, [])

  return {
    config,
    update,
    reset,
    resetHere,
    undo,
    redo,
    canUndo: hist.idx > 0,
    canRedo: hist.idx < hist.stack.length - 1,
  }
}
