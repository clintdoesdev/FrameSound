# FrameSound

**Turn any Spotify track into a beautiful, shareable visual card.**

Paste a Spotify track link → pick a style → quote a lyric → export as HD image. No login required.

---

## What It Does

FrameSound is a browser-based card generator built on Next.js 16.2. You give it a Spotify track URL and it fetches the track metadata (title, artist, album art, release year, duration) via the Spotify Web API. It then renders a styled visual card that you can customize and export as a PNG or JPG.

Key capabilities:

- **5 card presets** — Glass, Poster, Minimal, Story, Square — each with a distinct visual identity
- **Lyrics integration** — lyrics are fetched automatically and you can click up to 2 lines to quote them on the card
- **Full customization** — background style, font, text color, padding, border radius, aspect ratio, color tint, and per-element visibility toggles
- **HD export** — download as PNG (3× scale), JPG (2× scale), transparent PNG, or copy directly to clipboard
- **30-second audio preview** — plays the Spotify preview clip inline with an animated equalizer
- **Recent tracks** — your last 5 tracks are saved to localStorage and shown as quick-access thumbnails
- **Dark/light editor shell** — toggle the editor UI between dark and light without affecting the card

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 |
| Fonts | Syne, DM Sans (Google Fonts via `next/font`) |
| Image export | dom-to-image-more |
| Color extraction | colorthief |
| Spotify data | Spotify Web API — Client Credentials flow |
| Lyrics | lyrics.ovh public API |
| State | React `useState` — all in `page.tsx`, no external store |
| Persistence | `localStorage` for recent track history only |

---

## Project Structure

```
src/
├── actions/
│   ├── spotify.ts        # Server Action: fetch track by URL
│   └── lyrics.ts         # Server Action: fetch lyrics by artist + title
├── app/
│   ├── globals.css       # CSS variables, glass utilities, scrollbar, animations
│   ├── layout.tsx        # Root layout — font loading, metadata, html/body
│   └── page.tsx          # Main page — all app state lives here
├── components/
│   ├── AudioPreview.tsx  # 30s Spotify preview player with progress bar
│   ├── CardCanvas.tsx    # Card renderer — 5 presets, all inline styles
│   ├── CustomizePanel.tsx # Config UI — 6 sections of controls
│   ├── ExportBar.tsx     # Sticky export bar — PNG/JPG/transparent/clipboard
│   ├── LyricsPanel.tsx   # Lyrics list with line selection and custom quote input
│   └── RecentTracks.tsx  # Horizontal scroll row of recent track thumbnails
├── lib/
│   └── spotify.ts        # getAccessToken() + parseSpotifyTrackId() + fetchTrack()
└── types/
    ├── index.ts           # TrackData, CardConfig, defaultConfig
    └── dom-to-image-more.d.ts  # Manual type declaration (no @types package exists)
```

---

## How the Data Flow Works

```
User pastes URL
      │
      ▼
page.tsx detects spotify.com/track/ pattern
      │
      ▼
getTrackFromUrl() [Server Action]
  └─ parseSpotifyTrackId() extracts the track ID
  └─ getAccessToken() fetches a Client Credentials token from Spotify
  └─ fetchTrack() calls GET /v1/tracks/:id
  └─ Returns: title, artist, album, coverUrl, releaseYear, duration, previewUrl
      │
      ▼
getLyrics() [Server Action]
  └─ Calls lyrics.ovh/v1/{artist}/{title}
  └─ Splits response into individual lines
  └─ Returns: lines[]
      │
      ▼
CardCanvas renders the card using the track data + CardConfig
      │
      ▼
User customizes → config updates → card re-renders live
      │
      ▼
ExportBar calls dom-to-image-more on the card DOM node → download
```

Spotify credentials never reach the browser. `getAccessToken()` and `fetchTrack()` only run in Server Actions (marked `'use server'`), so the `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` env vars stay server-side.

---

## Card Presets

| Preset | Description |
|--------|-------------|
| **Glass** | Album art blurred as background, frosted glass info panel centered over it |
| **Poster** | Full-bleed album art, gradient fade to black at the bottom, text overlaid |
| **Minimal** | Clean side-by-side layout — album art left, metadata right, no background texture |
| **Story** | Tall 9:16 layout, blurred art background, large centered album art, lyrics in glass card |
| **Square** | Compact 1:1 variant of Glass with slightly smaller art and tighter spacing |

All presets respect the full set of config options: font, text color, padding, border radius, tint hue, and element visibility toggles.

---

## Card Config Options

| Option | Values | Effect |
|--------|--------|--------|
| `preset` | glass / poster / minimal / story / square | Card layout template |
| `bgStyle` | blurred-art / solid / gradient / transparent | Background fill type |
| `bgColor` | hex color | Used when bgStyle is `solid` |
| `tintHue` | 0–360 | CSS `hue-rotate()` applied to background image |
| `textColor` | white / black / auto | Text color override |
| `font` | syne / dm-serif / playfair / bebas / instrument | Card typography |
| `showAlbumArt` | boolean | Toggle album art visibility |
| `showTitle` | boolean | Toggle track title |
| `showArtist` | boolean | Toggle artist name |
| `showYear` | boolean | Toggle release year |
| `showDuration` | boolean | Toggle track duration |
| `showLyrics` | boolean | Toggle lyrics quote |
| `padding` | 8–64px | Inner content padding |
| `borderRadius` | 0–48px | Card corner radius |
| `size` | 1:1 / 16:9 / 4:5 / 9:16 | Card aspect ratio |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/clintdoesdev/FrameSound.git
cd FrameSound
npm install
```

### 2. Set up Spotify credentials

Create a Spotify app at [developer.spotify.com](https://developer.spotify.com/dashboard) and copy your Client ID and Client Secret.

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

No redirect URI or user login is required — the app uses the **Client Credentials** flow, which only needs your app credentials.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Paste any Spotify track URL into the input bar.

---

## Exporting Cards

The export bar sticks to the bottom of the screen whenever a track is loaded.

| Button | Output | Scale | Notes |
|--------|--------|-------|-------|
| Transparent PNG | `.png` | 1× | No background fill — ideal for layering |
| PNG HD | `.png` | 3× | High resolution, best for sharing |
| JPG | `.jpg` | 2× | Smaller file size, 95% quality |
| Clipboard icon | Copies to clipboard | 2× | Uses `ClipboardItem` API — Chrome/Edge only |

Filenames are auto-generated in the format `artist-title-framesound.ext`.

> **Note on CORS:** Spotify album art is served from `i.scdn.co`. dom-to-image-more re-fetches images to inline them during export. If CORS blocks this, the export may fail. This is a browser limitation — try a different track or use the JPG export which is less strict.

---

## Building for Production

```bash
npm run build
npm start
```

The build should complete with zero TypeScript errors and zero ESLint warnings. The root route `/` is statically prerendered (no dynamic server data at build time — all Spotify fetches happen client-side via Server Actions after interaction).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SPOTIFY_CLIENT_ID` | Yes | From your Spotify Developer Dashboard app |
| `SPOTIFY_CLIENT_SECRET` | Yes | From your Spotify Developer Dashboard app |

These are only read by Server Actions and are never sent to the browser.

---

## Lyrics

Lyrics are fetched from the [lyrics.ovh](https://lyricsovh.docs.apiary.io/) public API. This service:

- Requires no API key
- Has inconsistent coverage (not every track will have lyrics)
- Only uses the primary artist name (multi-artist tracks strip everything after the first comma)

When lyrics are unavailable, the Lyrics panel shows a free-text input where you can type a custom quote that will appear on the card instead.

---

## Browser Support

| Feature | Requirement |
|---------|-------------|
| Card rendering | All modern browsers |
| PNG/JPG export | All modern browsers |
| Clipboard copy | Chrome 98+ / Edge 98+ (requires `ClipboardItem`) |
| Audio preview | All modern browsers (depends on Spotify providing a preview URL) |

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes — keep Server Actions in `src/actions/`, client components in `src/components/`
4. Run `npm run build` and confirm it passes before opening a PR
5. Open a pull request against `main`

The key architectural rule: **nothing in `src/actions/` can import from client components or browser APIs**. Server Actions must stay pure server-side code.
