# GAD App / Workbench Clickable Prototype Spec

## Goal

Design a clickable React prototype for the next-generation GAD App / Workbench.

The prototype should:
- preserve the existing replay engine conceptually,
- but redesign the experience around player-first workflows.

---

# Primary UX Principles

## 1. Start Personal

The app should begin with:
- the player's latest raid,
- their role,
- deaths,
- moments,
- improvements,
- support actions,
- continuity,
- and reflection.

NOT:
- giant team dashboards.

---

## 2. Progressive Disclosure

Simple first.
Deep later.

The UI should naturally progress from:
- personal summary
→ encounter review
→ team context
→ replay
→ advanced analysis

---

## 3. Workbench Feel

Workbench should feel:
- local,
- tactile,
- inspectable,
- keyboard-friendly,
- moddable,
- and trustworthy.

Avoid:
- slick SaaS vibes,
- engagement loops,
- giant KPI walls,
- noisy gamification.

---

# Proposed Navigation

## Primary Nav

- Home
- Raids
- Replay
- Ask
- Contribute
- Settings

---

# Route Concepts

## /
Player landing page.

Focus:
- latest raid
- notable moments
- support actions
- continuity
- quick replay entry
- recent retros
- local AI availability

---

## /raids

Raid history list.

Each raid card:
- date
- bosses
- role played
- deaths
- support highlights
- retro availability
- contribution status

---

## /raids/:date

Player-first raid review.

Should include:
- timeline
- key moments
- wipes
- support contributions
- alt swaps
- consumable support
- linked retro
- replay entry points

---

## /replay/:encounter

Preserve the existing advanced replay view.

This should feel:
- dense
- analytical
- team-oriented
- advanced-user friendly

Do not oversimplify this surface.

---

## /ask

Local AI exploration.

Must:
- show source data
- show referenced encounters
- avoid magical AI tone
- emphasize inspectability

Example:
"What killed me on pull 6?"
"Show healing cooldown overlap."
"Where did movement collapse during phase 3?"

---

## /contribute

Optional contribution flow.

Tone:
- calm
- transparent
- low pressure

Explain:
- what is uploaded
- what remains local
- what becomes guild memory
- how one upload helps illuminate the raid

---

## /settings

Local-first tooling settings.

Include:
- parser paths
- local storage
- Ollama status
- model selection
- privacy settings
- contribution permissions
- replay cache status

