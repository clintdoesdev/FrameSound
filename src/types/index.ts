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
  preset: 'glass' | 'poster' | 'minimal' | 'story' | 'square' | 'nowplaying'
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
  lyricQuote: string
  textAlign: 'left' | 'center' | 'right'
  // Experimental
  glowEnabled: boolean
  glowStrength: number    // 0–100
  grainEnabled: boolean
  grainOpacity: number    // 0–100
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
  lyricQuote: '',
  textAlign: 'left',
  glowEnabled: false,
  glowStrength: 50,
  grainEnabled: false,
  grainOpacity: 30,
}
