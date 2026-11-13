# Tasks: Build Explorer (Website MVP)

**Input**: `specs/001-build-explorer/spec.md`, `plan.md`

Format: `[ID] [P?] [Story] Description`. Evidence for every checked task is the test suite:
`npm run verify` (66 unit tests, build, compliance scan) and `npm run test:e2e` (31 browser tests).

## Phase 1: Setup

- [x] T001 Initialise Spec Kit and write the constitution in `.specify/memory/constitution.md`
- [x] T002 Create the npm workspace, strict TypeScript config, Vitest and Playwright config
- [x] T003 [P] Install Impeccable skills (no hooks) and write `PRODUCT.md`

## Phase 2: Foundational

- [x] T004 Define shared contracts in `packages/contracts/src/index.ts`
- [x] T005 Ingestion pipeline `scripts/data/ingest.mjs` with provenance manifest and validation
- [x] T006 [P] Derivation rules `scripts/data/lib/derive.mjs` (augment tags, champion traits, text cleaning)
- [x] T007 Snapshot loader, validator and index in `packages/game-data/src/index.ts`
- [x] T008 [P] Data quality tests `tests/unit/game-data.test.ts`

## Phase 3: User Story 1 — playstyles from champion and first augment (P1)

- [x] T009 [US1] Playstyle catalog `packages/recommender/src/playstyles.ts`
- [x] T010 [US1] Engine `packages/recommender/src/engine.ts` (fit, augment effect, item resolution)
- [x] T011 [P] [US1] Engine tests `tests/unit/recommender.test.ts`
- [x] T012 [US1] Champion picker `apps/web/src/components/ChampionPicker.tsx`
- [x] T013 [US1] Augment picker `apps/web/src/components/AugmentPicker.tsx`
- [x] T014 [US1] Playstyle results `apps/web/src/components/Playstyles.tsx`

## Phase 4: User Story 2 — results adapt as augments are added (P1)

- [x] T015 [US2] `ManualGameStateProvider` in `packages/recommender/src/state.ts`
- [x] T016 [US2] Change notes (reinforced, pivot, hybrid, no modelled interaction) in the engine
- [x] T017 [US2] Session bar with ordered, removable augments `apps/web/src/components/Loadout.tsx`
- [x] T018 [US2] URL + localStorage session with patch-mismatch reset `apps/web/src/session.ts`

## Phase 5: User Story 3 — playstyle detail (P2)

- [x] T019 [US3] Inline full-build detail: situational items with reasons, strengths, weaknesses,
      augments to consider, limitations

## Phase 6: User Story 4 — data provenance (P2)

- [x] T020 [US4] Patch and data page, footer disclaimer and credits `apps/web/src/components/Pages.tsx`
- [x] T021 [P] [US4] Landing page with a live engine example

## Phase 7: User Story 5 — provider path for Overwolf (P3)

- [x] T022 [US5] Event normalizer `apps/overwolf/src/normalize.ts`
- [x] T023 [US5] Mock provider and approval-gated real provider `apps/overwolf/src/providers.ts`
- [x] T024 [P] [US5] Tests `tests/unit/overwolf.test.ts`

## Phase 8: Research statistics (FR-012)

- [x] T025 Estimator, intervals, tiers, public adapter `packages/statistics/src/index.ts`
- [x] T026 [P] Calibration and compliance-boundary tests `tests/unit/statistics.test.ts`

## Phase 9: Quality, compliance, delivery

- [x] T027 End-to-end and accessibility tests `tests/e2e/explorer.spec.ts`
- [x] T028 Compliance scan `scripts/qa/compliance-scan.mjs`
- [x] T029 Impeccable detector pass and design review `docs/design-review.md`
- [x] T030 CI and GitHub Pages workflow `.github/workflows/ci.yml`
- [x] T031 README, architecture, decisions, roadmap, agent status

## Convergence (remaining work found by review)

- [ ] T032 Champion fit rules are coarse for unusual kits (for example Akali gets one playstyle,
      Vayne ranks lethality first). Add curated per-champion adjustments with a review process.
- [ ] T033 Six augments have no description text in the public data and twelve match no tag rule;
      extend sources or rules. Lists are on the patch page.
- [ ] T034 Resolve the numeric placeholders shown as "X" by reading augment data values from the
      game bin files.
- [ ] T035 Implement the `live_client_data` champion fallback from the normalizer spec (section 7).
- [ ] T036 Register the product with Riot and confirm CommunityDragon reuse terms before promoting
      the site (owner action; see `docs/compliance/`).
- [ ] T037 Run an interactive Impeccable `critique` with the owner; the automated detector and
      axe checks are done, the heuristic critique was a self-review.
- [ ] T038 Split the data snapshot into its own chunk to bring the main bundle under 500 kB.
