'use server'

export async function getLyrics(
  artist: string,
  title: string
): Promise<{ lines: string[]; error: string | null }> {
  try {
    const artistEncoded = encodeURIComponent(artist.split(',')[0].trim())
    const titleEncoded = encodeURIComponent(title)
    const res = await fetch(
      `https://api.lyrics.ovh/v1/${artistEncoded}/${titleEncoded}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return { lines: [], error: 'Lyrics not found' }
    const data = await res.json()
    if (!data.lyrics) return { lines: [], error: 'No lyrics available' }
    const lines = data.lyrics
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0)
    return { lines, error: null }
  } catch {
    return { lines: [], error: 'Failed to fetch lyrics' }
  }
}
