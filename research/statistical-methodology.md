# Statistical methodology (pre-registered, no data yet)

Implemented in `packages/statistics/src/index.ts` and fixed before any real data is seen. All
tests use synthetic inputs. **No real observation has been processed by this code.**

## Estimator

For a (patch, champion, playstyle) cell with `n` matches and `w` wins, and the champion's own
win rate `b` in the same patch and sample:

- Prior: Beta(b·k, (1−b)·k) with k = 50 pseudo-matches, centred on the champion baseline. This is
  champion baseline normalisation and smoothing in one step: small cells are pulled toward "this
  playstyle performs like the champion does on average".
- Posterior: Beta(b·k + w, (1−b)·k + n − w). Point estimate is the posterior mean.
- Interval: central 95% credible interval from the Beta quantile function.

## Data quality thresholds

- `n = 0` → status `unavailable`, no numbers.
- `n < 200` → status `insufficient`, no estimate or interval.
- Evidence from different patches is never pooled (`assertSamePatch` throws).
- Every observation must name its source and patch.

## Tiers

Lift = posterior mean − champion baseline, in win-rate points:

| Tier | Lift |
| --- | --- |
| S+ | ≥ +4.0 |
| S | ≥ +2.5 |
| A | ≥ +1.0 |
| B | ≥ −1.0 |
| C | ≥ −2.5 |
| D | ≥ −4.0 |
| F | below −4.0 |

A tier above B also requires the whole interval to lie above the baseline, and a tier below B
requires it to lie below; otherwise the result is B. The bands are symmetric around the baseline
and were set before seeing data so they cannot be tuned to a desired ranking. They should be
re-examined against the spread of real cells if data ever becomes available, and any change
recorded as a decision.

## Calibration

`tests/unit/statistics.test.ts` simulates 400 cells of 1,000 matches at a known true rate and
checks that the 95% interval covers the truth more than 90% of the time.

## What this does not solve

Selection effects, look-ahead bias from final builds, skill and region mix, and game length are
discussed in `bias-and-interpretation.md`. A tier from this method would describe association,
not cause.

## Publication

`toPublicStatistics` is the only exit. Without a recorded Riot authorisation it returns
`unavailable`, `insufficient` or `withheld` and never a number or a tier. Even when authorised it
exposes a tier only, never a win rate.
