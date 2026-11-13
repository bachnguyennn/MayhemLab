# Agent status — 2026-11-13

How the work was actually organised: three research roles (compliance, statistics feasibility,
Overwolf) ran as independent parallel agents and wrote only to their own directories. The
orchestrator performed the remaining roles sequentially in one working tree on the
`001-build-explorer` branch, keeping the ownership boundaries below.

| Agent | Task | Status | Files | Depends on | Blockers | Tests | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 Orchestrator | Spec Kit, constitution, contracts, integration | Done | `.specify/`, `specs/`, `docs/architecture`, `docs/decisions`, `docs/roadmap.md` | — | — | `npm run verify` | Open feature 002 |
| 1 Game data | Ingestion, snapshot, validation | Done | `packages/game-data`, `scripts/data` | — | Blank augment icons, unresolved numbers in public data | 15 unit tests | T033, T034 |
| 2 Statistics | Feasibility, method, gated engine | Method done; rankings blocked | `packages/statistics`, `research/` | 8 | No lawful Mayhem match data; Riot prohibits augment win rates | 16 unit tests (synthetic) | None until authorised data exists |
| 3 Recommender | Playstyle catalog and engine | Done | `packages/recommender` | 1 | — | 21 unit tests | T032 |
| 4 Frontend | Website | Done; owner critique open | `apps/web`, `PRODUCT.md`, `DESIGN.md` | 1, 3 | — | 31 browser tests incl. axe | T037 |
| 5 Backend | Decide whether a backend is needed | Decided: none | `packages/contracts`, `docs/decisions/0001-static-site.md` | — | — | Contracts exercised by all suites | Revisit if statistics are authorised |
| 6 Overwolf | Research, normalizer, mock provider | Done to approval gate | `apps/overwolf` | 0, 8 | Riot + Overwolf approval, monetization policy, real augment name format unverified | 14 unit tests | T035; live capture after approval |
| 7 QA / CI | Tests, compliance scan, CI, deploy | Done | `tests/`, `scripts/qa`, `.github/workflows` | all | — | CI on GitHub Actions | T038 |
| 8 Compliance | Policy research, feature matrix, drafts | Done | `docs/compliance` | — | Some policy pages unreachable on the day (marked UNVERIFIED in the docs) | — | Owner to register with Riot (T036) |

## Critical scenarios and where they are tested

| Scenario | Test |
| --- | --- |
| Unknown champion / missing augment | `recommender.test.ts`, `explorer.spec.ts` (shared link) |
| Unavailable statistics, zero-sample groups | `statistics.test.ts`, `recommender.test.ts` |
| Conflicting metadata, duplicate ids | `game-data.test.ts` |
| Duplicate augment updates | `recommender.test.ts`, `overwolf.test.ts` |
| Mid-session patch mismatch | `recommender.test.ts`, `explorer.spec.ts` |
| Network errors, unavailable images | `explorer.spec.ts` |
| Empty search results | `explorer.spec.ts` |
| Unsupported game modes | `overwolf.test.ts` |
| Compliance boundary | `statistics.test.ts`, `overwolf.test.ts`, `explorer.spec.ts`, `scripts/qa/compliance-scan.mjs` |
