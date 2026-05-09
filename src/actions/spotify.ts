'use server'
import { parseSpotifyTrackId, fetchTrack } from '@/lib/spotify'
import { TrackData } from '@/types'

export async function getTrackFromUrl(
  spotifyUrl: string
): Promise<{ data: TrackData | null; error: string | null }> {
  try {
    const trackId = parseSpotifyTrackId(spotifyUrl)
    if (!trackId) return { data: null, error: 'Invalid Spotify link. Paste a track URL.' }
    const data = await fetchTrack(trackId)
    return { data, error: null }
  } catch (err) {
    console.error(err)
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'SPOTIFY_CREDENTIALS_MISSING') {
      return { data: null, error: 'Spotify credentials not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env.local' }
    }
    if (msg === 'Track not found') {
      return { data: null, error: 'Track not found. Check the Spotify link.' }
    }
    return { data: null, error: 'Could not fetch track. Try again.' }
  }
}
