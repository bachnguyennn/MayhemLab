# Recommendation rules

Everything here is deterministic and lives in `packages/recommender/src`. None of it is derived
from match outcomes.

## Inputs

- **Champion**: Riot class tags, range type (attack range ≥ 300 is ranged), attack / defence /
  magic ratings, damage profile (share of magic vs physical damage tags in ability tooltips:
  ≥ 70% magic, ≤ 30% physical, otherwise mixed), and traits found by keyword rules in ability text.
- **Augments**: tags found by keyword and markup rules in the augment's description.
- **Playstyles**: nine curated definitions in `playstyles.ts`.

## Scoring

1. **Champion fit** = sum of the weights of every `fitRule` whose conditions all hold. A playstyle
   is offered only if fit ≥ `MIN_CHAMPION_FIT` (3).
2. **Augment effect** for each selected augment = Σ synergy weights − Σ conflict weights over the
   augment's tags, plus any entry in `AUGMENT_OVERRIDES`, clamped to ±`MAX_AUGMENT_EFFECT` (3).
3. **Compatibility** = champion fit + Σ augment effects.
4. **Order**: compatibility, then champion fit, then playstyle id. Total and stable.
5. **Fit label**: ≥ 7 strong, ≥ 4.5 good, otherwise possible.

The thresholds were chosen so that a champion's signature class playstyle reads "strong" with no
augments, and a secondary one needs supporting augments to get there. They are editorial.

## Change notes

Comparing the result with and without the latest augment:

| Kind | Condition |
| --- | --- |
| `no-modelled-interaction` | the latest augment is neutral for every offered playstyle |
| `pivot` | the top playstyle changed |
| `hybrid` | two or more augments, top two within 1 point, different damage types |
| `reinforced` | the latest augment is a synergy for the top playstyle |
| `unchanged` | otherwise |

## Augments to consider

Unselected augments with an effect ≥ 2 for the playstyle, sorted by effect then name, capped at
six. Presented as options; the site never tells the player which to take.

## Limits

Rules read text, not gameplay. They do not know team compositions, numbers hidden behind
placeholders, or how anything performs. Mismatches for unusual champions are expected and tracked
in `specs/001-build-explorer/tasks.md` (T032).
