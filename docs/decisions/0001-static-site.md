# 0001 — Static site, no backend

**Status**: accepted, 2026-11-13

**Context**: The brief asks Agent 5 to decide whether a backend is justified, and prefers FastAPI
with SQLite or DuckDB if one is needed. Budget is strictly $0.

**Decision**: Ship a static bundle. Do not create `apps/api`.

**Why**: The dataset is about 260 kB of JSON and changes once per patch. The engine is a pure
function that runs in under a millisecond per champion in the browser. There are no accounts, no
writes, and no private data. A server would add hosting, uptime and security work with no user
benefit, and free server tiers come with cold starts and quota risk.

**Consequences**: The "API contracts" are the TypeScript types in `packages/contracts`. If a
service is ever needed (for example to serve an Overwolf client), it can expose `recommend()` and
the snapshot behind those same types.

**Revisit when**: authorised match statistics exist and need server-side aggregation.
