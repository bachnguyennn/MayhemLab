import type { Augment, Champion, DatasetManifest, GameDataset, GameItem } from '@mayhem-lab/contracts';
import champions from '../snapshot/champions.json';
import items from '../snapshot/items.json';
import augments from '../snapshot/augments.json';
import manifest from '../snapshot/manifest.json';

export interface ValidationIssue {
  entity: 'champion' | 'item' | 'augment' | 'manifest';
  id: string;
  problem: string;
}

const isStr = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/**
 * Structural and cross-record validation for any dataset, including imported ones.
 * Returns issues instead of throwing so callers can decide how to surface them.
 */
export function validateDataset(data: GameDataset): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const version = data.manifest?.dataDragonVersion;
  if (!isStr(version)) issues.push({ entity: 'manifest', id: 'manifest', problem: 'missing dataDragonVersion' });
  if (!isStr(data.manifest?.patch)) issues.push({ entity: 'manifest', id: 'manifest', problem: 'missing patch' });
  if (!Array.isArray(data.manifest?.sources) || data.manifest.sources.length === 0)
    issues.push({ entity: 'manifest', id: 'manifest', problem: 'no provenance sources' });

  const seen = new Set<string>();
  const dup = (entity: ValidationIssue['entity'], id: string) => {
    const k = `${entity}:${id}`;
    if (seen.has(k)) issues.push({ entity, id, problem: 'duplicate id' });
    seen.add(k);
  };

  for (const c of data.champions ?? []) {
    const id = String(c?.id);
    dup('champion', id);
    if (!isStr(c?.id) || !isStr(c?.name)) issues.push({ entity: 'champion', id, problem: 'missing id or name' });
    if (!isStrArr(c?.roles) || c.roles.length === 0) issues.push({ entity: 'champion', id, problem: 'no roles' });
    if (!isStrArr(c?.traits)) issues.push({ entity: 'champion', id, problem: 'traits not a string array' });
    if (c?.rangeType !== 'melee' && c?.rangeType !== 'ranged') issues.push({ entity: 'champion', id, problem: 'bad rangeType' });
    if (c?.patch !== version) issues.push({ entity: 'champion', id, problem: `patch ${c?.patch} differs from manifest ${version}` });
  }
  for (const i of data.items ?? []) {
    const id = String(i?.id);
    dup('item', id);
    if (!Number.isInteger(i?.id) || !isStr(i?.name)) issues.push({ entity: 'item', id, problem: 'missing id or name' });
    if (!Number.isFinite(i?.cost) || i.cost < 0) issues.push({ entity: 'item', id, problem: 'bad cost' });
    if (!isStrArr(i?.tags)) issues.push({ entity: 'item', id, problem: 'tags not a string array' });
    if (i?.patch !== version) issues.push({ entity: 'item', id, problem: `patch ${i?.patch} differs from manifest ${version}` });
  }
  for (const a of data.augments ?? []) {
    const id = String(a?.id);
    dup('augment', id);
    if (!isStr(a?.id) || !isStr(a?.name)) issues.push({ entity: 'augment', id, problem: 'missing id or name' });
    if (typeof a?.description !== 'string') issues.push({ entity: 'augment', id, problem: 'description not a string' });
    if (!isStrArr(a?.tags)) issues.push({ entity: 'augment', id, problem: 'tags not a string array' });
    if (a?.tier && !['silver', 'gold', 'prismatic'].includes(a.tier)) issues.push({ entity: 'augment', id, problem: 'bad tier' });
    if (a?.descriptionSource === 'missing' && a.description !== '')
      issues.push({ entity: 'augment', id, problem: 'description present but marked missing' });
    if (a?.patch !== version) issues.push({ entity: 'augment', id, problem: `patch ${a?.patch} differs from manifest ${version}` });
  }
  return issues;
}

export interface GameDataIndex {
  dataset: GameDataset;
  championById(id: string): Champion | undefined;
  augmentById(id: string): Augment | undefined;
  augmentByApiName(apiName: string): Augment | undefined;
  itemById(id: number): GameItem | undefined;
  itemByName(name: string): GameItem | undefined;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export function createIndex(dataset: GameDataset): GameDataIndex {
  const champs = new Map(dataset.champions.map((c) => [c.id, c]));
  const augs = new Map(dataset.augments.map((a) => [a.id, a]));
  const augsByApi = new Map(dataset.augments.map((a) => [norm(a.apiName), a]));
  const itemsById = new Map(dataset.items.map((i) => [i.id, i]));
  // Prefer completed items when two records share a name.
  const itemsByName = new Map<string, GameItem>();
  for (const i of dataset.items) {
    const k = norm(i.name);
    const existing = itemsByName.get(k);
    if (!existing || (existing.kind === 'component' && i.kind !== 'component')) itemsByName.set(k, i);
  }
  return {
    dataset,
    championById: (id) => champs.get(id),
    augmentById: (id) => augs.get(id),
    augmentByApiName: (n) => augsByApi.get(norm(n)) ?? augsByApi.get(norm(`ARAM_${n}`)),
    itemById: (id) => itemsById.get(id),
    itemByName: (name) => itemsByName.get(norm(name)),
  };
}

/** The committed, validated snapshot produced by `scripts/data/ingest.mjs`. */
export const snapshot: GameDataset = {
  manifest: manifest as DatasetManifest,
  champions: champions as Champion[],
  items: items as GameItem[],
  augments: augments as Augment[],
};

/** Days since the snapshot was generated; used to flag stale metadata. */
export function snapshotAgeDays(m: DatasetManifest, now: Date = new Date()): number {
  return Math.floor((now.getTime() - new Date(m.generatedAt).getTime()) / 86_400_000);
}
