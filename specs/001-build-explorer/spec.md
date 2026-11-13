# Feature Specification: Build Explorer (Website MVP)

**Feature Branch**: `001-build-explorer`

**Created**: 2026-11-13

**Status**: Implemented (see tasks.md for evidence)

**Input**: User description: "Website MVP: select champion, select augments, explore complete build archetypes that update as augments are added"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explore playstyles from a champion and first augment (Priority: P1)

A player opens the site, picks their champion, picks the first augment they took in ARAM: Mayhem,
and sees several complete playstyles (build archetypes) for that champion, each with a core item
path, situational items, the reasons the augment fits, strengths, and weaknesses.

**Why this priority**: This is the product. Everything else refines it.

**Independent Test**: Pick Jinx, pick an attack-speed augment, confirm at least two playstyles
appear with items, an explanation that names the augment, and a patch label.

**Acceptance Scenarios**:

1. **Given** the champion grid, **When** the player searches "jin" and selects Jinx, **Then** the
   session shows Jinx and the augment picker becomes the next step.
2. **Given** Jinx is selected, **When** the player selects one augment, **Then** two or more
   playstyles are listed, each with core items, situational items, strengths, weaknesses, and at
   least one sentence explaining the champion fit.
3. **Given** any result, **Then** every playstyle shows the patch it was built from and a plain
   statement that no match statistics are shown.

---

### User Story 2 - Results adapt as augments are added (Priority: P1)

The player adds a second, third, and later augment. The playstyles are re-evaluated against the
whole selection, and the site explains what changed: the earlier direction still holds, another
playstyle became worth exploring, a hybrid opened up, or the augment has no modelled interaction.

**Why this priority**: The first augment sets a direction but must never lock the player in.

**Independent Test**: With a champion and one augment selected, add a second augment from a
different family and confirm the ordering or fit labels change and a change note is shown.

**Acceptance Scenarios**:

1. **Given** one augment is selected, **When** a second is added, **Then** both remain in the
   ordered selection history and the playstyles are recomputed from both.
2. **Given** an augment that conflicts with a playstyle, **When** it is added, **Then** that
   playstyle lists the conflict explicitly.
3. **Given** a selection, **When** the player removes an augment or resets, **Then** results match
   what a fresh session with the same selection would show.
4. **Given** the same augment is submitted twice, **Then** it appears once.

---

### User Story 3 - Inspect one playstyle in detail and compare (Priority: P2)

The player opens a playstyle to see the full item path, situational choices with the reason for
each, every augment interaction, augments that would deepen the build if offered later, and the
limitations of the guidance.

**Independent Test**: Open a playstyle and confirm the detail view lists items with images and
names, per-augment reasons, and a limitations note.

**Acceptance Scenarios**:

1. **Given** results, **When** the player opens a playstyle, **Then** the detail view shows core
   and situational items, synergies, conflicts, and augments worth considering later.
2. **Given** the detail view, **Then** it is reachable and dismissible by keyboard alone.

---

### User Story 4 - Know where the data comes from (Priority: P2)

The player can see the game patch, the dataset version, when it was retrieved, the sources and
their licences, what changed in the dataset, and the Riot disclaimer.

**Acceptance Scenarios**:

1. **Given** any page, **Then** the current patch is visible and the footer carries the Riot
   disclaimer and data credits.
2. **Given** the patch page, **Then** it lists each source with URL, retrieval time, and counts.

---

### User Story 5 - Automatic game state later (Priority: P3)

The engine accepts champion and augment state from a provider interface so that a future approved
Overwolf client can supply it automatically. A mock provider proves the path in tests.

**Acceptance Scenarios**:

1. **Given** the mock provider replays documented event shapes, **Then** the engine output equals
   the output for the same state entered manually.
2. **Given** the real provider, **Then** it refuses to start unless approvals are recorded.

### Edge Cases

- Unknown champion id or unknown augment id: typed error result, never a guess.
- Augment with no modelled tags: results still render and the augment is listed as "no modelled
  interaction".
- A curated item missing from the current patch: dropped from the path and reported.
- No playstyle fits the champion: explicit empty result with a reason.
- Session saved on one patch and reloaded on another: the session is reset and the user is told.
- Image fails to load: text fallback, layout unchanged.
- Search with no matches: empty state with a way to clear the search.
- Statistics requested for any playstyle: `unavailable`, with the reason.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to search and filter champions by name and class, and select one.
- **FR-002**: Users MUST be able to search augments by name or description, filter by rarity, and
  select several in order; the ordered selection is visible and each entry is removable.
- **FR-003**: The system MUST return, for a champion and zero or more augments, a deterministic
  ordered list of playstyles, each with: id, name, summary, fit label, core items, situational
  items with reasons, augment synergies, augment conflicts, strengths, weaknesses, augments worth
  considering later, patch, and data-quality label.
- **FR-004**: The system MUST recompute on every change to the selection and describe the change
  relative to the previous selection.
- **FR-005**: The system MUST NOT display win rates, pick rates, sample sizes, or performance
  tiers. Fit labels MUST be described as rule-derived compatibility, not performance.
- **FR-006**: Every statistical field in public output MUST carry status `unavailable` or
  `insufficient` unless a compliance flag backed by a recorded authorisation is set.
- **FR-007**: All champion, item, and augment metadata MUST come from the committed snapshot
  produced by the ingestion script, validated against a schema.
- **FR-008**: The session (champion, augments, patch) MUST persist across refresh, be shareable
  by URL, and be resettable in one action.
- **FR-009**: The site MUST show the patch, dataset version, retrieval time, sources, licences,
  the Riot disclaimer, and data credits.
- **FR-010**: The site MUST provide loading, error, and empty states and be fully keyboard
  operable.
- **FR-011**: The engine MUST consume state through a `GameStateProvider` interface, with manual
  and mock-Overwolf implementations; the real Overwolf provider MUST stay disabled by default.
- **FR-012**: The research statistics package MUST implement a documented estimator, intervals,
  minimum samples, and tier thresholds, and MUST return typed insufficient-data results.

### Key Entities

- **Champion**: id, name, patch, class tags, range type, derived traits, image.
- **Augment**: id, name, description, rarity tier, patch, derived tags, icon.
- **GameItem**: id, name, patch, stats, tags, cost, image.
- **Playstyle**: curated archetype definition: champion-fit rules, item path, augment affinities.
- **BuildRecommendation**: a playstyle evaluated against a game state.
- **GameState**: champion id, patch, ordered augment ids.
- **StatisticalEvidence**: research-only observation with status valid/insufficient/unavailable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor reaches playstyle results in three selections or fewer.
- **SC-002**: Every champion in the snapshot returns either one or more playstyles or an explicit
  empty result; none throws (verified by an exhaustive test).
- **SC-003**: Results update within 100 ms of an augment change on a mid-range laptop.
- **SC-004**: Zero fabricated statistics: an automated scan of the built site and public payloads
  finds no win-rate, pick-rate, or tier fields with values.
- **SC-005**: Automated accessibility checks report no serious or critical violations on the
  explorer and patch pages.
- **SC-006**: The site works from 360px to desktop widths without horizontal scrolling.

## Assumptions

- Mayhem match data is not available through the Riot API and Riot prohibits displaying augment
  win rates (see `research/data-feasibility.md`, `docs/compliance/`), so v1 is qualitative.
- Playstyle definitions and item paths are curated editorial knowledge, labelled as such.
- Augment descriptions come from the game string table; numeric placeholders that the source
  does not resolve are shown as unresolved rather than invented.
- A static site satisfies every requirement; no backend is built.
