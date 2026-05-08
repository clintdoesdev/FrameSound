'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  previewUrl: string
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M7 5v14l12-7z"/></svg>
)
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
    <rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>
  </svg>
)

export default function AudioPreview({ previewUrl }: Props) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(30)
  const [error, setError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const audio = new Audio(previewUrl)
    audioRef.current = audio

    const onTime = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration)
    }
    const onEnded = () => { setPlaying(false); setProgress(0) }
    const onMeta = () => setDuration(Math.round(audio.duration || 30))
    const onError = () => setError(true)

    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('error', onError)
      audio.pause()
    }
  }, [previewUrl])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setError(true))
    }
  }

  if (error) return null

  const elapsed = Math.round(progress * duration)

  return (
    <div style={{ padding: '10px var(--pad-x)', borderBottom: '1px solid var(--line-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={toggle}
          className="btn"
          data-variant="primary"
          data-size="sm"
          data-icon-only="true"
          style={{ width: 28, height: 28, borderRadius: 999 }}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ height: 4, background: 'var(--bg-2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress * 100}%`,
              background: 'var(--accent)',
              transition: 'width 1s linear',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: 4,
            fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)',
          }}>
            <span>0:{String(elapsed).padStart(2, '0')}</span>
            <span>0:{String(duration).padStart(2, '0')}</span>
          </div>
        </div>
        {playing && <div className="eq"><i/><i/><i/><i/></div>}
      </div>
    </div>
  )
}
