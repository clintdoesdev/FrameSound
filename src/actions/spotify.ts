'use server'
import {
  parseSpotifyTrackId, fetchTrack,
  parseSpotifyCollection, fetchCollectionTracks, searchTracks,
} from '@/lib/spotify'
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


export async function searchTracksAction(
  query: string
): Promise<{ data: TrackData[]; error: string | null }> {
  const q = query.trim()
  if (q.length < 2) return { data: [], error: null }
  try {
    return { data: await searchTracks(q), error: null }
  } catch (err) {
    console.error(err)
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'SPOTIFY_CREDENTIALS_MISSING') {
      return { data: [], error: 'Spotify credentials not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env.local' }
    }
    return { data: [], error: 'Search unavailable. Try again.' }
  }
}

export async function getTracksFromCollectionUrl(
  url: string
): Promise<{ data: TrackData[]; error: string | null }> {
  try {
    const parsed = parseSpotifyCollection(url)
    if (!parsed) return { data: [], error: 'Paste a Spotify playlist or album link.' }
    const data = await fetchCollectionTracks(parsed.kind, parsed.id)
    if (data.length === 0) return { data: [], error: 'That collection has no playable tracks.' }
    return { data, error: null }
  } catch (err) {
    console.error(err)
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'SPOTIFY_CREDENTIALS_MISSING') {
      return { data: [], error: 'Spotify credentials not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env.local' }
    }
    return { data: [], error: 'Could not load that playlist or album.' }
  }
}
