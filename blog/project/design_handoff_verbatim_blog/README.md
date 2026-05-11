# Handoff: Verbatim — Public Blog Frontend

## Overview
A reader-facing frontend for the Verbatim CMS. Two views only:
1. **Home** — masthead, hero, four collection tabs, post list per collection.
2. **Post** — long-form reading view with strong typographic hierarchy.

Inspired by ayadighaith.com, Medium, and Substack: minimal, high-contrast, typography-first.

## About the Design Files
The file in this bundle (`Verbatim.html`) is a **design reference created in HTML** — a prototype showing intended look and behavior, not production code to copy directly. The task is to **recreate this design in the target codebase's existing environment** (Next.js, Astro, SvelteKit, etc.) using its established patterns. If no frontend exists yet, choose the most appropriate framework for the Verbatim CMS (likely whatever the CMS itself is built in or a static site generator that consumes its API) and implement there.

## Fidelity
**High-fidelity (hifi).** Exact colors, type sizes, spacing, and interactions are specified. Recreate pixel-perfectly using the codebase's component primitives.

## Screens / Views

### 1. Home (`body` default state)

**Purpose:** Browse posts across four collections; pick one to read.

**Layout (desktop):**
- Outer container max-width `1100px`, horizontal padding `40px`.
- Sections, top-to-bottom:
  1. `.masthead` — flex row, `space-between`, baseline-aligned. Padding `28px 40px 24px`. Bottom 1px rule.
  2. `.hero` — vertical block. Padding `88px 40px 56px`.
  3. `.tabs-wrap` — sticky `top: 0`, z-index 5, bottom 1px rule. Inside it `.tabs` is a 64px-tall flex row.
  4. `.collection` (one visible at a time) — contains `.col-head` (grid `1fr auto`) and `.feed` (list of `.post-row`).
  5. `.colophon` — flex row, top 1px rule, padding `56px 40px 80px`.

**Components:**

- **Wordmark** "Verbatim"
  - Geist 500, 22px, letter-spacing -0.01em
  - Followed by a 6px green dot (accent color, offset up 3px, left margin 8px)

- **Top nav** (`Index`, `About`, `Subscribe`, `RSS`)
  - Geist, 12px, uppercase, letter-spacing 0.06em
  - Color `#6b6b6b`, hover `#000`
  - Gap 28px

- **Hero `h1`**
  - Geist 400, `clamp(56px, 8vw, 112px)`, line-height 0.95, letter-spacing -0.035em
  - `<em>` inside is non-italic, weight 300, color `#1a1a1a`
  - Margin-bottom 28px

- **Hero lede**
  - Geist 300, 22px, line-height 1.45, color `#1a1a1a`, max-width 38rem

- **Hero meta row** (e.g. "221 posts", "4 collections", "Est. MMXXII")
  - Geist, 11px, uppercase, letter-spacing 0.14em, color `#6b6b6b`
  - Inline `<b>` is weight 500, color `#000`
  - Gap 24px between items
  - Margin-top 40px

- **Tabs**
  - Each tab: Geist 400, 17px, baseline-aligned with a small Geist Mono 11px count number to the right
  - Resting color `#6b6b6b`; selected `#000` with a 1px black underline at the bottom edge of the sticky bar (`::after`, `bottom: -1px`)
  - Padding `22px 0 20px`; gap between tabs `36px`
  - Hover: color shifts to `#1a1a1a` (no movement)

- **Feed-mode buttons** (`Latest` / `A–Z`)
  - Right-aligned via `.spacer { flex: 1; }`
  - Geist, 11px, uppercase, letter-spacing 0.12em
  - Active: color `#000` via `aria-pressed="true"`

- **Collection header** (`.col-head`)
  - Grid `1fr auto`, gap 40px, padding `56px 40px 36px`, bottom 1px rule
  - Left: `h2` (Geist 400, 40px, letter-spacing -0.02em) + description (Geist 300, 17px, `#6b6b6b`, max-width 36rem)
  - Right: small stat block, Geist 11px uppercase

- **Post row** (`.post-row`)
  - Grid `1fr 120px`, gap 32px, align-items baseline, padding `26px 0`, bottom 1px rule
  - Cursor pointer
  - **Title** (`.pr-title`): Geist 400, 24px, line-height 1.2, letter-spacing -0.015em, color `#1a1a1a`. Followed inline by a `.pr-dek` (deck/subtitle): Geist 300, 14px, color `#6b6b6b`, single-line ellipsis, flex: 1
  - **Date** (`.pr-date`): Geist 11px, color `#6b6b6b`, tabular-nums, right-aligned
  - Hover: `.pr-title` color → `#000`. **No translation, no fade — color only.** Transition `color .15s ease`.

- **Featured post row** (first child of each `.feed`)
  - Same grid, but padding `36px 0 40px`
  - Title becomes Geist 400, 38px, color `#000`, letter-spacing -0.025em, line-height 1.1, displayed as `block`
  - Deck becomes block, 17px, line-height 1.45, max-width 40rem, margin-top 12px (i.e. a full subtitle, not ellipsed)

- **Colophon** — Geist, 11px, uppercase, letter-spacing 0.12em

### 2. Post (`body.reading` state)

**Purpose:** Read a single post comfortably.

**Layout (desktop):**
- Sticky `.reader-bar` at top (back button, breadcrumb, read-time + date)
- `.article` — max-width **700px**, centered, padding `96px 32px 80px`
- `.a-foot` — same 700px container, metadata rows separated by 1px rules
- `.nextprev` — same 700px container, 2-column grid of prev/next buttons
- `.colophon` — same as home

**Components:**

- **Reader bar**
  - Flex row, `space-between`, padding `18px 40px`, bottom 1px rule, sticky `top:0`
  - Back button: text-only `← Index`, Geist, color `#000`, hover `#6b6b6b`
  - Crumb center: collection name in Geist serif-style 14px, letter-spacing -0.005em
  - Right: `8 min read` · `11 May 2026`, Geist 12px, tabular-nums

- **Eyebrow** (`.a-eyebrow`)
  - Geist 11px, uppercase, letter-spacing 0.18em, color `#6b6b6b`
  - Margin-bottom 28px

- **Article `h1`**
  - Geist 400, `clamp(44px, 5.6vw, 64px)`, line-height 1.02, letter-spacing -0.03em
  - `<em>` inside: weight 300, color `#1a1a1a`, **not italic** (italics removed throughout)
  - Margin-bottom 24px
  - `text-wrap: balance`

- **Dek** (`.dek`)
  - Geist 300, 24px, line-height 1.35, color `#1a1a1a`
  - Margin-bottom 48px
  - `text-wrap: pretty`

- **Byline**
  - Flex row, padding `20px 0`, top + bottom 1px rules, margin-bottom 56px
  - 36px circular black avatar with a single Geist letter in `#fff`
  - Author name in `#000` 500; rest in `#6b6b6b`
  - Share / Save links right-aligned

- **Prose** (`.prose`) — Medium-style reading:
  - Font stack: `"Charter", "Source Serif 4", "Iowan Old Style", "Apple Garamond", Georgia, Cambria, "Times New Roman", Times, serif`
  - 21px, line-height 1.58, letter-spacing -0.003em, color `#242424`
  - Paragraph margin-bottom 1.4em
  - **No drop cap.** First-letter styling intentionally removed.
  - `h2` — inherit family, 700, 28px, line-height 1.25, letter-spacing -0.014em, margins `2.2em 0 0.5em`
  - `h3` — inherit family, 600, 22px, line-height 1.3, margins `1.8em 0 0.4em`
  - Links — underlined with `text-decoration-color: #b3b3b3`, offset 3px, thickness 1px. Hover: decoration → `#000`.
  - Blockquote — margin `1.8em 0`, padding-left 23px, 3px left border `#242424`, 22px, line-height 1.45 (no italic)
  - Pullquote — same left-rule treatment, 30px, line-height 1.3 (no italic)
  - Ordered list — counters in Geist Mono 12px, color `#b3b3b3`, decimal-leading-zero
  - `code` — Geist Mono 0.86em, background `#f4f4f4`, padding `0.1em 0.4em`
  - Figure — placeholder block with 16:10 aspect, diagonal striped background, 1px border, monospace caption inside saying what should be dropped there; outer caption Geist 12px, `#6b6b6b`
  - Ornament — centered dot row, 3em vertical margin

- **Footnotes**
  - Margin-top 4em, top 1px rule, 14px, line-height 1.55, color `#6b6b6b`
  - Heading is Geist 11px uppercase, letter-spacing 0.18em

- **Article footer rows** (`.a-foot .row`)
  - Flex row, 14px vertical padding, top 1px rule between rows
  - Label: Geist 10px uppercase, letter-spacing 0.14em, color `#6b6b6b`
  - Value: Geist (serif stack), 16px, weight 300, color `#000`

- **Prev/Next** (`.nextprev`)
  - 2-column grid, gap 24px, padding 32px
  - Each card: 1px border, 24px padding
  - Label: Geist 10px uppercase, color `#6b6b6b`
  - Title: Geist 400, 20px, color `#000`
  - Hover: border-color → `#000` (no fill)
  - Next card text-aligned right

## Interactions & Behavior

- **Tabs**: clicking `.tab` sets `aria-selected="true"` on it and `"false"` on siblings; toggles `hidden` on `.collection` blocks by `data-col` attribute.
- **Open post**: clicking any `.post-row` adds `body.reading`, which hides `.home` and shows `.reader`. The current prototype reuses one full body template and re-populates `h1`, `.dek`, collection name, and date from the clicked row's contents — in a real implementation each post would be its own route.
- **Back**: removes `body.reading`, scrolls window to top instantly.
- **Sort buttons** (Latest / A–Z): cosmetic in the prototype; in production wire to client- or server-side ordering.
- **No hover translations or fades** — hover state is a color change only, transition `.15s ease`. This was an explicit design call.

## State Management
- `activeCollection` — which tab is selected (string, one of `briefs | hokum | journal | verbatim`).
- `activePost` — id of post being read, or `null` for the home view. In production this should be route-driven (e.g. `/[collection]/[slug]`), not in-page state.
- `sortMode` — `latest | az`.

Data fetching: the CMS exposes collections and posts. The frontend reads:
- `GET /collections` → `[{ id, name, description, count, ... }]`
- `GET /collections/:id/posts` → `[{ id, title, dek, date, slug, ... }]`
- `GET /posts/:slug` → `{ title, dek, body (HTML or markdown), date, readingTime, author, collection }`

## Design Tokens

```css
--ink:     #000000;   /* primary text, selected states */
--ink-2:   #1a1a1a;   /* secondary text, hovers */
--mute:    #6b6b6b;   /* labels, meta */
--mute-2:  #b3b3b3;   /* hairline meta, link underlines */
--rule:    #e6e6e6;   /* dividers */
--paper:   #ffffff;   /* page background */
--paper-2: #f4f4f4;   /* code background */
--accent:  oklch(58% 0.13 145);  /* single green dot in the wordmark */

--serif: "Geist", system-ui, sans-serif;          /* UI + headings */
--mono:  "Geist Mono", ui-monospace, monospace;   /* counts, IDs, captions */
--prose: "Charter", "Source Serif 4",             /* article body only */
         "Iowan Old Style", "Apple Garamond",
         Georgia, Cambria, "Times New Roman", Times, serif;
```

Spacing scale (px, used loosely): `4 8 12 16 22 24 28 32 36 40 56 64 80 96`.

Type sizes:
- Display: 112 / 64 / 56 / 40 / 38 / 30 / 28 / 24
- Body: 22 / 21 / 20 / 17 / 16 / 14
- Meta: 12 / 11 / 10

Border radii: **none.** Everything is square. The only round shape is the 6px wordmark dot and the 36px byline avatar (both `50%`).

Shadows: **none.**

## Typography Notes
- **All italics removed.** `<em>` tags get weight 300 and a slight color shift instead. `font-style: italic` is overridden to `normal` inside `.prose`.
- **No drop cap.** First-paragraph `::first-letter` styling is intentionally absent.
- **Reading column is exactly 700px** on the post page. This applies to `.article`, `.a-foot`, and `.nextprev`.

## Assets
- Google Fonts: Geist (300, 400, 500, 600, 700) and Geist Mono (400, 500).
- No images, icons, or illustrations — placeholder figure blocks use a CSS striped pattern with a monospace caption describing what should be dropped in.

## Files
- `Verbatim.html` — single-file prototype containing both views, all styles, and the in-page navigation script.
