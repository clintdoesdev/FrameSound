# FrameSound — Design System

FrameSound's own look: a dark-first creative studio with soft glass, not a copy
of any platform UI. Tokens live in `src/app/globals.css`.

## Character
- Dark-first (`#0a0a0c`), warm paper light theme (`#f3f1ec`), both via `prefers-color-scheme`.
- One accent. Mint `#2ee6a6` by default; in the editor it is **re-tinted from the album
  art** (`--accent`, with `--accent-ink` chosen for contrast). Use `--accent-text` for
  accent-coloured text so it stays readable in both themes.
- Glass is a supporting material, not the whole identity: bars, the settings sheet,
  overlays and landing cards.

## Type
- Poppins for UI and headings (`--font`, `--font-display`, tight tracking on display).
- Mono uppercase eyebrows for labels and numbered sections (`.eyebrow`, `01 Preset`).
- Card fonts are separate and user-selectable.

## Shape & surfaces
- Radii 10 / 14 / 22; bars 16–18. Avoid all-pill chrome.
- Surfaces: `--surface`, `--surface-2`, `--surface-3` with 1px `--line` hairlines.
- CSS glass: `.glass` / `.material` (blur 24px, saturate 170%).

## Controls
- Chips (`.chips`) for single choice, `.toggle` 36×20, `.range` with accent fill and a
  ringed thumb, `.opt` icon+toggle cards, `.tile` pickers, numbered `.section`s.
- Primary action = accent fill (`.btn[data-variant="primary"]`); everything else neutral.

## Motion
- Critically damped, no bounce or squash: 140–200ms ease-out for UI, springs with
  damping 1 for the glass tab lens.
- Landing: slow drifting colour, floating cards, pointer parallax. All motion is
  disabled under `prefers-reduced-motion`.

## Liquid Glass kit (WebGL)
- Used only where nothing scrolls beneath it: the fixed desktop editor (nav, search,
  sheet, tab lens). A per-frame canvas trails compositor scrolling and looks wobbly,
  so the landing page, mobile layouts and anything inside scroll containers use CSS glass.
