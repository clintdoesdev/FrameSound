export type TrackData = {
  id: string
  title: string
  artist: string
  album: string
  coverUrl: string | null
  releaseYear: string
  duration: string        // formatted "3:42"
  previewUrl: string | null
}

export type CardConfig = {
  preset: 'glass' | 'poster' | 'minimal' | 'story' | 'square'
  bgStyle: 'blurred-art' | 'solid' | 'gradient' | 'transparent'
  bgColor: string
  tintHue: number
  textColor: 'white' | 'black' | 'auto'
  font: 'syne' | 'dm-serif' | 'playfair' | 'bebas' | 'instrument' | 'space-grotesk' | 'raleway' | 'cormorant' | 'oswald'
  showAlbumArt: boolean
  showTitle: boolean
  showArtist: boolean
  showYear: boolean
  showDuration: boolean
  showLyrics: boolean
  padding: number
  borderRadius: number
  size: '1:1' | '16:9' | '4:5' | '9:16'
  lyricQuote: string
  textAlign: 'left' | 'center' | 'right'
}

export const defaultConfig: CardConfig = {
  preset: 'glass',
  bgStyle: 'blurred-art',
  bgColor: '#111111',
  tintHue: 0,
  textColor: 'auto',
  font: 'syne',
  showAlbumArt: true,
  showTitle: true,
  showArtist: true,
  showYear: true,
  showDuration: true,
  showLyrics: true,
  padding: 32,
  borderRadius: 16,
  size: '1:1',
  lyricQuote: '',
  textAlign: 'left',
}
