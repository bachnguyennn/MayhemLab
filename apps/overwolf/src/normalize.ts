// Pure normalizer: raw Overwolf GEP payloads -> GameState.
// Implements docs/event-normalization-spec.md sections 2-7 for the documented envelopes:
// match identity + reset, queue gating, champion from `summoner_info`, cumulative
// `picked_augment` slot maps. The live_client_data champion fallback (spec 7) is not implemented
// yet. Payload shapes come from Overwolf's public docs; nothing here has been run against a live
// game, and the real augment name format for Mayhem is UNVERIFIED.

import type { Augment, Champion, GameState } from '@mayhem-lab/contracts';

export type RawInput =
  | { kind: 'info'; payload: unknown }
  | { kind: 'snapshot'; payload: unknown }
  | { kind: 'events'; payload: unknown }
  | { kind: 'game_closed' };

export interface NormalizerConfig {
  patch: string;
  supportedQueueIds: ReadonlySet<string>;
  champions: Pick<Champion, 'id' | 'name' | 'key'>[];
  championAliases: Record<string, string>;
  augments: Pick<Augment, 'id' | 'name' | 'apiName'>[];
  maxAugmentSlots: number;
}

export interface NormalizerState {
  matchKey: string | null;
  queueId: string | null;
  mode: 'unknown' | 'supported' | 'unsupported';
  rawChampion: string | null;
  /** Raw augment names; index = slot - 1; "" = empty. */
  slots: readonly string[];
  matchLive: boolean;
}

export interface Diagnostic {
  code: 'malformed_json' | 'match_reset' | 'unknown_augment' | 'unknown_champion' | 'ignored_input';
  detail: string;
}

export const INITIAL_STATE: NormalizerState = Object.freeze({
  matchKey: null,
  queueId: null,
  mode: 'unknown',
  rawChampion: null,
  slots: Object.freeze([]) as readonly string[],
  matchLive: false,
});

/** ARAM: Mayhem per Riot's queues.json. That Overwolf reports this value is UNVERIFIED. */
export const MAYHEM_QUEUE_ID = '2400';

export function defaultConfig(
  patch: string,
  champions: NormalizerConfig['champions'],
  augments: NormalizerConfig['augments'],
): NormalizerConfig {
  return {
    patch,
    supportedQueueIds: new Set([MAYHEM_QUEUE_ID]),
    champions,
    championAliases: { FiddleSticks: 'Fiddlesticks' },
    augments,
    maxAugmentSlots: 8,
  };
}

const isBlank = (v: unknown) =>
  v === null || v === undefined || (typeof v === 'string' && ['', 'null', 'undefined'].includes(v.trim()));
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Overwolf double-encodes some values and documents one example with a trailing comma. */
export function decodeJsonish(value: unknown): { ok: true; value: unknown } | { ok: false } {
  if (typeof value !== 'string') return { ok: true, value };
  const t = value.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return { ok: true, value: t };
  try {
    return { ok: true, value: JSON.parse(t) };
  } catch {
    try {
      return { ok: true, value: JSON.parse(t.replace(/,\s*([}\]])/g, '$1')) };
    } catch {
      return { ok: false };
    }
  }
}

interface Triple {
  category: string;
  key: string;
  value: unknown;
}

function flatten(payload: unknown): Triple[] {
  if (!isObj(payload)) return [];
  const out: Triple[] = [];
  const nested = isObj(payload.info) ? payload.info : null;
  if (nested) {
    for (const [category, kv] of Object.entries(nested)) {
      if (isObj(kv)) for (const [key, value] of Object.entries(kv)) out.push({ category, key, value });
    }
    return out;
  }
  if (typeof payload.category === 'string' && typeof payload.key === 'string') {
    out.push({ category: payload.category, key: payload.key, value: 'value' in payload ? payload.value : payload.data });
    return out;
  }
  // getInfo().res snapshot: { category: { key: value } }
  for (const [category, kv] of Object.entries(payload)) {
    if (isObj(kv)) for (const [key, value] of Object.entries(kv)) out.push({ category, key, value });
  }
  return out;
}

const reset = (): NormalizerState => ({ ...INITIAL_STATE });

function readSlots(decoded: unknown, max: number): string[] | null {
  if (!isObj(decoded)) return null;
  const slots: string[] = [];
  for (const [k, v] of Object.entries(decoded)) {
    const m = /^(?:slot|augment)_(\d+)$/.exec(k);
    if (!m) continue;
    const n = Number(m[1]);
    if (n < 1 || n > max) continue;
    const name = isObj(v) && typeof v.name === 'string' ? v.name.trim() : '';
    while (slots.length < n) slots.push('');
    slots[n - 1] = name;
  }
  return slots;
}

export function normalize(
  prev: NormalizerState,
  input: RawInput,
  config: NormalizerConfig,
): { next: NormalizerState; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  if (input.kind === 'game_closed') {
    const changed = JSON.stringify(prev) !== JSON.stringify(INITIAL_STATE);
    if (changed) diagnostics.push({ code: 'match_reset', detail: 'game closed' });
    return { next: changed ? reset() : prev, diagnostics };
  }

  let s: NormalizerState = prev;
  const set = (patch: Partial<NormalizerState>) => {
    s = { ...s, ...patch };
  };

  if (input.kind === 'events') {
    const events = isObj(input.payload) && Array.isArray(input.payload.events) ? input.payload.events : [];
    for (const e of events) {
      const name = isObj(e) ? e.name : undefined;
      if (name === 'matchStart' && !s.matchLive) {
        if (s.slots.some((x) => x !== '')) {
          const queue = { queueId: s.queueId, mode: s.mode };
          s = { ...reset(), ...queue };
          diagnostics.push({ code: 'match_reset', detail: 'matchStart with stale augments' });
        }
        set({ matchLive: true });
      } else if (name === 'matchEnd' || name === 'victory' || name === 'defeat') {
        if (s.matchLive) set({ matchLive: false });
      }
    }
    return { next: s, diagnostics };
  }

  const triples = flatten(input.payload);
  if (triples.length === 0) {
    diagnostics.push({ code: 'ignored_input', detail: 'no recognisable info triples' });
    return { next: prev, diagnostics };
  }
  const pick = (category: string, key: string) => triples.filter((t) => t.category === category && t.key === key);

  // 1. match identity
  for (const t of pick('game_info', 'matchId')) {
    if (isBlank(t.value)) continue;
    const key = `m:${String(t.value).trim()}`;
    if (s.matchKey === null) set({ matchKey: key });
    else if (s.matchKey !== key) {
      s = { ...reset(), matchKey: key };
      diagnostics.push({ code: 'match_reset', detail: 'matchId changed' });
    }
  }
  // 2. queue
  for (const t of pick('game_info', 'queueId')) {
    if (isBlank(t.value)) continue;
    const q = String(t.value).trim();
    const mode = config.supportedQueueIds.has(q) ? 'supported' : 'unsupported';
    if (s.queueId !== q || s.mode !== mode) set({ queueId: q, mode });
  }
  // 3. match start flag
  for (const t of pick('game_info', 'matchStarted')) {
    const live = String(t.value).toLowerCase() === 'true';
    if (live !== s.matchLive) set({ matchLive: live });
  }
  // 4. champion
  for (const t of pick('summoner_info', 'champion')) {
    if (isBlank(t.value)) continue;
    const raw = String(t.value).trim();
    if (raw !== s.rawChampion) set({ rawChampion: raw });
  }
  // 5. augments: `picked_augment` is a cumulative slot map
  for (const t of pick('me', 'picked_augment')) {
    if (isBlank(t.value)) continue;
    const decoded = decodeJsonish(t.value);
    if (!decoded.ok) {
      diagnostics.push({ code: 'malformed_json', detail: 'me.picked_augment' });
      continue;
    }
    const slots = readSlots(decoded.value, config.maxAugmentSlots);
    if (!slots) continue;
    // A slot never goes back to empty within a match: repeated or partial updates cannot erase picks.
    const merged = [...s.slots];
    slots.forEach((name, i) => {
      while (merged.length <= i) merged.push('');
      if (name !== '') merged[i] = name;
    });
    if (merged.length !== s.slots.length || merged.some((x, i) => x !== s.slots[i])) set({ slots: merged });
  }
  return { next: s, diagnostics };
}

const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '');

export function resolveChampion(raw: string | null, config: NormalizerConfig): string | null {
  if (!raw) return null;
  const aliased = config.championAliases[raw] ?? raw;
  const n = norm(aliased);
  const hit = config.champions.find((c) => norm(c.id) === n) ?? config.champions.find((c) => norm(c.name) === n);
  return hit?.id ?? null;
}

export function resolveAugment(raw: string, config: NormalizerConfig): string | null {
  const n = norm(raw);
  if (!n) return null;
  const hit =
    config.augments.find((a) => norm(a.apiName) === n) ??
    config.augments.find((a) => norm(a.apiName) === norm(`ARAM_${raw}`)) ??
    config.augments.find((a) => norm(a.name) === n);
  return hit?.id ?? null;
}

/** Project normalizer state to the shared GameState. Unsupported or unknown modes give an empty state. */
export function project(state: NormalizerState, config: NormalizerConfig): { state: GameState; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];
  if (state.mode !== 'supported') return { state: { championId: null, patch: config.patch, selectedAugmentIds: [] }, diagnostics };
  const championId = resolveChampion(state.rawChampion, config);
  if (state.rawChampion && !championId) diagnostics.push({ code: 'unknown_champion', detail: state.rawChampion });
  const selectedAugmentIds: string[] = [];
  for (const raw of state.slots) {
    if (raw === '') continue;
    const id = resolveAugment(raw, config);
    if (!id) {
      diagnostics.push({ code: 'unknown_augment', detail: raw });
      continue;
    }
    if (!selectedAugmentIds.includes(id)) selectedAugmentIds.push(id);
  }
  return { state: { championId, patch: config.patch, selectedAugmentIds }, diagnostics };
}
