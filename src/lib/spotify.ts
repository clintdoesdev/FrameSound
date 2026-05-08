const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'
const API_BASE = 'https://api.spotify.com/v1'

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID!
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!
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
    duration: track.duration_ms,
    previewUrl: track.preview_url ?? null,
    trackNumber: track.track_number,
  }
}
