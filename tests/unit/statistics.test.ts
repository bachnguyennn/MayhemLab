import { describe, expect, it } from 'vitest';
import {
  METHOD,
  assertSamePatch,
  betaCdf,
  betaQuantile,
  classifyTier,
  estimate,
  toPublicStatistics,
  type Observation,
  type PublicationAuthorisation,
} from '@mayhem-lab/statistics';

// All numbers in this file are synthetic inputs for testing arithmetic. They are not observations.
const obs = (matches: number, wins: number, baseline = 0.5): Observation => ({
  patch: 'TEST',
  championId: 'TestChampion',
  playstyleId: 'test-style',
  matches,
  wins,
  championBaseline: baseline,
  source: 'synthetic unit-test fixture',
  collectedAt: '2026-01-01T00:00:00Z',
});

describe('beta helpers', () => {
  it('match known values', () => {
    expect(betaCdf(0.5, 1, 1)).toBeCloseTo(0.5, 10);
    expect(betaCdf(0.5, 2, 2)).toBeCloseTo(0.5, 10);
    expect(betaCdf(0.25, 2, 1)).toBeCloseTo(0.0625, 8); // x^2
    expect(betaQuantile(0.5, 5, 5)).toBeCloseTo(0.5, 6);
    expect(betaQuantile(0.975, 1, 1)).toBeCloseTo(0.975, 6);
  });
});

describe('estimate', () => {
  it('zero samples are unavailable, with no numbers', () => {
    const e = estimate(obs(0, 0));
    expect(e.status).toBe('unavailable');
    expect(e.estimatedWinRate).toBeUndefined();
  });

  it('small samples are insufficient, with no estimate', () => {
    const e = estimate(obs(METHOD.minSampleSize - 1, 150));
    expect(e.status).toBe('insufficient');
    expect(e.estimatedWinRate).toBeUndefined();
    expect(e.lowerBound).toBeUndefined();
  });

  it('shrinks toward the champion baseline', () => {
    const e = estimate(obs(200, 120, 0.5));
    expect(e.status).toBe('valid');
    expect(e.estimatedWinRate!).toBeLessThan(0.6);
    expect(e.estimatedWinRate!).toBeGreaterThan(0.5);
    expect(e.estimatedWinRate!).toBeCloseTo((25 + 120) / 250, 10);
  });

  it('intervals bracket the estimate and narrow with more data', () => {
    const small = estimate(obs(400, 220));
    const large = estimate(obs(40000, 22000));
    for (const e of [small, large]) {
      expect(e.lowerBound!).toBeLessThan(e.estimatedWinRate!);
      expect(e.upperBound!).toBeGreaterThan(e.estimatedWinRate!);
    }
    expect(large.upperBound! - large.lowerBound!).toBeLessThan(small.upperBound! - small.lowerBound!);
  });

  it('95% interval covers the true rate about 95% of the time (calibration)', () => {
    // Deterministic LCG so the test is reproducible.
    let seed = 12345;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
    const truth = 0.52;
    let covered = 0;
    const trials = 400;
    for (let t = 0; t < trials; t++) {
      let wins = 0;
      const n = 1000;
      for (let i = 0; i < n; i++) if (rand() < truth) wins++;
      const e = estimate(obs(n, wins, 0.5));
      if (e.lowerBound! <= truth && truth <= e.upperBound!) covered++;
    }
    const coverage = covered / trials;
    expect(coverage).toBeGreaterThan(0.9);
    expect(coverage).toBeLessThanOrEqual(1);
  });

  it('rejects impossible inputs', () => {
    expect(() => estimate(obs(10, 11))).toThrow(RangeError);
    expect(() => estimate(obs(10, 5, 1.2))).toThrow(RangeError);
    expect(() => estimate({ ...obs(10, 5), source: '' })).toThrow(RangeError);
  });
});

describe('tiers', () => {
  it('needs valid evidence', () => {
    expect(classifyTier(estimate(obs(10, 5)), 0.5).status).toBe('insufficient-data');
  });

  it('follows the documented thresholds when the interval excludes the baseline', () => {
    const tierOf = (wins: number) => {
      const r = classifyTier(estimate(obs(100000, wins)), 0.5);
      return r.status === 'tiered' ? r.tier : r.status;
    };
    expect(tierOf(55000)).toBe('S+');
    expect(tierOf(53000)).toBe('S');
    expect(tierOf(51500)).toBe('A');
    expect(tierOf(50000)).toBe('B');
    expect(tierOf(48500)).toBe('C');
    expect(tierOf(47000)).toBe('D');
    expect(tierOf(45000)).toBe('F');
  });

  it('falls back to B when the interval cannot separate the playstyle from the baseline', () => {
    const r = classifyTier(estimate(obs(250, 135)), 0.5); // high point estimate, wide interval
    expect(r).toMatchObject({ status: 'tiered', tier: 'B' });
  });

  it('refuses to pool patches', () => {
    const a = estimate(obs(300, 150));
    expect(() => assertSamePatch([a, { ...a, patch: 'OTHER' }])).toThrow(/across patches/);
    expect(() => assertSamePatch([a, a])).not.toThrow();
  });
});

describe('compliance boundary: public adapter', () => {
  const valid = estimate(obs(100000, 55000));
  const auth: PublicationAuthorisation = { grantedBy: 'Riot Games', reference: 'TEST-REF', grantedOn: '2026-01-01', scope: 'playstyle-tiers' };

  it('is unavailable with no evidence', () => {
    expect(toPublicStatistics(undefined, undefined).status).toBe('unavailable');
  });

  it('withholds valid evidence without authorisation: no tier, no numbers', () => {
    const p = toPublicStatistics(valid, 0.5);
    expect(p.status).toBe('withheld');
    expect(p.tier).toBeUndefined();
    expect(JSON.stringify(p)).not.toMatch(/\d\.\d/);
  });

  it('withholds when the authorisation is incomplete', () => {
    expect(toPublicStatistics(valid, 0.5, { ...auth, reference: ' ' }).status).toBe('withheld');
    expect(toPublicStatistics(valid, undefined, auth).status).toBe('withheld');
  });

  it('never exposes a win rate even when authorised', () => {
    const p = toPublicStatistics(valid, 0.5, auth);
    expect(p).toMatchObject({ status: 'authorised', tier: 'S+' });
    expect(Object.keys(p).sort()).toEqual(['reason', 'status', 'tier']);
  });

  it('reports insufficient data as such', () => {
    expect(toPublicStatistics(estimate(obs(10, 5)), 0.5, auth).status).toBe('insufficient');
  });
});
