# 0002 — Public product is qualitative; statistics stay internal

**Status**: accepted, 2026-11-13

**Context**: The product vision includes ranking playstyles with current-patch match statistics
and S+ to F tiers. Research on 2026-11-13 found:

- Riot's League of Legends developer documentation states: "Products cannot display win rates for
  Augments or Arena Mode items. This applies to all websites, applications and overlays."
- ARAM: Mayhem (queue 2400) matches are reported as private on match-v5 (Riot developer-relations
  issue 1109, closed as expected behaviour). We did not call the API ourselves.
- The only openly licensed Mayhem dataset found (arammayhem.com, CC BY 4.0) contains pick rates
  only.

Details and sources: `research/data-feasibility.md`, `docs/compliance/`.

**Decision**

1. The website shows rule-based compatibility only. No win rates, pick rates, sample sizes or
   tiers.
2. Letter tiers are not used as a disguise for win rates. Fit labels are named and explained as
   rule-derived.
3. `packages/statistics` fixes the estimator and tier thresholds in advance and is tested on
   synthetic inputs, but ships no data and is not imported by the web app.
4. The only path from evidence to a public surface is `toPublicStatistics`, which returns
   `withheld` unless a Riot authorisation record is supplied.
5. CI runs a compliance scan over the snapshot, the web source and the built site.

**Consequences**: The Phase 2 "statistical research engine" milestone is delivered as a method,
a feasibility report and a blocker, not as rankings.
