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
  preset: 'glass' | 'ticket' | 'tag' | 'profile' | 'player'
  bgStyle: 'blurred-art' | 'solid' | 'gradient' | 'transparent'
  bgColor: string
  tintHue: number
  textColor: 'white' | 'black' | 'auto'
  font: 'poppins' | 'dm-serif' | 'playfair' | 'bebas' | 'instrument' | 'space-grotesk' | 'raleway' | 'cormorant' | 'oswald'
  showAlbumArt: boolean
  showTitle: boolean
  showArtist: boolean
  showYear: boolean
  showDuration: boolean
  showLyrics: boolean
  lyricQuote: string
  textAlign: 'left' | 'center' | 'right'
  artPadding: number       // 0–100 px, glass preset only
  // Experimental
  glowEnabled: boolean
  glowStrength: number    // 0–100
  grainEnabled: boolean
  grainOpacity: number    // 0–100
  vignetteEnabled: boolean
  vignetteStrength: number // 0–100
  scanlinesEnabled: boolean
  scanlinesOpacity: number // 0–100
  holoEnabled: boolean
  holoOpacity: number      // 0–100
}

export const defaultConfig: CardConfig = {
  preset: 'glass',
  bgStyle: 'blurred-art',
  bgColor: '#111111',
  tintHue: 0,
  textColor: 'auto',
  font: 'poppins',
  showAlbumArt: true,
  showTitle: true,
  showArtist: true,
  showYear: true,
  showDuration: true,
  showLyrics: true,
  lyricQuote: '',
  textAlign: 'left',
  artPadding: 12,
  glowEnabled: false,
  glowStrength: 50,
  grainEnabled: false,
  grainOpacity: 30,
  vignetteEnabled: false,
  vignetteStrength: 50,
  scanlinesEnabled: false,
  scanlinesOpacity: 20,
  holoEnabled: false,
  holoOpacity: 30,
}
