// Shared contracts. Types only (plus two tiny constants) — no runtime dependencies.
// Changes here require orchestrator review (constitution, principle V).

// ---- Game metadata -------------------------------------------------------------------------

export type RangeType = 'melee' | 'ranged';
export type DamageProfile = 'physical' | 'magic' | 'mixed' | 'unknown';

export interface Champion {
  id: string;
  key: number;
  name: string;
  title: string;
  /** Data Dragon version the record was taken from. */
  patch: string;
  /** Riot class tags, e.g. "Marksman". */
  roles: string[];
  resource: string;
  attackRange: number;
  rangeType: RangeType;
  ratings: { attack: number; defense: number; magic: number };
  /** Derived from the share of magic vs physical damage tags in ability tooltips. */
  damageProfile: DamageProfile;
  /** Derived from ability text by documented keyword rules. */
  traits: string[];
  imageUrl?: string;
}

export type AugmentTier = 'silver' | 'gold' | 'prismatic';

export interface Augment {
  id: string;
  apiName: string;
  name: string;
  description: string;
  /** Where the description text came from. "arena-shared" text is reused by the game from Arena. */
  descriptionSource: 'mayhem' | 'arena-shared' | 'missing';
  /** True when the source text has numeric placeholders we could not resolve (shown as "X"). */
  unresolvedValues: boolean;
  tier?: AugmentTier;
  patch: string;
  tags: string[];
  iconUrl?: string;
}

export interface GameItem {
  id: number;
  name: string;
  patch: string;
  summary: string;
  stats: Record<string, number>;
  tags: string[];
  cost: number;
  buildsFrom: number[];
  buildsInto: number[];
  kind: 'completed' | 'component' | 'boots';
  imageUrl?: string;
}

export interface DataSource {
  id: string;
  name: string;
  url: string;
  licence: string;
  retrievedAt: string;
  sha256: string;
  bytes: number;
}

export interface ChangelogEntry {
  from: string | null;
  to: string;
  date: string;
  note?: string;
  champions?: EntityDiff;
  items?: EntityDiff;
  augments?: EntityDiff;
}
export interface EntityDiff {
  added: string[];
  removed: string[];
  renamed: string[];
}

export interface DatasetManifest {
  schemaVersion: number;
  dataDragonVersion: string;
  /** Player-facing patch label, e.g. "26.22". */
  patch: string;
  patchNote: string;
  communityDragonPatch: string;
  communityDragonContentVersion: string;
  generatedAt: string;
  counts: { champions: number; items: number; augments: number };
  quality: {
    missingDescriptions: string[];
    arenaSharedDescriptions: string[];
    unresolvedValues: number;
    untagged: string[];
  };
  sources: DataSource[];
  changelog: ChangelogEntry[];
}

export interface GameDataset {
  manifest: DatasetManifest;
  champions: Champion[];
  items: GameItem[];
  augments: Augment[];
}

// ---- Game state ----------------------------------------------------------------------------

export interface GameState {
  championId: string | null;
  patch: string;
  /** Ordered, de-duplicated. */
  selectedAugmentIds: string[];
}

export interface GameStateProvider {
  getState(): GameState;
  subscribe(callback: (state: GameState) => void): () => void;
}

// ---- Statistics (research only) ------------------------------------------------------------

export interface StatisticalEvidence {
  patch: string;
  championId: string;
  playstyleId: string;
  sampleSize: number;
  wins?: number;
  estimatedWinRate?: number;
  lowerBound?: number;
  upperBound?: number;
  source: string;
  collectedAt: string;
  status: 'valid' | 'insufficient' | 'unavailable';
}

export type Tier = 'S+' | 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

/** What the public site is allowed to know about statistics for a playstyle. */
export interface PublicStatistics {
  status: 'unavailable' | 'insufficient' | 'withheld' | 'authorised';
  reason: string;
  /** Present only when status is "authorised". */
  tier?: Tier;
}

// ---- Recommendations -----------------------------------------------------------------------

export type FitLevel = 'strong' | 'good' | 'possible';

export interface ItemRef {
  id: number;
  name: string;
  imageUrl?: string;
  cost: number;
}
export interface SituationalItem extends ItemRef {
  reason: string;
}

export interface AugmentInteraction {
  augmentId: string;
  augmentName: string;
  kind: 'synergy' | 'conflict' | 'neutral';
  reasons: string[];
}

export interface AugmentSuggestion {
  augmentId: string;
  augmentName: string;
  tier?: AugmentTier;
  reasons: string[];
}

export interface BuildRecommendation {
  playstyleId: string;
  name: string;
  summary: string;
  damageType: 'physical' | 'magic' | 'mixed' | 'utility';
  /** Rule-derived compatibility. This is not a performance measurement. */
  fit: FitLevel;
  /** Internal ordering value from the documented rules. Never shown as a performance score. */
  compatibility: number;
  championReasons: string[];
  boots: ItemRef[];
  coreItems: ItemRef[];
  situationalItems: SituationalItem[];
  /** Curated items that do not exist in this patch's snapshot. */
  unavailableItems: string[];
  interactions: AugmentInteraction[];
  augmentsToConsider: AugmentSuggestion[];
  strengths: string[];
  weaknesses: string[];
  patch: string;
  dataQuality: 'curated-rules';
  statistics: PublicStatistics;
}

export type ChangeKind = 'initial' | 'reinforced' | 'pivot' | 'hybrid' | 'no-modelled-interaction' | 'unchanged';

export interface ChangeNote {
  kind: ChangeKind;
  message: string;
}

export type RecommendationResult =
  | {
      status: 'ok';
      patch: string;
      championId: string;
      recommendations: BuildRecommendation[];
      change: ChangeNote;
      warnings: string[];
    }
  | {
      status: 'no-champion' | 'unknown-champion' | 'patch-mismatch' | 'no-compatible-playstyle';
      patch: string;
      message: string;
      warnings: string[];
    };

export const STATISTICS_UNAVAILABLE_REASON =
  'ARAM: Mayhem match data is not available through the Riot API, and Riot does not permit displaying augment win rates. No statistics are shown.';

export const RIOT_DISCLAIMER =
  "Mayhem Lab isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.";
