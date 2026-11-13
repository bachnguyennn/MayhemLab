import { useSyncExternalStore } from 'react';
import type { GameState } from '@mayhem-lab/contracts';
import { snapshot } from '@mayhem-lab/game-data';
import { ManualGameStateProvider } from '@mayhem-lab/recommender';

export const PATCH = snapshot.manifest.dataDragonVersion;
const STORAGE_KEY = 'mayhem-lab:session:v1';

export type Route = { page: 'home' | 'explore' | 'patch'; params: URLSearchParams };

export function parseHash(hash: string): Route {
  const [path = '', query = ''] = hash.replace(/^#\/?/, '').split('?');
  const page = path === 'explore' ? 'explore' : path === 'patch' ? 'patch' : 'home';
  return { page, params: new URLSearchParams(query) };
}

const knownChampions = new Set(snapshot.champions.map((c) => c.id));
const knownAugments = new Set(snapshot.augments.map((a) => a.id));

function clean(championId: string | null, augmentIds: string[]): Partial<GameState> {
  const c = championId && knownChampions.has(championId) ? championId : null;
  return { championId: c, selectedAugmentIds: c ? augmentIds.filter((id) => knownAugments.has(id)) : [] };
}

export interface RestoreResult {
  initial: Partial<GameState>;
  /** Set when a saved session was dropped because it was created on another patch. */
  notice: string | null;
}

/** URL wins (shareable links), then local storage. Saved sessions from another patch are discarded. */
export function restore(hash: string, stored: string | null): RestoreResult {
  const { page, params } = parseHash(hash);
  if (page === 'explore' && params.get('c')) {
    return { initial: clean(params.get('c'), (params.get('a') ?? '').split(',').filter(Boolean)), notice: null };
  }
  if (!stored) return { initial: {}, notice: null };
  try {
    const s = JSON.parse(stored) as GameState;
    if (s.patch !== PATCH) {
      return {
        initial: {},
        notice: `Your saved session was made on game data ${s.patch}. The data is now ${PATCH}, so the session was cleared to avoid mixing patches.`,
      };
    }
    return { initial: clean(s.championId, Array.isArray(s.selectedAugmentIds) ? s.selectedAugmentIds : []), notice: null };
  } catch {
    return { initial: {}, notice: null };
  }
}

function readStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

const restored = restore(window.location.hash, readStorage());
export const restoreNotice = restored.notice;
export const provider = new ManualGameStateProvider(PATCH, restored.initial);

export function exploreHash(state: GameState): string {
  if (!state.championId) return '#/explore';
  const a = state.selectedAugmentIds.length ? `&a=${state.selectedAugmentIds.join(',')}` : '';
  return `#/explore?c=${encodeURIComponent(state.championId)}${a}`;
}

provider.subscribe((state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: the session still works in memory */
  }
  if (parseHash(window.location.hash).page === 'explore') {
    history.replaceState(null, '', exploreHash(state));
  }
});

export function useGameState(): GameState {
  return useSyncExternalStore(
    (cb) => provider.subscribe(cb),
    () => provider.getState(),
  );
}

function subscribeHash(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}
export function useRoute(): Route['page'] {
  return useSyncExternalStore(subscribeHash, () => parseHash(window.location.hash).page);
}

/** Apply a pasted or navigated share link to the session. */
window.addEventListener('hashchange', () => {
  const { page, params } = parseHash(window.location.hash);
  if (page !== 'explore' || !params.get('c')) return;
  provider.replace(clean(params.get('c'), (params.get('a') ?? '').split(',').filter(Boolean)));
});
