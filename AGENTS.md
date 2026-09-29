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
- src/components/CardCanvas.tsx — visual card renderer (7 liquid-glass presets)
- src/components/LyricsPanel.tsx — lyrics selector
- src/components/CustomizePanel.tsx — card config controls
- src/components/ExportBar.tsx — PNG/JPG/transparent download
- src/components/AudioPreview.tsx — 30s Spotify preview player
- src/components/RecentTracks.tsx — localStorage recent history
- src/components/glass/Controls.tsx — kit switch / slider / tab bar wrappers
- src/lib/liquid-glass/liquid-glass.js — WebGL2 Liquid Glass engine (vendored kit, don't rewrite)
- src/lib/liquid-glass/LiquidGlass.tsx — provider, <Glass>, instance/clip helpers
- src/lib/wallpaper.ts — paints the backdrop the glass refracts
- docs/GLASS_DESIGN.md — the visual system; follow it for any UI work

## Liquid Glass UI
- The app chrome uses the liquid-glass kit: one fixed WebGL canvas behind the page
  refracts a *source* canvas (landing: colour + demo cards; editor: album art).
  DOM behind glass is never refracted — paint it into the wallpaper instead.
- Glass elements are transparent DOM registered via `<Glass>`; without WebGL2 the
  `.lg` class falls back to a CSS vibrancy material (`html.lg-on` marks WebGL).
- Layers: 0 bars/sheets, 1 sliders + tab lens, 2 switches. Max 16 shapes and
  24 fills per layer — keep per-tab control counts within that.
- Controls inside a scrolling panel need an ancestor with `data-glass-clip`.
- Overlays (menus, modals, toasts) use the CSS `.material` class.
- Card presets can't use the WebGL engine (html-to-image export can't read it);
  CardCanvas renders the same material in DOM/CSS via its `Pane` helper.
- SF Pro / system-ui for UI, one system tint (#007aff), radius 12/14, no card shadows.

## Env Vars (.env.local)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

## Notes
- CardCanvas is 'use client' — uses refs and dom-to-image-more
- page.tsx is 'use client' — manages all app state
- Server Actions stay 'use server' — never expose Spotify secrets to client
- Spotify CDN (i.scdn.co) is whitelisted in next.config.ts
- No user auth needed — Client Credentials flow only
