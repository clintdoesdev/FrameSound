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
    return { data: null, error: 'Could not fetch track. Try again.' }
  }
}
