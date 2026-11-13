import { describe, expect, it } from 'vitest';
import type { GameDataset } from '@mayhem-lab/contracts';
import { createIndex, snapshot, snapshotAgeDays, validateDataset } from '@mayhem-lab/game-data';
import { cleanDescription, deriveAugmentTags, deriveChampionTraits, displayPatch } from '../../scripts/data/lib/derive.mjs';

describe('snapshot quality', () => {
  it('passes validation', () => {
    expect(validateDataset(snapshot)).toEqual([]);
  });

  it('has plausible volumes', () => {
    expect(snapshot.champions.length).toBeGreaterThanOrEqual(160);
    expect(snapshot.augments.length).toBeGreaterThanOrEqual(100);
    expect(snapshot.items.filter((i) => i.kind === 'completed').length).toBeGreaterThanOrEqual(60);
  });

  it('records provenance for every source', () => {
    for (const s of snapshot.manifest.sources) {
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.sha256).toMatch(/^[0-9a-f]{64}$/);
      expect(Number.isNaN(Date.parse(s.retrievedAt))).toBe(false);
      expect(s.licence.length).toBeGreaterThan(0);
    }
  });

  it('keeps CommunityDragon and Data Dragon on the same patch', () => {
    const [maj, min] = snapshot.manifest.dataDragonVersion.split('.');
    expect(snapshot.manifest.communityDragonContentVersion.startsWith(`${maj}.${min}.`)).toBe(true);
  });

  it('never leaves raw markup or placeholders in descriptions', () => {
    for (const a of snapshot.augments) {
      expect(a.description).not.toMatch(/<[a-zA-Z/]|@[A-Za-z]|\{\{|%i:/);
      if (a.descriptionSource === 'missing') expect(a.description).toBe('');
    }
  });

  it('only contains tags produced by the documented rules', () => {
    const quality = snapshot.manifest.quality;
    expect(quality.missingDescriptions.length).toBe(snapshot.augments.filter((a) => a.descriptionSource === 'missing').length);
  });

  it('lists only items available on Howling Abyss with images', () => {
    for (const i of snapshot.items) expect(i.imageUrl).toMatch(/ddragon\.leagueoflegends\.com/);
  });
});

describe('validation catches bad imports', () => {
  it('flags duplicates, mixed patches and conflicting metadata', () => {
    const bad: GameDataset = {
      ...snapshot,
      champions: [snapshot.champions[0]!, snapshot.champions[0]!, { ...snapshot.champions[1]!, patch: '1.2.3' }],
      augments: [{ ...snapshot.augments[0]!, tags: 'nope' as unknown as string[] }],
      items: [{ ...snapshot.items[0]!, cost: -5 }],
    };
    const problems = validateDataset(bad).map((i) => i.problem);
    expect(problems).toContain('duplicate id');
    expect(problems.some((p) => p.includes('differs from manifest'))).toBe(true);
    expect(problems).toContain('tags not a string array');
    expect(problems).toContain('bad cost');
  });

  it('flags a manifest without provenance', () => {
    const bad = { ...snapshot, manifest: { ...snapshot.manifest, sources: [] } };
    expect(validateDataset(bad).some((i) => i.problem === 'no provenance sources')).toBe(true);
  });
});

describe('index lookups', () => {
  const idx = createIndex(snapshot);
  it('finds entities and returns undefined for unknown ids', () => {
    expect(idx.championById('Jinx')?.name).toBe('Jinx');
    expect(idx.championById('Nope')).toBeUndefined();
    expect(idx.itemByName('infinity edge')?.kind).toBe('completed');
    expect(idx.augmentById('nope')).toBeUndefined();
    const a = snapshot.augments[0]!;
    expect(idx.augmentByApiName(a.apiName)?.id).toBe(a.id);
  });
  it('reports snapshot age', () => {
    const gen = new Date(snapshot.manifest.generatedAt);
    expect(snapshotAgeDays(snapshot.manifest, new Date(gen.getTime() + 3 * 86_400_000))).toBe(3);
  });
});

describe('derivation rules', () => {
  it('cleans markup and marks unresolved numbers instead of inventing them', () => {
    const r = cleanDescription('Gain %i:scaleAS% @AttackSpeed*100@% <speed>Attack Speed</speed>.<br><br><rules>Stacks.</rules>');
    expect(r.text).toBe('Gain X% Attack Speed.\nStacks.');
    expect(r.unresolvedValues).toBe(true);
    expect(cleanDescription('Plain text.').unresolvedValues).toBe(false);
    expect(cleanDescription('')).toEqual({ text: '', unresolvedValues: false });
  });

  it('derives augment tags from game markup', () => {
    expect(deriveAugmentTags('Gain <attackSpeed>30% Attack Speed</attackSpeed>')).toContain('attack-speed');
    expect(deriveAugmentTags('<scaleAP>Ability Power</scaleAP> and <healing>heal</healing>')).toEqual(
      expect.arrayContaining(['ability-power', 'healing']),
    );
    expect(deriveAugmentTags('')).toEqual([]);
  });

  it('derives champion range, damage profile and traits', () => {
    const d = deriveChampionTraits({
      stats: { attackrange: 550 },
      passive: { description: 'Basic attacks apply on-hit effects.' },
      spells: [{ description: 'Stuns the target.', tooltip: '<magicDamage>10 magic damage</magicDamage>', range: [1200] }],
    });
    expect(d.rangeType).toBe('ranged');
    expect(d.damageProfile).toBe('magic');
    expect(d.traits).toEqual(expect.arrayContaining(['on-hit', 'hard-cc', 'long-range-abilities']));
  });

  it('maps Data Dragon versions to the player-facing patch', () => {
    expect(displayPatch('16.22.1')).toEqual({ majorMinor: '16.22', display: '26.22' });
  });
});
