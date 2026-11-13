# Roadmap

| Phase | Status | Notes |
| --- | --- | --- |
| 0. Research and specification | Done | Constitution, spec, plan, compliance matrix, data feasibility, Overwolf research |
| 1. Functional website MVP | Done | Champion → augments → playstyles, session, patch labels, responsive |
| 2. Statistical research engine | Method done; rankings blocked | No legal, available match data. Estimator and gating implemented and tested on synthetic inputs only |
| 3. Full build explorer | Partly done | Situational items, interactions, pivot notes, search and filters shipped. Open: per-champion tuning, resolved augment numbers |
| 4. Overwolf integration research | Done to the approval gate | Normalizer + mock provider tested; real provider inert |
| 5. Deployment | Done | GitHub Pages through GitHub Actions |

## Next milestone: rule quality (feature 002)

1. Curated per-champion adjustments with a documented review process (T032).
2. Resolve augment numeric values from game bin data (T034) and cover untagged augments (T033).
3. Owner-led Impeccable critique and a results-first phone layout (T037).

## Blocked on the owner or third parties

- Register the product with Riot; ask the questions in
  `docs/compliance/riot-approval-request-draft.md` (draft only, not sent).
- Confirm reuse terms for CommunityDragon data.
- Any statistics or tiers: requires Riot authorisation and a lawful data source.
- Overwolf app: requires Riot approval, Overwolf approval and a resolved monetization policy; see
  `apps/overwolf/docs/approval-checklist.md`.
