import { useDeferredValue, useMemo, useState } from 'react';
import { snapshot } from '@mayhem-lab/game-data';
import { EmptyState, GameImage, SearchField } from './ui';

const ROLES = ['Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank'];
const fold = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export function ChampionPicker({ onPick }: { onPick: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<string | null>(null);
  const deferred = useDeferredValue(query);

  const list = useMemo(() => {
    const q = fold(deferred);
    return snapshot.champions.filter((c) => (!role || c.roles.includes(role)) && (!q || fold(c.name).includes(q) || fold(c.id).includes(q)));
  }, [deferred, role]);

  return (
    <section aria-labelledby="champ-heading">
      <h1 id="champ-heading" className="text-3xl sm:text-4xl">
        Who are you playing?
      </h1>
      <p className="mt-2 max-w-[60ch] text-soft">Pick your champion to see which playstyles suit them, then add augments as you take them.</p>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="lg:w-80">
          <SearchField id="champion-search" label="Search champions" value={query} onChange={setQuery} placeholder="Search champions" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by class">
          {ROLES.map((r) => (
            <button key={r} type="button" className="chip" aria-pressed={role === r} onClick={() => setRole(role === r ? null : r)}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <p className="label mt-5" aria-live="polite">
        {list.length} {list.length === 1 ? 'champion' : 'champions'}
      </p>

      {list.length === 0 ? (
        <div className="mt-3">
          <EmptyState title="No champion matches that search">
            <p>Check the spelling, or clear the search and class filter.</p>
            <button
              type="button"
              className="btn btn-quiet mt-4"
              onClick={() => {
                setQuery('');
                setRole(null);
              }}
            >
              Clear filters
            </button>
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-x-2 gap-y-4" data-testid="champion-grid">
          {list.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onPick(c.id)}
                className="group flex w-full flex-col items-center gap-1.5 px-1 py-1 text-center"
                data-champion={c.id}
              >
                <span className="transition-transform duration-200 ease-(--ease-out-expo) group-hover:-translate-y-0.5">
                  <GameImage src={c.imageUrl} name={c.name} size={68} decorative />
                </span>
                <span className="font-condensed text-[0.9rem] font-medium leading-tight text-soft group-hover:text-gold">{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
