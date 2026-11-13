import type { GameState, GameStateProvider } from '@mayhem-lab/contracts';

/** Ordered and de-duplicated augment ids; trims junk. */
export function normalizeState(state: GameState): GameState {
  const seen = new Set<string>();
  const selectedAugmentIds: string[] = [];
  for (const id of state.selectedAugmentIds) {
    if (typeof id !== 'string' || id === '' || seen.has(id)) continue;
    seen.add(id);
    selectedAugmentIds.push(id);
  }
  return { championId: state.championId || null, patch: state.patch, selectedAugmentIds };
}

/** Game state entered by hand. Used by the website; framework-free. */
export class ManualGameStateProvider implements GameStateProvider {
  private state: GameState;
  private listeners = new Set<(s: GameState) => void>();

  constructor(patch: string, initial?: Partial<GameState>) {
    this.state = normalizeState({ championId: null, selectedAugmentIds: [], ...initial, patch });
  }

  getState(): GameState {
    return this.state;
  }

  subscribe(callback: (state: GameState) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private set(next: GameState) {
    const n = normalizeState(next);
    if (
      n.championId === this.state.championId &&
      n.selectedAugmentIds.length === this.state.selectedAugmentIds.length &&
      n.selectedAugmentIds.every((id, i) => id === this.state.selectedAugmentIds[i])
    )
      return;
    this.state = n;
    for (const l of [...this.listeners]) l(this.state);
  }

  /** Choosing a different champion starts a new augment selection. */
  setChampion(championId: string | null) {
    if (championId === this.state.championId) return;
    this.set({ ...this.state, championId, selectedAugmentIds: [] });
  }
  addAugment(id: string) {
    this.set({ ...this.state, selectedAugmentIds: [...this.state.selectedAugmentIds, id] });
  }
  removeAugment(id: string) {
    this.set({ ...this.state, selectedAugmentIds: this.state.selectedAugmentIds.filter((x) => x !== id) });
  }
  replace(state: Partial<GameState>) {
    this.set({ ...this.state, ...state, patch: this.state.patch });
  }
  reset() {
    this.set({ championId: null, patch: this.state.patch, selectedAugmentIds: [] });
  }
}
