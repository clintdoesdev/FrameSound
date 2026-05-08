import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
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
  return (
    <html lang="en" data-theme="dark" data-accent="emerald" className={poppins.variable}>
      <body>{children}</body>
    </html>
  )
}
