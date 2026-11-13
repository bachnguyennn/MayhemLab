import { describe, expect, it } from 'vitest';
import type { GameState } from '@mayhem-lab/contracts';
import { snapshot } from '@mayhem-lab/game-data';
import { recommend } from '@mayhem-lab/recommender';
import {
  INITIAL_STATE,
  MockOverwolfGameStateProvider,
  NO_APPROVALS,
  OverwolfGameStateProvider,
  decodeJsonish,
  defaultConfig,
  normalize,
  project,
  type OverwolfEventsApi,
  type RawInput,
} from '@mayhem-lab/overwolf-adapter';

const patch = snapshot.manifest.dataDragonVersion;
const config = defaultConfig(patch, snapshot.champions, snapshot.augments);
const [a1, a2] = [snapshot.augments.find((a) => a.name === 'Deft')!, snapshot.augments.find((a) => a.name === 'Scoped Weapons')!];

// Envelope shapes follow Overwolf's documented examples. The augment names are OUR api names:
// the real Mayhem name format is unverified, so name resolution is table-driven.
const info = (category: string, key: string, value: unknown, feature = category): RawInput => ({
  kind: 'info',
  payload: { info: { [category]: { [key]: value } }, feature },
});
const picked = (...names: string[]): RawInput =>
  info('me', 'picked_augment', JSON.stringify(Object.fromEntries([0, 1, 2].map((i) => [`slot_${i + 1}`, { name: names[i] ?? '' }]))), 'augments');
const mayhemMatch = (id = '1'): RawInput[] => [info('game_info', 'matchId', id), info('game_info', 'queueId', '2400', 'matchState')];

describe('decodeJsonish', () => {
  it('parses double-encoded JSON and the documented trailing comma', () => {
    expect(decodeJsonish('{"augment_1":{"name":"A"}, }')).toEqual({ ok: true, value: { augment_1: { name: 'A' } } });
    expect(decodeJsonish('{broken')).toEqual({ ok: false });
    expect(decodeJsonish('plain')).toEqual({ ok: true, value: 'plain' });
  });
});

describe('normalizer', () => {
  it('produces champion and ordered augments for a Mayhem match', () => {
    const p = new MockOverwolfGameStateProvider(config);
    p.replay([...mayhemMatch(), info('summoner_info', 'champion', 'Jinx'), picked(a1.apiName), picked(a1.apiName, a2.apiName)]);
    expect(p.getState()).toEqual({ championId: 'Jinx', patch, selectedAugmentIds: [a1.id, a2.id] });
  });

  it('accepts the flat envelope and the FiddleSticks alias', () => {
    const p = new MockOverwolfGameStateProvider(config);
    p.replay([...mayhemMatch(), { kind: 'info', payload: { feature: 'summoner_info', category: 'summoner_info', key: 'champion', value: 'FiddleSticks' } }]);
    expect(p.getState().championId).toBe('Fiddlesticks');
  });

  it('de-duplicates repeated picked_augment updates and notifies once per change', () => {
    const p = new MockOverwolfGameStateProvider(config);
    const seen: GameState[] = [];
    p.subscribe((s) => seen.push(s));
    p.replay([...mayhemMatch(), info('summoner_info', 'champion', 'Jinx'), picked(a1.apiName), picked(a1.apiName), picked(a1.apiName)]);
    expect(p.getState().selectedAugmentIds).toEqual([a1.id]);
    expect(seen).toHaveLength(2); // champion, then first augment
  });

  it('a later update with blank slots cannot erase picks', () => {
    const p = new MockOverwolfGameStateProvider(config);
    p.replay([...mayhemMatch(), picked(a1.apiName, a2.apiName), picked()]);
    expect(p.getState().selectedAugmentIds).toEqual([a1.id, a2.id]);
  });

  it('resets when a new match starts', () => {
    const p = new MockOverwolfGameStateProvider(config);
    p.replay([...mayhemMatch('1'), info('summoner_info', 'champion', 'Jinx'), picked(a1.apiName), ...mayhemMatch('2')]);
    expect(p.getState()).toEqual({ championId: null, patch, selectedAugmentIds: [] });
  });

  it('exposes nothing in unsupported game modes', () => {
    const p = new MockOverwolfGameStateProvider(config);
    p.replay([info('game_info', 'matchId', '9'), info('game_info', 'queueId', '420'), info('summoner_info', 'champion', 'Jinx'), picked(a1.apiName)]);
    expect(p.getState()).toEqual({ championId: null, patch, selectedAugmentIds: [] });
  });

  it('holds data until the queue is known, then reveals it', () => {
    const p = new MockOverwolfGameStateProvider(config);
    p.replay([info('summoner_info', 'champion', 'Jinx'), picked(a1.apiName)]);
    expect(p.getState().championId).toBeNull();
    p.emit(info('game_info', 'queueId', 2400));
    expect(p.getState()).toEqual({ championId: 'Jinx', patch, selectedAugmentIds: [a1.id] });
  });

  it('skips unknown augments and champions with a diagnostic, never guessing', () => {
    const p = new MockOverwolfGameStateProvider(config);
    p.replay([...mayhemMatch(), info('summoner_info', 'champion', 'NotAChamp'), picked('TFT9_Augment_Unknown', a1.apiName)]);
    expect(p.getState()).toEqual({ championId: null, patch, selectedAugmentIds: [a1.id] });
    expect(p.diagnostics.map((d) => d.code)).toEqual(expect.arrayContaining(['unknown_augment', 'unknown_champion']));
  });

  it('is pure: malformed input leaves state untouched and returns the same reference', () => {
    const r = normalize(INITIAL_STATE, info('me', 'picked_augment', '{nope'), config);
    expect(r.next).toBe(INITIAL_STATE);
    expect(r.diagnostics[0]!.code).toBe('malformed_json');
    expect(normalize(INITIAL_STATE, { kind: 'info', payload: 42 }, config).next).toBe(INITIAL_STATE);
    expect(project(INITIAL_STATE, config).state.selectedAugmentIds).toEqual([]);
  });

  it('game_closed clears everything', () => {
    const p = new MockOverwolfGameStateProvider(config);
    p.replay([...mayhemMatch(), info('summoner_info', 'champion', 'Jinx'), { kind: 'game_closed' }]);
    expect(p.getState().championId).toBeNull();
  });
});

describe('shared contract: mock events drive the same engine as manual input', () => {
  it('gives identical recommendations', () => {
    const p = new MockOverwolfGameStateProvider(config);
    p.replay([...mayhemMatch(), info('summoner_info', 'champion', 'Jinx'), picked(a1.apiName, a2.apiName)]);
    const manual: GameState = { championId: 'Jinx', patch, selectedAugmentIds: [a1.id, a2.id] };
    expect(recommend(p.getState(), snapshot)).toEqual(recommend(manual, snapshot));
  });
});

describe('compliance boundary: real provider is approval-gated', () => {
  const calls: string[] = [];
  const api: OverwolfEventsApi = {
    setRequiredFeatures: () => calls.push('features'),
    onInfoUpdates2: { addListener: () => calls.push('info'), removeListener: () => {} },
    onNewEvents: { addListener: () => calls.push('events'), removeListener: () => {} },
  };

  it('refuses to start with no approvals and touches nothing', () => {
    const p = new OverwolfGameStateProvider(config, api);
    expect(() => p.start()).toThrow(/approval-gated/);
    expect(calls).toEqual([]);
  });

  it('refuses to start with partial approvals', () => {
    const p = new OverwolfGameStateProvider(config, api, { ...NO_APPROVALS, riotProductApproved: true, overwolfAppApproved: true, evidence: 'x' });
    expect(() => p.start()).toThrow(/recommendation behaviour/);
    expect(calls).toEqual([]);
  });
});
