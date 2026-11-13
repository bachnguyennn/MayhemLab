# Overwolf adapter (approval-gated)

This package is **not an Overwolf app**. It contains the parts that can be built and tested
without Overwolf or Riot approval:

- `src/normalize.ts` — a pure reducer that turns raw Overwolf game-event payloads into the shared
  `GameState`. Payload shapes are taken from Overwolf's public documentation.
- `src/providers.ts` — `MockOverwolfGameStateProvider` (replays events in tests) and
  `OverwolfGameStateProvider`, which throws on `start()` unless every approval is recorded.
- `docs/` — integration research, the normalization spec, and the approval checklist.

## Not verified

Nothing here has been run against a live game or the Overwolf client. In particular the
identifier format Overwolf reports for Mayhem augments and the queue id it reports for the mode
are unverified, which is why both are configuration, not code.

## Before any real provider is enabled

Complete every item in `docs/approval-checklist.md`: Riot product approval, Overwolf app approval,
approval of the recommendation behaviour, and a resolved monetization policy. No memory reading,
injection, or undocumented game access is used or planned.
