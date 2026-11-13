// Research-only statistical engine.
//
// No dataset ships with this package: ARAM: Mayhem match data is not served by the Riot API and
// Riot prohibits displaying augment win rates (see research/data-feasibility.md). The estimator
// exists so the method is fixed and tested BEFORE any data is seen. Public surfaces must go
// through `toPublicStatistics`, which withholds everything unless an authorisation is recorded.

import type { PublicStatistics, StatisticalEvidence, Tier } from '@mayhem-lab/contracts';
import { STATISTICS_UNAVAILABLE_REASON } from '@mayhem-lab/contracts';

export const METHOD = {
  /** Pseudo-matches of prior evidence centred on the champion's baseline win rate. */
  priorStrength: 50,
  /** Below this many matches a cell is reported as insufficient, with no estimate. */
  minSampleSize: 200,
  /** Central credible mass for the interval. */
  credibleMass: 0.95,
  /** Lift over champion baseline (in win-rate points, 0.01 = 1pp) needed for each tier. */
  tierThresholds: [
    ['S+', 0.04],
    ['S', 0.025],
    ['A', 0.01],
    ['B', -0.01],
    ['C', -0.025],
    ['D', -0.04],
  ] as [Tier, number][],
} as const;

// ---- Beta distribution helpers -------------------------------------------------------------

function logGamma(x: number): number {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let y = x;
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5);
  let ser = 1.000000000190015;
  for (const c of g) ser += c / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betaContinuedFraction(a: number, b: number, x: number): number {
  const tiny = 1e-30;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-12) break;
  }
  return h;
}

/** Regularised incomplete beta function I_x(a, b). */
export function betaCdf(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betaContinuedFraction(a, b, x)) / a : 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b;
}

export function betaQuantile(p: number, a: number, b: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (betaCdf(mid, a, b) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---- Estimation ----------------------------------------------------------------------------

export interface Observation {
  patch: string;
  championId: string;
  playstyleId: string;
  matches: number;
  wins: number;
  /** The champion's own win rate in the same patch and sample, used as the prior centre. */
  championBaseline: number;
  source: string;
  collectedAt: string;
}

function assertObservation(o: Observation) {
  if (!Number.isInteger(o.matches) || !Number.isInteger(o.wins) || o.matches < 0 || o.wins < 0 || o.wins > o.matches)
    throw new RangeError('wins and matches must be integers with 0 <= wins <= matches');
  if (!(o.championBaseline > 0 && o.championBaseline < 1)) throw new RangeError('championBaseline must be in (0, 1)');
  if (!o.source || !o.patch) throw new RangeError('source and patch are required for provenance');
}

/**
 * Beta-binomial estimate shrunk toward the champion baseline.
 * Posterior: Beta(baseline*k + wins, (1-baseline)*k + losses), k = METHOD.priorStrength.
 */
export function estimate(o: Observation): StatisticalEvidence {
  assertObservation(o);
  const base = {
    patch: o.patch,
    championId: o.championId,
    playstyleId: o.playstyleId,
    sampleSize: o.matches,
    source: o.source,
    collectedAt: o.collectedAt,
  };
  if (o.matches === 0) return { ...base, status: 'unavailable' };
  if (o.matches < METHOD.minSampleSize) return { ...base, wins: o.wins, status: 'insufficient' };
  const a = o.championBaseline * METHOD.priorStrength + o.wins;
  const b = (1 - o.championBaseline) * METHOD.priorStrength + (o.matches - o.wins);
  const tail = (1 - METHOD.credibleMass) / 2;
  return {
    ...base,
    wins: o.wins,
    estimatedWinRate: a / (a + b),
    lowerBound: betaQuantile(tail, a, b),
    upperBound: betaQuantile(1 - tail, a, b),
    status: 'valid',
  };
}

export type TierResult = { status: 'tiered'; tier: Tier; lift: number } | { status: 'insufficient-data'; reason: string };

/**
 * Tier from baseline-normalised lift. A tier above B additionally requires the whole credible
 * interval to sit above the baseline (and below it for tiers under B), otherwise it falls back
 * to B: we do not hand out strong labels the data cannot separate from average.
 */
export function classifyTier(e: StatisticalEvidence, championBaseline: number): TierResult {
  if (e.status !== 'valid' || e.estimatedWinRate === undefined || e.lowerBound === undefined || e.upperBound === undefined)
    return { status: 'insufficient-data', reason: `evidence status is "${e.status}"` };
  const lift = e.estimatedWinRate - championBaseline;
  let tier: Tier = 'F';
  for (const [t, min] of METHOD.tierThresholds) {
    if (lift >= min) {
      tier = t;
      break;
    }
  }
  const above = ['S+', 'S', 'A'].includes(tier);
  const below = ['C', 'D', 'F'].includes(tier);
  if ((above && e.lowerBound <= championBaseline) || (below && e.upperBound >= championBaseline)) tier = 'B';
  return { status: 'tiered', tier, lift };
}

/** Evidence from different patches is never pooled. */
export function assertSamePatch(evidence: StatisticalEvidence[]): void {
  const patches = new Set(evidence.map((e) => e.patch));
  if (patches.size > 1) throw new Error(`Refusing to combine evidence across patches: ${[...patches].join(', ')}`);
}

// ---- Policy-gated public adapter -----------------------------------------------------------

export interface PublicationAuthorisation {
  grantedBy: 'Riot Games';
  /** Reference to the written approval, e.g. a ticket id recorded in docs/compliance. */
  reference: string;
  grantedOn: string;
  scope: 'playstyle-tiers';
}

/**
 * The ONLY path from research evidence to anything a public surface may render.
 * Without a recorded authorisation the result never contains a tier or a number.
 */
export function toPublicStatistics(
  evidence: StatisticalEvidence | undefined,
  championBaseline: number | undefined,
  authorisation?: PublicationAuthorisation,
): PublicStatistics {
  if (!evidence || evidence.status === 'unavailable') return { status: 'unavailable', reason: STATISTICS_UNAVAILABLE_REASON };
  if (evidence.status === 'insufficient') return { status: 'insufficient', reason: 'Not enough matches to say anything reliable.' };
  const authorised =
    !!authorisation && authorisation.grantedBy === 'Riot Games' && authorisation.scope === 'playstyle-tiers' && authorisation.reference.trim() !== '';
  if (!authorised || championBaseline === undefined) {
    return { status: 'withheld', reason: 'Statistical results exist for research only and are not published without explicit authorisation from Riot Games.' };
  }
  const t = classifyTier(evidence, championBaseline);
  if (t.status !== 'tiered') return { status: 'insufficient', reason: t.reason };
  return { status: 'authorised', reason: `Published under authorisation ${authorisation!.reference}.`, tier: t.tier };
}
