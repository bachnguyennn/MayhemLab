# Mayhem Lab Constitution

Mayhem Lab is a website-first, fan-made, qualitative build-planning tool for League of Legends
ARAM: Mayhem. Principles are listed in priority order; when two conflict, the lower number wins.

## Core Principles

### I. Correctness

The recommendation engine MUST be deterministic: identical inputs produce identical, identically
ordered outputs. Every feature MUST ship with automated tests, and no feature may be marked
complete without execution evidence (passing tests, a successful build).

### II. Data Integrity (NON-NEGOTIABLE)

No win rate, pick rate, sample size, score, tier, or piece of game metadata may be fabricated.
All game metadata MUST come from a recorded, patch-stamped snapshot with provenance (source URL,
retrieval time, licence note). Curated knowledge (playstyle definitions, item lists, synergy
rules) MUST be labelled as curated and MUST never be presented as a measured outcome. When data
is missing, code MUST return a typed insufficient-data or unavailable result rather than a
guess. Patches MUST never be silently mixed.

### III. Game Integrity and Compliance

No game-memory reading, process injection, anti-cheat bypass, or undocumented game manipulation.
Public surfaces MUST NOT display augment win rates or tiers derived from them, and MUST NOT
disguise such statistics as letter grades. Statistical research output MUST pass through the
policy-gated public adapter and stays internal until Riot explicitly authorises it. The real
Overwolf provider stays disabled until every item in the approval checklist is satisfied.
Recommendations MUST present multiple options with explanations and MUST NOT dictate a choice.

### IV. Reproducibility

Dataset snapshots are produced only by the scripted ingestion pipeline and are committed with
their provenance manifest. Synergy rules, thresholds, and statistical methods MUST be documented
in the repository so any result can be re-derived from the snapshot and the rules.

### V. Maintainability

Domain logic (contracts, game data, recommender, statistics) MUST NOT depend on React, Overwolf,
or browser-only APIs. Shared types live in `packages/contracts`; changes to them require
orchestrator review. Dependencies are kept minimal, TypeScript runs in strict mode, and
directories exist only when they hold working code or real documents.

### VI. Accessibility

The website MUST target WCAG 2.1 AA: full keyboard operability, visible focus, sufficient
contrast, text alternatives for imagery, responsive layouts from 360px, and respect for
`prefers-reduced-motion`. Every flow needs loading, error, and empty states.

### VII. Strict $0 Operating Cost

Only free and open-source tooling, local processing, and free static hosting are permitted. No
paid APIs, database subscriptions, commercial AI APIs, or billable resources may be created. If
a requirement is impossible at $0, the limitation is documented and the strongest free
alternative is implemented.

### VIII. Honest Attribution

Commits are made under the repository owner's real, verified git identity. No artificial bot
co-author trailers, no falsified or rewritten authorship, no promotional agent credits. Data
sources are credited and the Riot Games disclaimer is visible on the site.

## Additional Constraints

- Stack: TypeScript, npm workspaces, React + Vite + Tailwind for the web app, Vitest and
  Playwright for tests. A backend is added only when a documented requirement cannot be met by
  a static site.
- Security: no secrets in source or logs, no user accounts, no invasive permissions, and every
  imported dataset is schema-validated before use.
- Patch awareness: every public payload carries the patch and dataset version it was built from.

## Development Workflow

- Work happens on feature branches driven by a Spec Kit specification under `specs/`.
- Each agent owns its packages; `docs/agent-status.md` records ownership, status, and evidence.
- A merge to `main` requires passing type checks, unit tests, compliance-boundary tests, and a
  successful production build. CI enforces the same gates.
- UI work is reviewed with the Impeccable critique and audit workflow before it is called done.

## Governance

This constitution supersedes other project practices. Amendments require a decision record in
`docs/decisions/`, a semantic version bump (MAJOR for removed or redefined principles, MINOR for
added or expanded ones, PATCH for clarifications), and an updated amendment date. Reviews MUST
verify compliance with these principles; any deviation MUST be justified in the feature plan's
complexity tracking table.

**Version**: 1.0.0 | **Ratified**: 2026-11-13 | **Last Amended**: 2026-11-13
