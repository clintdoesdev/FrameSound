import type { Metadata } from 'next'
import {
  Poppins,
  DM_Sans,
  DM_Serif_Display,
  Playfair_Display,
  Bebas_Neue,
  Instrument_Serif,
  Space_Grotesk,
  Raleway,
  Cormorant_Garamond,
  Oswald,
} from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'], variable: '--font-poppins',
  weight: ['300', '400', '500', '600', '700', '800'], display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'], variable: '--font-dm-sans',
  weight: ['400', '500', '600'], display: 'swap',
})
const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'], variable: '--font-dm-serif',
  weight: ['400'], display: 'swap', style: ['normal', 'italic'],
})
const playfair = Playfair_Display({
  subsets: ['latin'], variable: '--font-playfair',
  weight: ['400', '700'], display: 'swap', style: ['normal', 'italic'],
})
const bebasNeue = Bebas_Neue({
  subsets: ['latin'], variable: '--font-bebas',
  weight: ['400'], display: 'swap',
})
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'], variable: '--font-instrument',
  weight: ['400'], display: 'swap', style: ['normal', 'italic'],
})
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'], variable: '--font-space-grotesk',
  weight: ['400', '500', '600', '700'], display: 'swap',
})
const raleway = Raleway({
  subsets: ['latin'], variable: '--font-raleway',
  weight: ['300', '400', '500', '600', '700'], display: 'swap',
})
const cormorant = Cormorant_Garamond({
  subsets: ['latin'], variable: '--font-cormorant',
  weight: ['400', '600', '700'], display: 'swap', style: ['normal', 'italic'],
})
const oswald = Oswald({
  subsets: ['latin'], variable: '--font-oswald',
  weight: ['400', '500', '600', '700'], display: 'swap',
})

export const metadata: Metadata = {
  title: 'FrameSound — Spotify Card Generator',
  description: 'Turn any Spotify track into a beautiful shareable card. Five presets, lyrics quotes, HD export.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'FrameSound',
    description: 'Turn Spotify tracks into beautiful cards',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    poppins.variable,
    dmSans.variable,
    dmSerifDisplay.variable,
    playfair.variable,
    bebasNeue.variable,
    instrumentSerif.variable,
    spaceGrotesk.variable,
    raleway.variable,
    cormorant.variable,
    oswald.variable,
  ].join(' ')

  return (
    <html lang="en" data-accent="emerald" className={fontVars}>
      <body>{children}</body>
    </html>
  )
}
