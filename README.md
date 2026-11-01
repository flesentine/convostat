# Convostat

A local-first journal for how people talk to you.

Log a comment someone made, rate **what was said** (content) and **how it was said**
(delivery), and watch the pattern build up over time. Everything stays in your
browser — no account, no server, no analytics.

## The model

Two axes, each with 201 snap points:

- **Content** — `-100` very critical → `0` neutral → `+100` very affirming
- **Delivery** — `-100` harsh → `0` flat → `+100` very kind

The slider and the 2D pad both use the full range. Hold **Shift** while using the
pad's arrow keys for steps of 10.

Together they make four quadrants:

|                | Kind delivery          | Harsh delivery           |
| -------------- | ---------------------- | ------------------------ |
| Affirming content | **Supportive**      | **Backhanded**           |
| Critical content  | **Constructive**    | **Hostile**              |

The key distinction: critical news delivered kindly is *not* the same as critical
news delivered harshly. Convostat keeps those apart.

Optional per-comment detail: intensity (1–5), how it landed (better / same / worse),
and a private note.

## What you get

- **Log** — pad-first capture: pick a person, tap where the comment landed, and
  save. Text, topics, fine sliders, and optional detail stay tucked away until
  you need them, with the selected person's recent trend underneath.
- **People** — cards with a delivery sparkline and each person's dominant pattern.
  Import names from the Android contact picker, a `.vcf` file, or pasted text.
- **Person detail** — quadrant scatter, rolling-average trend lines, a per-topic
  breakdown (content, delivery, skew), auto-written pattern summary, and the full
  comment log with edit/delete.
- **Settings** — light/dark/system theme, JSON backup and restore, CSV export,
  topic management, sample data, and a full reset.

## Stack

Vite + React 19 + TypeScript, Tailwind CSS v4, Dexie (IndexedDB), React Router
(hash routing), Zod for backup validation, Vitest for the scoring and aggregation
logic. Installable as a PWA via `vite-plugin-pwa`.

## Design

A compact, readable UI scale: Inter with 16px reading text, 14px interface
text, 12px metadata, a 4/8px spacing rhythm, and a limited warm neutral palette.
Text meets WCAG AA contrast in both themes; chart lines use solid/dashed styles so
meaning never depends on color alone. Touch targets stay at 40px or larger.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
npm test             # domain logic tests
npm run build        # type-check + production build
npm run preview      # serve the production build (PWA works here)
npm run icons        # regenerate PWA icons from scripts/generate-icons.mjs
```

## Data & privacy

All records live in IndexedDB under the `convostat` database in this browser
profile. Nothing is uploaded. The app asks the browser for persistent storage, but
browsers can still evict site data under pressure — **export a JSON backup from
Settings regularly**. Import supports merge or full replace, validated with Zod.
Contact import reads display names only; phone numbers and email addresses are
ignored and never stored.

## Deploy

`.github/workflows/deploy.yml` builds the app with a `/convostat/` base path and
publishes `dist` to GitHub Pages on pushes to `main`. In the repository settings,
set **Pages → Build and deployment → Source** to **GitHub Actions** once.

Because the app uses hash routing, it works from any subpath without server rewrites.
