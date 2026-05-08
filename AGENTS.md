# FrameSound — AGENTS.md

## Project
Next.js 16.2 Spotify card generator. Paste track URL → get styled visual card → export as image.

## Stack
- Next.js 16.2, App Router, Turbopack
- TypeScript strict
- Tailwind CSS v4
- dom-to-image-more (image export)
- colorthief (color extraction)
- Server Actions for all Spotify + lyrics API calls

## Key Files
- src/types/index.ts — TrackData, CardConfig, defaultConfig
- src/lib/spotify.ts — token fetch + track fetch helpers
- src/actions/spotify.ts — Server Action: getTrackFromUrl
- src/actions/lyrics.ts — Server Action: getLyrics
- src/app/page.tsx — main page, all state lives here
- src/components/CardCanvas.tsx — visual card renderer (5 presets)
- src/components/LyricsPanel.tsx — lyrics selector
- src/components/CustomizePanel.tsx — card config controls
- src/components/ExportBar.tsx — PNG/JPG/transparent download
- src/components/AudioPreview.tsx — 30s Spotify preview player
- src/components/RecentTracks.tsx — localStorage recent history

## Env Vars (.env.local)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

## Notes
- CardCanvas is 'use client' — uses refs and dom-to-image-more
- page.tsx is 'use client' — manages all app state
- Server Actions stay 'use server' — never expose Spotify secrets to client
- Spotify CDN (i.scdn.co) is whitelisted in next.config.ts
- No user auth needed — Client Credentials flow only
