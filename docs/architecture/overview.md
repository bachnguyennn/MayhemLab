# Architecture

## Principle

Domain logic is independent of presentation frameworks and of Overwolf. The same engine runs in the
website today and can run in an approved overlay later without being rewritten.

```text
 scripts/data/ingest.mjs ──► packages/game-data/snapshot/*.json   (patch-stamped, sha256 provenance)
                                        │
 packages/contracts (types) ◄───────────┼───────────────┐
                                        ▼               │
 GameStateProvider ──► GameState ──► packages/recommender ──► RecommendationResult ──► apps/web
   ├ ManualGameStateProvider   (website)                ▲
   ├ MockOverwolfGameStateProvider (tests)              │ PublicStatistics only
   └ OverwolfGameStateProvider (approval-gated)   packages/statistics (research, gated)
```

## Separation the brief asked for

| Concern | Lives in | Notes |
| --- | --- | --- |
| Game metadata | `packages/game-data` | Only produced by ingestion; validated on load |
| Statistical evidence | `packages/statistics` | No dataset ships; never imported by the web app (enforced by the compliance scan) |
| Recommendation logic | `packages/recommender` | Pure functions; no I/O, clock or randomness |
| Policy-approved presentation | `toPublicStatistics`, `apps/web` | The engine's `statistics` field defaults to `unavailable` |

## Data pipeline

`npm run data:ingest [dataDragonVersion]` downloads Data Dragon champions and items and
CommunityDragon augment index and string table, checks that both are on the same patch, derives
tags and traits (`scripts/data/lib/derive.mjs`), validates volumes and uniqueness, writes the
snapshot, and appends a changelog entry diffing the previous snapshot (added, removed, renamed).

Known data limits, all surfaced on the site's patch page:

- Augment descriptions contain numeric placeholders the public files do not resolve; shown as "X".
- Some Mayhem augments reuse Arena description text (`descriptionSource: "arena-shared"`).
- A few augments have no text (`"missing"`); they are selectable and reported as unmodelled.
- The public small augment icon files for the Mayhem set are blank, so the UI draws a
  rarity-framed monogram instead. `iconUrl` stays in the data for when real icons are available.

## Web app

Static React bundle, hash routing (`#/`, `#/explore?c=<champion>&a=<ids>`, `#/patch`), relative
asset base so the same build runs on GitHub Pages or any file server. The session lives in a
`ManualGameStateProvider`, mirrored to the URL and `localStorage`.

## Why no backend

See `docs/decisions/0001-static-site.md`.
