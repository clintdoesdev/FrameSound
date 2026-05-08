import type { Metadata } from 'next'
import {
  Syne,
  DM_Sans,
  DM_Serif_Display,
  Playfair_Display,
  Bebas_Neue,
  Instrument_Serif,
} from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'], variable: '--font-syne',
  weight: ['400', '500', '600', '700', '800'], display: 'swap',
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

export const metadata: Metadata = {
  title: 'FrameSound — Spotify Card Generator',
  description: 'Turn any Spotify track into a beautiful shareable card. Five presets, lyrics quotes, HD export.',
  openGraph: {
    title: 'FrameSound',
    description: 'Turn Spotify tracks into beautiful cards',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontVars = [
    syne.variable,
    dmSans.variable,
    dmSerifDisplay.variable,
    playfair.variable,
    bebasNeue.variable,
    instrumentSerif.variable,
  ].join(' ')

  return (
    <html lang="en" data-theme="dark" data-accent="emerald" className={fontVars}>
      <body>{children}</body>
    </html>
  )
}
