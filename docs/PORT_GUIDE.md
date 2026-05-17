# Lantern — Port Guide

This is the reference for porting the throwaway prototype in
`design-mock/*.jsx` into the real Vite + React + TypeScript app under
`src/`. The foundation (build, types, API, state, shell) is already
built. This guide is for porting the **pages** and **components**.

## The job

Take a `design-mock/*.jsx` file and produce the equivalent `.tsx`
under `src/`. **Port faithfully.** Keep the exact JSX structure, the
exact copy/text, the exact CSS `className` strings, and the exact
logic. The ONLY things that change:

1. Module system: `window.X` globals → imports + hooks.
2. Types: add TypeScript types; no `any` unless truly unavoidable.
3. Routing: `setRoute(...)` → `react-router` navigation.
4. Props: **pages take no props** — they read everything from hooks.

Do **not** redesign anything. Do **not** "improve" copy. The CSS in
`src/styles.css` keys off these exact class names — if you rename a
class, the styling breaks.

## Project conventions

- TypeScript, `.tsx`. `strict` mode is on, plus `noUnusedLocals` /
  `noUnusedParameters` — remove dead vars, or prefix an intentionally
  unused param with `_`.
- Path alias: `@/` → `src/`. Import like `import { Icon } from "@/components/Icon"`.
- Named exports for pages and components: `export function HomePage() {...}`.
- `import type { ... }` for type-only imports.
- CSS custom properties in inline styles are allowed —
  `style={{ "--hue": 60 }}` already type-checks (see `src/css-vars.d.ts`).
- React 18, function components + hooks. No class components.

## Foundation API

### Data — `useSession()` from `@/state/session`

Returns the `SessionSnapshot` (all read-only archive data). Fields:

| `window.X` (old) | `useSession().X` (new) |
| --- | --- |
| `PLAYER` | `player` |
| `ROSTER` | `roster` |
| `LATEST_RAID` | `latestRaid` |
| `RAID_HISTORY` | `raidHistory` |
| `RAID_PULLS` | `pulls` |
| `PULL_EVENTS` | `pullEvents` |
| `MOMENTS` | `moments` |
| `RETRO_EXCERPT` | `retroExcerpt` |
| `SUPPORT_ACTIONS` | `supportActions` |
| `COHORT_PRESETS` | `cohortPresets` |
| `COHORT_SCENARIOS` | `cohortScenarios` |
| `COHORT_CARDS` | `cohortCards` |
| `COORD_MARKERS` | `coordMarkers` |
| `COORDINATION_HIGHLIGHTS` | `coordinationHighlights` |
| `ASK_HISTORY` | `askHistory` |
| `ASK_SUGGESTIONS` | `askSuggestions` |
| `COHORT_SUGGESTIONS` | `cohortSuggestions` |
| `SETTINGS_GROUPS` | `settingsGroups` |
| `PACKAGE_ITEMS` | `packageItems` |
| `CONSENT` | `consent` |
| `NOTEBOOK_TAGS` | `noteTags` |
| `OBSERVATION_KINDS` / `PROPOSAL_KINDS` | `observationKinds` |
| `RAID_LEADS` | `raidLeads` |
| `GLOSSARY` | `glossary` |
| `ASK_DEMO_QUESTION` | `askSuggestions[0]` (same string) |

### Ephemeral state — `useWorkbench()` from `@/state/workbench`

- `cohortContext`, `setCohortContext(c)` — the ephemeral cohort selection.
- `askQueued` — `{ q, at } | null`, a question queued by another surface.
- `tweaks`, `setTweak(key, value)` — UI preferences.
- `openPropose(seed?)` — replaces `window.Propose.open(...)`. `seed` is an `ObservationDraft`.
- `openQuickNote(seed?)` — replaces `window.QuickNote.open(...)`. `seed` is a `QuickNoteSeed`.
- `openMoment(m)` — replaces `window.Moment.open(...)`. `m` is a `Moment`.
- `openPalette()` / `openTweaks()`.
- `openCohort(scenarioId)` — sets cohort context + navigates to `/replay`.
- `askQuestion(q)` — queues a question + navigates to `/ask`.

### Memory — `useNotebook()` / `useObservations()` from `@/state/memory`

`useNotebook()`: `notes`, `addNote(draft)`, `updateNote(id, patch)`,
`removeNote(id)`, `notesByBinding(kind, ref)`.

`useObservations()`: `observations`, `shareObservation(draft)`,
`withdrawObservation(id)`, `observationByNoteId(noteId)`.

**These mutators are async** (`Promise`-returning). `await` them or
fire-and-forget — the lists update reactively afterward, so a page
should derive its list from `useNotebook().notes` /
`useObservations().observations`, not keep a parallel copy.

Mapping: `window.Notebook` → `useNotebook()`; `window.Observations` /
`window.Proposals` → `useObservations()`.

### Routing

- `useNavigate()` from `react-router-dom`.
- `setRoute("home")` → `navigate("/")`; `"raids"` → `/raids`;
  `"replay"` → `/replay`; `"ask"` → `/ask`; `"contribute"` →
  `/contribute`; `"notebook"` → `/notebook`; `"observations"` →
  `/observations`; `"settings"` → `/settings`.
- `setRoute("raids/2026-05-12")` → `navigate("/raids/2026-05-12")`.
- `openRaid()` → `navigate("/raids/" + latestRaid.id)`.
- `window.__goRoute("observations")` → `navigate("/observations")`.

### Components & helpers

- `import { Icon } from "@/components/Icon"` — `<Icon name="play" size={14} />`. `IconName` is exported.
- `import { SpellIcon, PAvatar, BrandGlyph } from "@/components/primitives"`.
- `import { Term } from "@/components/Term"` — `<Term k="cohort">label</Term>`.
- `import { fmtClock, fmtClockPad, fmtClockLong, classColorVar } from "@/lib/format"`.
  - `fmtClock(t)` → `"M:SS"` — use for the `fmt` / `fmtT` helpers in the mock.
  - `fmtClockPad(t)` → `"MM:SS"` — use for `moment-drawer`'s `formatTime`.
  - `fmtClockLong(t)` → `"H:MM:SS"` or `"MM:SS"` — use for the raid-timeline axis.
- The Workshop service: `import { api } from "@/api"`, then
  `await api.workshop.ask(query, context)` → `Promise<WorkshopAnswer>`.

### Domain types

All domain types are exported from `@/api` (e.g.
`import type { Moment, Pull, CohortScenario } from "@/api"`).

## Patterns

- A page component takes **no props**. `export function HomePage() { ... }`.
- Local sub-components within a page file are fine — keep them, type
  their props with a small `interface`.
- Helper functions duplicated across mock files (`kindLabelShort`,
  `FilterPill`, etc.) — keep a local copy in each file, as the mock does.
- The `replay-v1.jsx.bak` file is a backup — ignore it.
