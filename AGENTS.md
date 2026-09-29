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
- src/components/CardCanvas.tsx — visual card renderer (7 presets; Glass and Player use glass)
- src/components/LyricsPanel.tsx — lyrics selector
- src/components/CustomizePanel.tsx — card config controls
- src/components/ExportBar.tsx — PNG/JPG/transparent download
- src/components/AudioPreview.tsx — 30s Spotify preview player
- src/components/RecentTracks.tsx — localStorage recent history
- src/components/glass/Controls.tsx — kit switch / slider / tab bar wrappers
- src/lib/liquid-glass/liquid-glass.js — WebGL2 Liquid Glass engine (vendored kit, don't rewrite)
- src/lib/liquid-glass/LiquidGlass.tsx — provider, <Glass>, instance/clip helpers
- src/lib/wallpaper.ts — paints the backdrop the glass refracts
- src/components/Landing.tsx — landing page (floating cards, parallax)
- docs/DESIGN.md — FrameSound's design system; follow it for any UI work

## Liquid Glass UI
- The desktop editor chrome uses the liquid-glass kit: one fixed WebGL canvas
  behind the page refracts a *source* canvas (the album art). DOM behind glass
  is never refracted — paint it into the wallpaper instead.
- WebGL glass is enabled only where nothing scrolls under it (desktop editor).
  The landing page, mobile layouts and scroll-panel controls use CSS glass/DOM,
  because a per-frame canvas trails compositor scroll and looks wobbly.
- Glass elements are transparent DOM registered via `<Glass>`; without WebGL2 the
  `.lg` class falls back to a CSS vibrancy material (`html.lg-on` marks WebGL).
- Layers: 0 bars/sheets, 1 tab lens. Max 16 shapes and 24 fills per layer.
- Kit springs are critically damped (no jelly/overshoot) — keep it that way.
- Overlays (menus, modals, toasts) use the CSS `.material` class.
- Glass belongs only where a preset is meant to be glassy (Glass, Player);
  Bezel, Bloom, Ticket, Tag and Profile are solid designs.
- Card presets can't use the WebGL engine (html-to-image export can't read it);
  CardCanvas renders the same material in DOM/CSS via its `Pane` helper.
- Not an Apple clone: Poppins + mono eyebrows, album-tinted accent, chips/toggles/ranges from globals.css.

## Env Vars (.env.local)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=

## Notes
- CardCanvas is 'use client' — uses refs and dom-to-image-more
- page.tsx is 'use client' — manages all app state
- Server Actions stay 'use server' — never expose Spotify secrets to client
- Spotify CDN (i.scdn.co) is whitelisted in next.config.ts
- No user auth needed — Client Credentials flow only
