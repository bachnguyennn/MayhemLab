import { describe, expect, it } from 'vitest';
import type { Augment, GameDataset, GameState } from '@mayhem-lab/contracts';
import { snapshot } from '@mayhem-lab/game-data';
import { ManualGameStateProvider, PLAYSTYLES, augmentEffect, recommend } from '@mayhem-lab/recommender';

const patch = snapshot.manifest.dataDragonVersion;
const state = (championId: string | null, ids: string[] = []): GameState => ({ championId, patch, selectedAugmentIds: ids });
const aug = (name: string): Augment => {
  const a = snapshot.augments.find((x) => x.name === name);
  if (!a) throw new Error(`fixture augment ${name} missing from snapshot`);
  return a;
};
const ok = (r: ReturnType<typeof recommend>) => {
  if (r.status !== 'ok') throw new Error(`expected ok, got ${r.status}: ${r.message}`);
  return r;
};

describe('first augment selection', () => {
  it('returns several complete playstyles for Jinx with an attack-speed augment', () => {
    const r = ok(recommend(state('Jinx', [aug('Deft').id]), snapshot));
    expect(r.recommendations.length).toBeGreaterThanOrEqual(2);
    for (const rec of r.recommendations) {
      expect(rec.coreItems.length).toBeGreaterThanOrEqual(3);
      expect(rec.situationalItems.length).toBeGreaterThan(0);
      expect(rec.championReasons.length).toBeGreaterThan(0);
      expect(rec.strengths.length).toBeGreaterThan(0);
      expect(rec.weaknesses.length).toBeGreaterThan(0);
      expect(rec.patch).toBe(patch);
      expect(rec.dataQuality).toBe('curated-rules');
      expect(rec.interactions).toHaveLength(1);
    }
    const ids = r.recommendations.map((x) => x.playstyleId);
    expect(ids).toContain('crit-carry');
    expect(ids).toContain('on-hit');
  });

  it('explains the synergy in words that name the mechanism', () => {
    const r = ok(recommend(state('Jinx', [aug('Deft').id]), snapshot));
    const onHit = r.recommendations.find((x) => x.playstyleId === 'on-hit')!;
    expect(onHit.interactions[0]!.kind).toBe('synergy');
    expect(onHit.interactions[0]!.reasons.join(' ')).toMatch(/attack speed/);
  });

  it('with no augments, gives starting points and an initial note', () => {
    const r = ok(recommend(state('Lux'), snapshot));
    expect(r.change.kind).toBe('initial');
    expect(r.recommendations[0]!.playstyleId).toBe('ap-burst');
  });
});

describe('multiple augments', () => {
  it('re-evaluates against the whole selection and keeps order', () => {
    const one = ok(recommend(state('Jinx', [aug('Deft').id]), snapshot));
    const two = ok(recommend(state('Jinx', [aug('Deft').id, aug('Scoped Weapons').id]), snapshot));
    const crit1 = one.recommendations.find((x) => x.playstyleId === 'crit-carry')!;
    const crit2 = two.recommendations.find((x) => x.playstyleId === 'crit-carry')!;
    expect(crit2.interactions.map((i) => i.augmentName)).toEqual(['Deft', 'Scoped Weapons']);
    expect(crit2.compatibility).toBeGreaterThan(crit1.compatibility);
  });

  it('never suggests an augment that is already selected', () => {
    const picked = [aug('Deft').id, aug('Scoped Weapons').id];
    const r = ok(recommend(state('Jinx', picked), snapshot));
    for (const rec of r.recommendations) for (const s of rec.augmentsToConsider) expect(picked).not.toContain(s.augmentId);
  });

  it('ignores duplicate augment updates', () => {
    const id = aug('Deft').id;
    const a = recommend(state('Jinx', [id]), snapshot);
    const b = recommend(state('Jinx', [id, id, id]), snapshot);
    expect(b).toEqual(a);
  });
});

describe('conflicting augment effects', () => {
  it('flags ADAPt as a conflict for physical playstyles and a synergy for magic ones', () => {
    const adapt = aug('ADAPt');
    const crit = PLAYSTYLES.find((p) => p.id === 'crit-carry')!;
    const burst = PLAYSTYLES.find((p) => p.id === 'ap-burst')!;
    expect(augmentEffect(crit, adapt).interaction.kind).toBe('conflict');
    expect(augmentEffect(burst, adapt).interaction.kind).toBe('synergy');
  });

  it('lists the conflict on the playstyle and lowers its compatibility', () => {
    const before = ok(recommend(state('Jinx'), snapshot)).recommendations.find((x) => x.playstyleId === 'crit-carry')!;
    const after = ok(recommend(state('Jinx', [aug('ADAPt').id]), snapshot)).recommendations.find((x) => x.playstyleId === 'crit-carry')!;
    expect(after.interactions[0]!.kind).toBe('conflict');
    expect(after.compatibility).toBeLessThan(before.compatibility);
  });

  it('caps the effect of any single augment', () => {
    for (const p of PLAYSTYLES) for (const a of snapshot.augments) expect(Math.abs(augmentEffect(p, a).score)).toBeLessThanOrEqual(3);
  });
});

describe('missing metadata', () => {
  it('returns a typed result for an unknown champion', () => {
    const r = recommend(state('NotAChampion'), snapshot);
    expect(r.status).toBe('unknown-champion');
  });

  it('returns no-champion when nothing is selected', () => {
    expect(recommend(state(null), snapshot).status).toBe('no-champion');
  });

  it('ignores an unknown augment id and says so', () => {
    const r = ok(recommend(state('Jinx', ['does-not-exist']), snapshot));
    expect(r.warnings.join(' ')).toMatch(/does-not-exist/);
    expect(r.recommendations[0]!.interactions).toHaveLength(0);
  });

  it('reports an augment with no description as having no available description', () => {
    const missing = snapshot.augments.find((a) => a.descriptionSource === 'missing');
    if (!missing) return; // nothing to assert on a patch where every description resolved
    const r = ok(recommend(state('Jinx', [missing.id]), snapshot));
    expect(r.recommendations[0]!.interactions[0]!.kind).toBe('neutral');
    expect(r.change.kind).toBe('no-modelled-interaction');
  });
});

describe('patch changes and removed items', () => {
  it('refuses to mix patches', () => {
    const r = recommend({ championId: 'Jinx', patch: '1.0.0', selectedAugmentIds: [] }, snapshot);
    expect(r.status).toBe('patch-mismatch');
  });

  it('drops an item removed from the patch and reports it', () => {
    const without: GameDataset = { ...snapshot, items: snapshot.items.filter((i) => i.name !== 'Infinity Edge') };
    const r = ok(recommend(state('Jinx'), without));
    const crit = r.recommendations.find((x) => x.playstyleId === 'crit-carry')!;
    expect(crit.coreItems.map((i) => i.name)).not.toContain('Infinity Edge');
    expect(crit.unavailableItems).toContain('Infinity Edge');
    expect(r.warnings.join(' ')).toMatch(/Infinity Edge/);
  });

  it('every curated item name resolves in the current snapshot', () => {
    const names = new Set(snapshot.items.map((i) => i.name));
    const missing: string[] = [];
    for (const p of PLAYSTYLES)
      for (const n of [...p.boots, ...p.coreItems, ...p.situationalItems.map((s) => s.name)]) if (!names.has(n)) missing.push(`${p.id}: ${n}`);
    expect(missing).toEqual([]);
  });
});

describe('no compatible archetype', () => {
  it('returns an explicit empty result', () => {
    const r = recommend(state('Jinx'), snapshot, { playstyles: [] });
    expect(r.status).toBe('no-compatible-playstyle');
  });
});

describe('determinism and coverage', () => {
  it('gives identical output for identical input', () => {
    const s = state('Kaisa', [aug('Deft').id, aug('ADAPt').id]);
    expect(JSON.stringify(recommend(s, snapshot))).toBe(JSON.stringify(recommend(s, snapshot)));
  });

  it('every champion gets at least one playstyle and never throws', () => {
    const none: string[] = [];
    for (const c of snapshot.champions) {
      const r = recommend(state(c.id), snapshot);
      if (r.status !== 'ok') none.push(c.id);
    }
    expect(none).toEqual([]);
  });

  it('never emits statistics', () => {
    for (const c of snapshot.champions.slice(0, 40)) {
      const r = ok(recommend(state(c.id, [aug('Deft').id]), snapshot));
      for (const rec of r.recommendations) {
        expect(rec.statistics.status).toBe('unavailable');
        expect(rec.statistics.tier).toBeUndefined();
      }
      expect(JSON.stringify(r)).not.toMatch(/"(winRate|pickRate|sampleSize|estimatedWinRate)"/);
    }
  });
});

describe('ManualGameStateProvider', () => {
  it('notifies on change, de-duplicates, and resets', () => {
    const p = new ManualGameStateProvider(patch);
    const seen: GameState[] = [];
    const off = p.subscribe((s) => seen.push(s));
    p.setChampion('Jinx');
    p.addAugment('1');
    p.addAugment('1');
    p.addAugment('2');
    p.removeAugment('1');
    expect(p.getState()).toEqual({ championId: 'Jinx', patch, selectedAugmentIds: ['2'] });
    expect(seen).toHaveLength(4);
    p.setChampion('Lux');
    expect(p.getState().selectedAugmentIds).toEqual([]);
    p.reset();
    expect(p.getState().championId).toBeNull();
    off();
    p.setChampion('Jinx');
    expect(seen).toHaveLength(6);
  });
});
