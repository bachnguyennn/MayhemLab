import type { GameState, GameStateProvider } from '@mayhem-lab/contracts';
import { INITIAL_STATE, normalize, project, type Diagnostic, type NormalizerConfig, type NormalizerState, type RawInput } from './normalize';

const sameState = (a: GameState, b: GameState) =>
  a.championId === b.championId &&
  a.patch === b.patch &&
  a.selectedAugmentIds.length === b.selectedAugmentIds.length &&
  a.selectedAugmentIds.every((x, i) => x === b.selectedAugmentIds[i]);

/** Shared shell: feeds raw inputs through the pure normalizer and notifies on value changes only. */
class NormalizingProvider implements GameStateProvider {
  protected internal: NormalizerState = INITIAL_STATE;
  private current: GameState;
  private listeners = new Set<(s: GameState) => void>();
  readonly diagnostics: Diagnostic[] = [];

  constructor(protected readonly config: NormalizerConfig) {
    this.current = project(this.internal, config).state;
  }
  getState(): GameState {
    return this.current;
  }
  subscribe(callback: (state: GameState) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
  protected push(input: RawInput) {
    const { next, diagnostics } = normalize(this.internal, input, this.config);
    this.diagnostics.push(...diagnostics);
    if (next === this.internal) return;
    this.internal = next;
    const projected = project(next, this.config);
    this.diagnostics.push(...projected.diagnostics);
    if (sameState(projected.state, this.current)) return;
    this.current = projected.state;
    for (const l of [...this.listeners]) l(this.current);
  }
}

/** Replays recorded or hand-written raw events. Used by tests and demos; never talks to Overwolf. */
export class MockOverwolfGameStateProvider extends NormalizingProvider {
  emit(input: RawInput) {
    this.push(input);
  }
  replay(inputs: RawInput[]) {
    for (const i of inputs) this.push(i);
  }
}

export interface ApprovalRecord {
  riotProductApproved: boolean;
  overwolfAppApproved: boolean;
  recommendationBehaviourApproved: boolean;
  monetizationPolicyResolved: boolean;
  /** Where the written approvals are recorded, e.g. a file under docs/compliance. */
  evidence: string;
}

export const NO_APPROVALS: ApprovalRecord = Object.freeze({
  riotProductApproved: false,
  overwolfAppApproved: false,
  recommendationBehaviourApproved: false,
  monetizationPolicyResolved: false,
  evidence: '',
});

/** Minimal slice of the Overwolf API surface this provider would use. */
export interface OverwolfEventsApi {
  setRequiredFeatures(features: string[], cb: (res: { success: boolean }) => void): void;
  onInfoUpdates2: { addListener(cb: (info: unknown) => void): void; removeListener(cb: (info: unknown) => void): void };
  onNewEvents: { addListener(cb: (e: unknown) => void): void; removeListener(cb: (e: unknown) => void): void };
}

export const REQUIRED_FEATURES = ['summoner_info', 'matchState', 'augments'];

/**
 * The real provider. It refuses to start unless every approval is recorded; see
 * docs/approval-checklist.md. All approvals are currently outstanding, so this is inert.
 */
export class OverwolfGameStateProvider extends NormalizingProvider {
  private started = false;
  private readonly onInfo = (info: unknown) => this.push({ kind: 'info', payload: info });
  private readonly onEvents = (e: unknown) => this.push({ kind: 'events', payload: e });

  constructor(
    config: NormalizerConfig,
    private readonly api: OverwolfEventsApi,
    private readonly approvals: ApprovalRecord = NO_APPROVALS,
  ) {
    super(config);
  }

  start(): void {
    const a = this.approvals;
    const missing = [
      !a.riotProductApproved && 'Riot product approval',
      !a.overwolfAppApproved && 'Overwolf app approval',
      !a.recommendationBehaviourApproved && 'approval of recommendation behaviour',
      !a.monetizationPolicyResolved && 'monetization policy resolution',
      !a.evidence.trim() && 'recorded evidence',
    ].filter(Boolean);
    if (missing.length) throw new Error(`OverwolfGameStateProvider is approval-gated. Outstanding: ${missing.join(', ')}.`);
    if (this.started) return;
    this.started = true;
    this.api.setRequiredFeatures(REQUIRED_FEATURES, () => {});
    this.api.onInfoUpdates2.addListener(this.onInfo);
    this.api.onNewEvents.addListener(this.onEvents);
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.api.onInfoUpdates2.removeListener(this.onInfo);
    this.api.onNewEvents.removeListener(this.onEvents);
    this.push({ kind: 'game_closed' });
  }
}
