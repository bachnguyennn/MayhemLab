import { useDeferredValue, useMemo, useState } from 'react';
import type { AugmentTier } from '@mayhem-lab/contracts';
import { snapshot } from '@mayhem-lab/game-data';
import { EmptyState, GameImage, Icon, SearchField, TIER_COLOR, TIER_LABEL } from './ui';

const TIERS: AugmentTier[] = ['silver', 'gold', 'prismatic'];
const fold = (s: string) => s.toLowerCase();

export function AugmentPicker({ selected, onAdd }: { selected: string[]; onAdd: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState<AugmentTier | null>(null);
  const deferred = useDeferredValue(query);

  const list = useMemo(() => {
    const q = fold(deferred.trim());
    const taken = new Set(selected);
    return snapshot.augments.filter(
      (a) => !taken.has(a.id) && (!tier || a.tier === tier) && (!q || fold(a.name).includes(q) || fold(a.description).includes(q)),
    );
  }, [deferred, tier, selected]);

  return (
    <section aria-labelledby="augment-heading" className="flex min-h-0 flex-col">
      <h2 id="augment-heading" className="text-xl">
        {selected.length === 0 ? 'Add your first augment' : 'Add another augment'}
      </h2>
      <div className="mt-3">
        <SearchField id="augment-search" label="Search augments" value={query} onChange={setQuery} placeholder="Search by name or effect" />
      </div>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Filter by rarity">
        {TIERS.map((t) => (
          <button key={t} type="button" className="chip" aria-pressed={tier === t} onClick={() => setTier(tier === t ? null : t)}>
            <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 rotate-45" style={{ background: TIER_COLOR[t] }} />
            {TIER_LABEL[t]}
          </button>
        ))}
      </div>
      <p className="label mt-4" aria-live="polite">
        {list.length} {list.length === 1 ? 'augment' : 'augments'}
      </p>

      {list.length === 0 ? (
        <div className="mt-2">
          <EmptyState title="No augment matches">
            <p>Try a shorter search, or clear the rarity filter.</p>
            <button
              type="button"
              className="btn btn-quiet mt-4"
              onClick={() => {
                setQuery('');
                setTier(null);
              }}
            >
              Clear filters
            </button>
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-2 max-h-[19rem] divide-y divide-line overflow-y-auto border-y border-line sm:max-h-[26rem] lg:max-h-[calc(100dvh-22rem)]" data-testid="augment-list">
          {list.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => onAdd(a.id)}
                data-augment={a.id}
                className="group flex w-full items-start gap-3 px-2 py-2.5 text-left transition-colors hover:bg-raised"
              >
                <GameImage src={a.iconUrl} name={a.name} size={40} frame={a.tier ? TIER_COLOR[a.tier] : undefined} decorative glyph />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="font-medium text-ink group-hover:text-gold">{a.name}</span>
                    {a.tier && (
                      <span className="font-condensed text-xs font-semibold uppercase tracking-wider" style={{ color: TIER_COLOR[a.tier] }}>
                        {TIER_LABEL[a.tier]}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-soft">
                    {a.description || 'No description in the current game data.'}
                  </span>
                </span>
                <Icon name="plus" className="mt-2.5 shrink-0 text-faint group-hover:text-gold" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm text-faint">
        "X" marks a number the public game data does not resolve. We show the gap instead of guessing.
      </p>
    </section>
  );
}
