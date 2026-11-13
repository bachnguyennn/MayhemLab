import type {
  Augment,
  AugmentInteraction,
  AugmentSuggestion,
  BuildRecommendation,
  Champion,
  ChangeNote,
  FitLevel,
  GameDataset,
  GameItem,
  GameState,
  ItemRef,
  PublicStatistics,
  RecommendationResult,
} from '@mayhem-lab/contracts';
import { STATISTICS_UNAVAILABLE_REASON } from '@mayhem-lab/contracts';
import {
  AUGMENT_OVERRIDES,
  FIT_THRESHOLDS,
  MAX_AUGMENT_EFFECT,
  MIN_CHAMPION_FIT,
  PLAYSTYLES,
  type FitRule,
  type PlaystyleDefinition,
} from './playstyles';

export interface EngineOptions {
  playstyles?: PlaystyleDefinition[];
  /** Policy-approved statistics lookup. Defaults to "unavailable" for everything. */
  statistics?: (championId: string, playstyleId: string, patch: string) => PublicStatistics;
  maxSuggestions?: number;
}

const round = (n: number) => Math.round(n * 100) / 100;
const normName = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function ruleMatches(rule: FitRule, c: Champion): boolean {
  if (rule.role && !c.roles.includes(rule.role)) return false;
  if (rule.rangeType && c.rangeType !== rule.rangeType) return false;
  if (rule.damageProfile && !rule.damageProfile.includes(c.damageProfile)) return false;
  if (rule.trait && !c.traits.includes(rule.trait)) return false;
  if (rule.minAttack !== undefined && c.ratings.attack < rule.minAttack) return false;
  if (rule.minMagic !== undefined && c.ratings.magic < rule.minMagic) return false;
  if (rule.minDefense !== undefined && c.ratings.defense < rule.minDefense) return false;
  return true;
}

export function championFit(p: PlaystyleDefinition, c: Champion): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  for (const rule of p.fitRules) {
    if (ruleMatches(rule, c)) {
      score += rule.weight;
      reasons.push(rule.reason);
    }
  }
  return { score, reasons };
}

/** How one augment relates to one playstyle. Pure and deterministic. */
export function augmentEffect(p: PlaystyleDefinition, a: Augment): { score: number; interaction: AugmentInteraction } {
  let plus = 0;
  let minus = 0;
  const pros: string[] = [];
  const cons: string[] = [];
  for (const tag of a.tags) {
    const syn = p.synergies[tag];
    if (syn) {
      plus += syn.weight;
      pros.push(syn.reason);
    }
    const con = p.conflicts[tag];
    if (con) {
      minus += con.weight;
      cons.push(con.reason);
    }
  }
  const override = AUGMENT_OVERRIDES[a.apiName];
  if (override) {
    if (override.supports?.includes(p.damageType)) {
      plus += override.weight;
      pros.unshift(override.reason);
    } else if (override.opposes?.includes(p.damageType)) {
      minus += override.weight;
      cons.unshift(override.reason);
    }
  }
  const net = Math.max(-MAX_AUGMENT_EFFECT, Math.min(MAX_AUGMENT_EFFECT, plus - minus));
  const kind: AugmentInteraction['kind'] = net > 0 ? 'synergy' : net < 0 ? 'conflict' : 'neutral';
  const uniq = (xs: string[]) => [...new Set(xs)];
  let reasons: string[];
  if (kind === 'synergy') reasons = uniq(pros);
  else if (kind === 'conflict') reasons = uniq(cons);
  else if (pros.length || cons.length) reasons = ['helps in some ways and works against the build in others'];
  else if (a.descriptionSource === 'missing') reasons = ['no description is available for this augment in the current data'];
  else reasons = ['no modelled interaction with this playstyle'];
  return { score: net, interaction: { augmentId: a.id, augmentName: a.name, kind, reasons } };
}

function toRef(i: GameItem): ItemRef {
  return { id: i.id, name: i.name, imageUrl: i.imageUrl, cost: i.cost };
}

function fitLevel(compat: number): FitLevel {
  return compat >= FIT_THRESHOLDS.strong ? 'strong' : compat >= FIT_THRESHOLDS.good ? 'good' : 'possible';
}

interface Evaluated {
  def: PlaystyleDefinition;
  fit: { score: number; reasons: string[] };
  augmentScore: number;
  interactions: AugmentInteraction[];
  compatibility: number;
}

function evaluateAll(playstyles: PlaystyleDefinition[], champion: Champion, augments: Augment[]): Evaluated[] {
  const out: Evaluated[] = [];
  for (const def of playstyles) {
    const fit = championFit(def, champion);
    if (fit.score < MIN_CHAMPION_FIT) continue;
    let augmentScore = 0;
    const interactions: AugmentInteraction[] = [];
    for (const a of augments) {
      const e = augmentEffect(def, a);
      augmentScore += e.score;
      interactions.push(e.interaction);
    }
    out.push({ def, fit, augmentScore, interactions, compatibility: round(fit.score + augmentScore) });
  }
  // Stable, total ordering: compatibility, then champion fit, then id.
  return out.sort(
    (a, b) => b.compatibility - a.compatibility || b.fit.score - a.fit.score || a.def.id.localeCompare(b.def.id),
  );
}

function describeChange(prev: Evaluated[] | null, cur: Evaluated[], augments: Augment[]): ChangeNote {
  const top = cur[0]!;
  if (augments.length === 0) {
    return { kind: 'initial', message: `Starting points for this champion. Pick your first augment to see how it shifts each playstyle.` };
  }
  const last = augments[augments.length - 1]!;
  const second = cur[1];
  const lastTouches = cur.some((e) => e.interactions[e.interactions.length - 1]?.kind !== 'neutral');
  if (!lastTouches) {
    return {
      kind: 'no-modelled-interaction',
      message: `${last.name} has no modelled interaction with these playstyles, so nothing moved. That is a gap in the rules, not a judgement of the augment.`,
    };
  }
  if (prev && prev[0] && prev[0].def.id !== top.def.id) {
    return {
      kind: 'pivot',
      message: `${last.name} makes ${top.def.name} worth exploring: it now fits your augments better than ${prev[0].def.name}. Both remain open.`,
    };
  }
  if (second && top.compatibility - second.compatibility <= 1 && top.def.damageType !== second.def.damageType && augments.length >= 2) {
    return {
      kind: 'hybrid',
      message: `${top.def.name} and ${second.def.name} fit your augments about equally. A hybrid that borrows items from both is reasonable.`,
    };
  }
  const lastOnTop = top.interactions[top.interactions.length - 1];
  if (lastOnTop?.kind === 'synergy') {
    return { kind: 'reinforced', message: `${last.name} reinforces ${top.def.name}; the direction you were on still holds.` };
  }
  if (lastOnTop?.kind === 'conflict') {
    return {
      kind: 'unchanged',
      message: `${last.name} works against ${top.def.name}, but it is still the closest fit for your augments overall.`,
    };
  }
  return { kind: 'unchanged', message: `${last.name} does not change which playstyles fit best.` };
}

const unavailable: PublicStatistics = { status: 'unavailable', reason: STATISTICS_UNAVAILABLE_REASON };

/**
 * Maps a game state to complete, explained playstyle build paths.
 * Pure: no I/O, no clocks, no randomness. Identical inputs give identical output.
 */
export function recommend(state: GameState, data: GameDataset, options: EngineOptions = {}): RecommendationResult {
  const playstyles = options.playstyles ?? PLAYSTYLES;
  const patch = data.manifest.dataDragonVersion;
  const warnings: string[] = [];

  if (state.patch !== patch) {
    return {
      status: 'patch-mismatch',
      patch,
      message: `This session was created on patch data ${state.patch}, but the loaded dataset is ${patch}. Start a new session so patches are not mixed.`,
      warnings,
    };
  }
  if (!state.championId) {
    return { status: 'no-champion', patch, message: 'Select a champion to begin.', warnings };
  }
  const champion = data.champions.find((c) => c.id === state.championId);
  if (!champion) {
    return {
      status: 'unknown-champion',
      patch,
      message: `Champion "${state.championId}" is not in the ${patch} dataset.`,
      warnings,
    };
  }

  const augmentById = new Map(data.augments.map((a) => [a.id, a]));
  const seen = new Set<string>();
  const augments: Augment[] = [];
  for (const id of state.selectedAugmentIds) {
    if (seen.has(id)) continue; // duplicate updates are ignored
    seen.add(id);
    const a = augmentById.get(id);
    if (!a) {
      warnings.push(`Augment "${id}" is not in the ${patch} dataset and was ignored.`);
      continue;
    }
    augments.push(a);
  }

  const current = evaluateAll(playstyles, champion, augments);
  if (current.length === 0) {
    return {
      status: 'no-compatible-playstyle',
      patch,
      message: `None of the modelled playstyles fit ${champion.name} under the current rules. This is a limit of the rule set, not a statement about the champion.`,
      warnings,
    };
  }
  const previous = augments.length > 0 ? evaluateAll(playstyles, champion, augments.slice(0, -1)) : null;

  const itemByName = new Map<string, GameItem>();
  for (const i of data.items) {
    const k = normName(i.name);
    const existing = itemByName.get(k);
    if (!existing || (existing.kind === 'component' && i.kind !== 'component')) itemByName.set(k, i);
  }
  const candidates = data.augments.filter((a) => !seen.has(a.id));
  const maxSuggestions = options.maxSuggestions ?? 6;

  const recommendations: BuildRecommendation[] = current.map((e) => {
    const missing: string[] = [];
    const resolve = (name: string): GameItem | undefined => {
      const item = itemByName.get(normName(name));
      if (!item) missing.push(name);
      return item;
    };
    const boots = e.def.boots.map(resolve).filter((x): x is GameItem => !!x).map(toRef);
    const coreItems = e.def.coreItems.map(resolve).filter((x): x is GameItem => !!x).map(toRef);
    const situationalItems = e.def.situationalItems.flatMap((s) => {
      const item = resolve(s.name);
      return item ? [{ ...toRef(item), reason: s.reason }] : [];
    });
    if (missing.length) warnings.push(`${e.def.name}: not in patch ${patch} and omitted — ${missing.join(', ')}.`);

    const augmentsToConsider: AugmentSuggestion[] = candidates
      .map((a) => ({ a, eff: augmentEffect(e.def, a) }))
      .filter((x) => x.eff.score >= 2)
      .sort((x, y) => y.eff.score - x.eff.score || x.a.name.localeCompare(y.a.name, 'en') || x.a.id.localeCompare(y.a.id))
      .slice(0, maxSuggestions)
      .map((x) => ({ augmentId: x.a.id, augmentName: x.a.name, tier: x.a.tier, reasons: x.eff.interaction.reasons }));

    return {
      playstyleId: e.def.id,
      name: e.def.name,
      summary: e.def.summary,
      damageType: e.def.damageType,
      fit: fitLevel(e.compatibility),
      compatibility: e.compatibility,
      championReasons: e.fit.reasons,
      boots,
      coreItems,
      situationalItems,
      unavailableItems: missing,
      interactions: e.interactions,
      augmentsToConsider,
      strengths: e.def.strengths,
      weaknesses: e.def.weaknesses,
      patch,
      dataQuality: 'curated-rules',
      statistics: options.statistics ? options.statistics(champion.id, e.def.id, patch) : unavailable,
    };
  });

  return {
    status: 'ok',
    patch,
    championId: champion.id,
    recommendations,
    change: describeChange(previous, current, augments),
    warnings: [...new Set(warnings)],
  };
}
