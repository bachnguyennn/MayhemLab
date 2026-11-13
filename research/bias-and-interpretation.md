# Mayhem Lab — bias and interpretation of augment/playstyle statistics

Written 2026-11-13. This is the statistical half of the feasibility study; see `data-feasibility.md` for why no such data is currently obtainable or displayable. Everything here is reasoning and arithmetic, not measurement. No Mayhem match data was examined.

## Bottom line

- A raw win rate per (champion, augment) or per playstyle is an association, not the effect of choosing it.
- A usable per-patch table of champion × single augment needs on the order of **1.5 million matches for the typical cell and 10–25 million for the rare cells**. Augment pairs need on the order of 10^8.
- Coarse playstyles (a handful per champion) need roughly **0.25–2.5 million matches per patch**.

## Assumptions used in the arithmetic

| Quantity | Value | Status |
|---|---|---|
| Champions | 170 | from the brief |
| Augments | 150 (brief says "100+") | assumed, **UNVERIFIED** |
| Augments held per player at game end | 4 | secondary sources give levels 3/7/11/15; one says "up to five". **UNVERIFIED** |
| Participants per match | 10 | 5v5 |
| Baseline win rate | 50% | worst case for variance |

Results scale linearly with the number of augments and inversely with augments held, so a different count changes the constants, not the order of magnitude.

## Sample size per cell

Standard error of a win rate: SE = sqrt(p(1−p)/n) ≈ 0.5/sqrt(n). For a 95% interval of half-width h: n = (1.96 × 0.5 / h)².

| Half-width | n per cell |
|---|---|
| ±5 pp | 384 |
| ±2 pp | 2,401 |
| ±1 pp | 9,604 |

Real differences between reasonable options on one champion are probably a few points, so ±2 pp is the minimum for a ranking, and it is still too coarse to order neighbours. Comparing two cells is harder than estimating one: detecting a 2 pp difference with 80% power at 5% significance needs n ≈ 2 × (1.96 + 0.84)² × 0.25 / 0.02² ≈ **9,800 per cell**.

## Matches needed

**Champion × single augment.**

- Cells: 170 × 150 = 25,500.
- Observations per match: 10 players × 4 augments = 40.
- Typical cell rate per match: 10 × (1/170) × (4/150) ≈ 1.57 × 10⁻³.
- Matches for n = 2,401: 2,401 / 1.57 × 10⁻³ ≈ **1.5 million**. (Same answer from totals: 25,500 × 2,401 / 40 ≈ 1.53 million.)
- Rare cell, e.g. a champion at 0.2% pick rate with an augment held by 0.5% of players: 10 × 0.002 × 0.005 = 10⁻⁴ per match, so 2,401 / 10⁻⁴ ≈ **24 million**.
- For ±1 pp multiply by 4: about 6 million typical, about 100 million rare.

**Champion × augment pair.**

- Cells: 170 × C(150,2) = 170 × 11,175 ≈ 1.9 million.
- Observations per match: 10 × C(4,2) = 60.
- Matches at ±2 pp if uniform: 1.9 million × 2,401 / 60 ≈ **76 million**. Most cells would stay empty in practice. Full four-augment sets are out of reach.

**Champion × coarse playstyle** (say 6 archetypes per champion).

- Cells: 170 × 6 = 1,020; one observation per player, 10 per match.
- Uniform: 1,020 × 2,401 / 10 ≈ **245,000 matches**.
- With realistic skew (unpopular champions, minority playstyles at 5–10× below average frequency): **1–2.5 million**.

**Context.** The one large aggregate found (Chinese servers, see the feasibility file) reports about 20 million valid matches in 4.5 days of one patch. That scale is adequate for single-augment cells and inadequate for pairs. A free personal API key, if Mayhem were served at all, would yield roughly 35,000–65,000 matches per day per region: 1.5 million would take 3–6 weeks, longer than a patch.

Each patch resets the count. Pooling patches buys sample at the price of mixing different balance states, and mid-patch hotfixes split a patch further.

## Hazards

**1. Selection bias: offered at random, chosen deliberately.**
The offer is random; the pick is not. Players take an augment when it suits their champion, team, enemy team and current game state. "Win rate when held" then mixes the augment's effect with the conditions that made it attractive. Win-more augments look strong because they are picked when already ahead; comeback augments look weak for the opposite reason.
The clean design uses the randomness: compare games where the augment was *offered* against games where it was not (an intention-to-treat estimate). This needs offer data, which no documented match-v5 field provides. Without offers, the selection effect cannot be removed, only acknowledged.

**2. Look-ahead bias.**
The final build is unknown when the first augment is chosen. Labelling a game with its end-state playstyle and then presenting that playstyle's win rate as advice for the first decision conditions on the future. Completed builds also embed survivorship: a six-item, four-augment build exists only in long games, and players who were winning finish builds more often. Later augments arrive at levels 7, 11 and 15, so short or one-sided games have fewer augments and the "holds augment X" population is filtered by game length and game state.
Mitigation: condition only on what was known at the decision point (champion, earlier augments, team compositions), and treat later choices as outcomes, not as attributes.

**3. Champion baseline strength.**
A strong champion lifts every augment it favours. Augments mostly taken by strong champions look good globally. Report the difference from the champion's own baseline, never the raw rate, and never pool across champions without standardising.

**4. Game length.**
Scaling augments and items gain value with time; their holders are over-represented in long games. Length is also partly an outcome of the choice, so adjusting for it can remove part of the real effect. Stratify for description; do not treat it as a simple confounder.

**5. Skill.**
Mayhem has no ranked ladder, so there is no visible skill label. Better players pick better and execute better, which inflates the apparent value of whatever they prefer, especially high-skill-ceiling options. A snowball crawl over-represents frequent players. Hidden matchmaking rating is not exposed. Partial proxy: a player's prior win rate or games played, which costs still more data.

**6. Region.**
Regions differ in pick culture, pace and possibly patch timing. A pooled estimate is weighted by wherever the crawl sampled most. A single-region dataset (for example Chinese servers) does not transfer safely.

**7. Small cells and multiple comparisons.**
With 25,500 cells at ±2 pp, about 5% — roughly 1,275 — fall outside their interval by chance alone. A list sorted by win rate puts the luckiest small cells at the top (winner's curse). Required: a minimum n to display, shrinkage towards the champion baseline (hierarchical or empirical Bayes), ranking by the lower bound of the interval, and tiers wide enough that neighbouring tiers are actually distinguishable.

**8. Non-independence.**
Five teammates share one result, and the same players recur across matches. Effective sample size is below the row count. Treat every figure above as a lower bound.

**9. Team and opponent context.**
Champions are random in ARAM, but augments are chosen after seeing both teams. An anti-tank augment is taken into tanky enemy teams, so its win rate measures those matchups as much as the augment.

**10. Definition leakage.**
If playstyles are defined by clustering observed builds, the label is built from the same data used to score it. Fix definitions in advance or on a separate sample.

**11. Sampling frame and data quality.**
Remakes, AFK games, bots and private lobbies need exclusion rules, and the rules move the numbers. Partial samples of unknown construction cannot be reweighted.

## How results should be worded, if this ever becomes possible

- Say "players who ended with X won N% of games", not "X gives N%".
- Show n and an interval; hide cells below a threshold.
- Show the difference from the champion baseline.
- State patch, regions, sampling method and date.
- Never present end-state build statistics as first-pick advice without the look-ahead caveat.
