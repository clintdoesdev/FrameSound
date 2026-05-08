export type TrackData = {
  id: string
  title: string
  artist: string
  album: string
  coverUrl: string | null
  releaseYear: string
  duration: number
  previewUrl: string | null
  trackNumber: number
}

export type CardConfig = {
  preset: 'glass' | 'poster' | 'minimal' | 'story' | 'square'
  bgStyle: 'blurred-art' | 'solid' | 'gradient' | 'transparent'
  bgColor: string
  tintHue: number
  textColor: 'white' | 'black' | 'auto'
  font: 'syne' | 'dm-serif' | 'playfair' | 'bebas' | 'instrument'
  showAlbumArt: boolean
  showArtist: boolean
  showTitle: boolean
  showLyrics: boolean
  showYear: boolean
  showDuration: boolean
  padding: number
  borderRadius: number
  size: '1:1' | '16:9' | '4:5' | '9:16'
}

export const defaultConfig: CardConfig = {
  preset: 'glass',
  bgStyle: 'blurred-art',
  bgColor: '#1a1a2e',
  tintHue: 0,
  textColor: 'auto',
  font: 'syne',
  showAlbumArt: true,
  showArtist: true,
  showTitle: true,
  showLyrics: true,
  showYear: true,
  showDuration: false,
  padding: 32,
  borderRadius: 24,
  size: '1:1',
}
