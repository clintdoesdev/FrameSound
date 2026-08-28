const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const API_BASE = 'https://api.spotify.com/v1'

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || clientId === 'your_spotify_client_id_here' ||
      !clientSecret || clientSecret === 'your_spotify_client_secret_here') {
    throw new Error('SPOTIFY_CREDENTIALS_MISSING')
  }
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('Failed to fetch Spotify token')
  const data = await res.json()
  return data.access_token
}

/** Playlist or album link → { kind, id }. Used by batch mode. */
export function parseSpotifyCollection(url: string): { kind: 'playlist' | 'album'; id: string } | null {
  const patterns: [RegExp, 'playlist' | 'album'][] = [
    [/open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/, 'playlist'],
    [/spotify:playlist:([a-zA-Z0-9]+)/, 'playlist'],
    [/open\.spotify\.com\/album\/([a-zA-Z0-9]+)/, 'album'],
    [/spotify:album:([a-zA-Z0-9]+)/, 'album'],
  ]
  for (const [re, kind] of patterns) {
    const m = url.match(re)
    if (m) return { kind, id: m[1] }
  }
  return null
}

export function parseSpotifyTrackId(url: string): string | null {
  const patterns = [
    /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/,
    /spotify:track:([a-zA-Z0-9]+)/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function fmtMs(ms: number): string {
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

type SpotifyTrack = {
  id: string
  name: string
  artists: { name: string }[]
  album: { name: string; images: { url: string }[]; release_date?: string }
  duration_ms: number
  preview_url: string | null
}

function toTrackData(t: SpotifyTrack) {
  return {
    id: t.id,
    title: t.name,
    artist: t.artists.map(a => a.name).join(', '),
    album: t.album?.name ?? '',
    coverUrl: t.album?.images?.[0]?.url ?? null,
    releaseYear: t.album?.release_date?.split('-')[0] ?? '',
    duration: fmtMs(t.duration_ms),
    previewUrl: t.preview_url ?? null,
  }
}

export async function searchTracks(query: string, limit = 8) {
  const token = await getAccessToken()
  const res = await fetch(
    `${API_BASE}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 300 } },
  )
  if (!res.ok) throw new Error('Search failed')
  const data = await res.json()
  return (data.tracks?.items ?? []).map(toTrackData)
}

/** Up to `max` tracks from a playlist or album, paging as needed. */
export async function fetchCollectionTracks(
  kind: 'playlist' | 'album',
  id: string,
  max = 50,
) {
  const token = await getAccessToken()
  const auth = { Authorization: `Bearer ${token}` }
  const out: ReturnType<typeof toTrackData>[] = []

  if (kind === 'album') {
    // Album track objects omit the album, so carry it over from the parent.
    const meta = await fetch(`${API_BASE}/albums/${id}`, { headers: auth, next: { revalidate: 3600 } })
    if (!meta.ok) throw new Error('Album not found')
    const album = await meta.json()
    for (const t of album.items?.items ?? album.tracks?.items ?? []) {
      if (out.length >= max) break
      out.push(toTrackData({ ...t, album }))
    }
    return out
  }

  let url: string | null = `${API_BASE}/playlists/${id}/tracks?limit=50`
  while (url && out.length < max) {
    const res: Response = await fetch(url, { headers: auth, next: { revalidate: 600 } })
    if (!res.ok) throw new Error('Playlist not found')
    const page = await res.json()
    for (const item of page.items ?? []) {
      if (out.length >= max) break
      if (item?.track?.id) out.push(toTrackData(item.track))
    }
    url = page.next ?? null
  }
  return out
}

export async function fetchTrack(trackId: string) {
  const token = await getAccessToken()
  const res = await fetch(`${API_BASE}/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error('Track not found')
  const track = await res.json()
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map((a: { name: string }) => a.name).join(', '),
    album: track.album.name,
    coverUrl: track.album.images[0]?.url ?? null,
    releaseYear: track.album.release_date?.split('-')[0] ?? '',
    duration: fmtMs(track.duration_ms),
    previewUrl: track.preview_url ?? null,
  }
}
