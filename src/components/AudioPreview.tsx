'use client'

import { useState, useRef, useEffect } from 'react'
import { Glass } from '@/lib/liquid-glass/LiquidGlass'

type Props = {
  previewUrl: string
  trackId: string
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>
)
const PauseIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>
  </svg>
)

export default function AudioPreview({ previewUrl, trackId }: Props) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dur, setDur] = useState(30)
  const [error, setError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Auto-pause when track changes
  useEffect(() => {
    audioRef.current?.pause()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlaying(false)
    setProgress(0)
  }, [trackId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(false)
    const audio = new Audio(previewUrl)
    audioRef.current = audio

    const onTime = () => { if (audio.duration) setProgress(audio.currentTime / audio.duration) }
    const onEnded = () => { setPlaying(false); setProgress(0) }
    const onMeta = () => setDur(Math.round(audio.duration || 30))
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
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play().then(() => setPlaying(true)).catch(() => setError(true)) }
  }

  if (error) return null

  const elapsed = Math.round(progress * dur)

  return (
    <Glass className="audio" style={{ borderRadius: 999, padding: '6px 18px 6px 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <button onClick={toggle} type="button" aria-label={playing ? 'Pause preview' : 'Play preview'}
        style={{
          width: 40, height: 40, borderRadius: 999, flex: 'none',
          background: 'var(--tint)', color: '#fff', display: 'grid', placeItems: 'center',
        }}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ height: 4, background: 'var(--fill-2)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress * 100}%`, background: 'var(--text)', transition: 'width 1s linear' }} />
        </div>
        <div className="tnum" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--text-3)' }}>
          <span>0:{String(elapsed).padStart(2, '0')}</span>
          <span>{playing ? 'Preview' : '30s preview'}</span>
          <span>0:{String(dur).padStart(2, '0')}</span>
        </div>
      </div>
      {playing && <div className="eq" aria-hidden><i/><i/><i/><i/></div>}
    </Glass>
  )
}
