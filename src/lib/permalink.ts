import { CardConfig, defaultConfig } from '@/types'

// Only values that differ from the default are encoded, so a lightly-tweaked
// card yields a short link and future config additions stay backward safe.
const KEYS = Object.keys(defaultConfig) as (keyof CardConfig)[]

// Short aliases keep the query string readable and stable if a key is renamed.
const ALIAS: Partial<Record<keyof CardConfig, string>> = {
  preset: 'p', bgStyle: 'bs', bgColor: 'bc', tintHue: 'th', textColor: 'tc',
  font: 'f', textAlign: 'ta', artPadding: 'ap', artZoom: 'az', artX: 'ax',
  artY: 'ay', lyricQuote: 'lq', lyricLines: 'll', lyricScale: 'ls',
  lyricStyle: 'lst', exportSize: 'es',
  showAlbumArt: 'sa', showTitle: 'st', showArtist: 'sr', showYear: 'sy',
  showDuration: 'sd', showLyrics: 'sl',
  glowEnabled: 'ge', glowStrength: 'gs', grainEnabled: 'ne', grainOpacity: 'no',
  vignetteEnabled: 've', vignetteStrength: 'vs',
  scanlinesEnabled: 'ce', scanlinesOpacity: 'co',
  holoEnabled: 'he', holoOpacity: 'ho',
}
const UNALIAS = Object.fromEntries(
  Object.entries(ALIAS).map(([k, v]) => [v, k])
) as Record<string, keyof CardConfig>

export function encodeConfig(config: CardConfig, trackId?: string): string {
  const q = new URLSearchParams()
  if (trackId) q.set('t', trackId)
  for (const k of KEYS) {
    const v = config[k]
    if (v === defaultConfig[k]) continue
    const key = ALIAS[k] ?? k
    q.set(key, typeof v === 'boolean' ? (v ? '1' : '0') : String(v))
  }
  return q.toString()
}

export function decodeConfig(search: string): { config: Partial<CardConfig>; trackId?: string } {
  const q = new URLSearchParams(search)
  const trackId = q.get('t') ?? undefined
  const config: Partial<CardConfig> = {}

  for (const [rawKey, raw] of q.entries()) {
    if (rawKey === 't') continue
    const key = UNALIAS[rawKey] ?? (KEYS.includes(rawKey as keyof CardConfig) ? rawKey as keyof CardConfig : null)
    if (!key) continue
    const ref = defaultConfig[key]

    // Coerce against the default's type, and drop anything that doesn't fit —
    // a hand-edited URL must never be able to push a bad value into config.
    if (typeof ref === 'boolean') {
      ;(config as Record<string, unknown>)[key] = raw === '1' || raw === 'true'
    } else if (typeof ref === 'number') {
      const n = Number(raw)
      if (Number.isFinite(n)) (config as Record<string, unknown>)[key] = n
    } else {
      ;(config as Record<string, unknown>)[key] = raw
    }
  }
  return { config, trackId }
}

export function buildShareUrl(config: CardConfig, trackId?: string): string {
  const base = typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}`
  return `${base}?${encodeConfig(config, trackId)}`
}
