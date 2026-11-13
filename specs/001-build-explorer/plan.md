# Implementation Plan: Build Explorer (Website MVP)

**Branch**: `001-build-explorer` | **Date**: 2026-11-13 | **Spec**: [spec.md](./spec.md)

## Summary

A static website where a player selects a champion and augments and explores complete playstyle
build paths. A framework-free rules engine maps a `GameState` to explained recommendations using a
committed, patch-stamped data snapshot. No statistics are shown: Mayhem match data is not
available and Riot prohibits augment win rates (see `research/` and `docs/compliance/`).

## Technical Context

**Language/Version**: TypeScript 5 (strict), Node 20+ for tooling

**Primary Dependencies**: React 19, Vite 6, Tailwind CSS 4; no state or routing library

**Storage**: Committed JSON snapshot (`packages/game-data/snapshot`); `localStorage` for the session

**Testing**: Vitest (unit, data quality, compliance boundary), Playwright + axe-core (end to end,
accessibility), `scripts/qa/compliance-scan.mjs` (built output)

**Target Platform**: Evergreen browsers, 360px and up; GitHub Pages

**Project Type**: npm workspaces monorepo: shared packages + one web app

**Performance Goals**: results update within 100 ms of an augment change

**Constraints**: $0 operating cost, no backend, no accounts, WCAG 2.1 AA, no fabricated data

**Scale/Scope**: 173 champions, 181 items, 170 augments, 9 playstyles on patch 26.22

## Constitution Check

| Principle | How the plan satisfies it |
| --- | --- |
| I. Correctness | Pure engine; deterministic ordering; unit + e2e tests gate merges |
| II. Data integrity | Snapshot from scripted ingestion with sha256 provenance; curated rules labelled; typed unavailable results |
| III. Compliance | No statistics on public surfaces; research package gated by `toPublicStatistics`; real Overwolf provider throws without approvals; build-time scan |
| IV. Reproducibility | `npm run data:ingest [version]`; rules and thresholds in source and `docs/architecture/recommendation-rules.md` |
| V. Maintainability | Engine, data, statistics and contracts have no React, DOM, or Overwolf imports |
| VI. Accessibility | Semantic HTML, keyboard flows, axe checks in CI, reduced-motion support |
| VII. $0 cost | Static hosting on GitHub Pages; public data only; no keys |
| VIII. Honest attribution | Commits under the owner's git identity; data credits and disclaimer in the footer |

No violations; the complexity table is empty.

## Project Structure

```text
packages/contracts/      shared TypeScript types and two constants
packages/game-data/      snapshot JSON, validation, lookups
packages/recommender/    playstyle catalog, rules engine, manual state provider
packages/statistics/     research-only estimator, tiers, policy-gated public adapter
apps/web/                React site (landing, explorer, patch page)
apps/overwolf/           event normalizer, mock provider, approval-gated real provider, research docs
scripts/data/            ingestion pipeline and derivation rules
scripts/qa/              compliance scan, screenshot helper
tests/unit, tests/e2e    Vitest and Playwright suites
docs/, research/         architecture, decisions, compliance, feasibility research
```

**Structure decision**: no `apps/api`. Every requirement is met by a static bundle, so a backend
would add cost and operations for no user value (decision 0001). The API "contracts" asked for in
the brief exist as the typed modules in `packages/contracts`, which a future service could serve
unchanged.

## Key Design Decisions

1. **Tags from game markup.** Augment tags and champion traits are derived by keyword rules from
   the game's own text (`scripts/data/lib/derive.mjs`), not hand-assigned per entity.
2. **Curated playstyles, resolved by name.** Item paths are editorial; names are resolved against
   the patch snapshot at run time, and anything missing is dropped and reported.
3. **Bounded augment effect.** One augment moves a playstyle by at most 3, so a single card never
   decides the order alone.
4. **Fit labels, not tiers.** `strong / good / possible` come from documented thresholds on rule
   weight and are described everywhere as compatibility, not performance.
5. **Provider interface.** The site uses `ManualGameStateProvider`; tests use
   `MockOverwolfGameStateProvider`; both feed the same `recommend()`.
6. **Session.** URL hash carries champion and augments (shareable); `localStorage` restores on
   refresh; a session from another patch is cleared with a notice.
