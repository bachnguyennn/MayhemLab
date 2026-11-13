import { useState } from 'react';
import type { GameState } from '@mayhem-lab/contracts';
import { snapshot } from '@mayhem-lab/game-data';
import { exploreHash, provider } from '../session';
import { GameImage, Icon, TIER_COLOR } from './ui';

const augmentById = new Map(snapshot.augments.map((a) => [a.id, a]));

/** The session at a glance: champion, ordered augment history, share and reset. */
export function Loadout({ state }: { state: GameState }) {
  const champion = snapshot.champions.find((c) => c.id === state.championId)!;
  const [shareLabel, setShareLabel] = useState('Copy link');

  const share = async () => {
    const url = `${location.origin}${location.pathname}${exploreHash(state)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareLabel('Link copied');
    } catch {
      // Clipboard blocked: the address bar already holds the same shareable link.
      setShareLabel('Copy it from the address bar');
    }
    setTimeout(() => setShareLabel('Copy link'), 2500);
  };

  return (
    <section aria-label="Your session" className="border-y border-line bg-panel">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <GameImage src={champion.imageUrl} name={champion.name} size={72} frame="var(--color-gold)" />
          <div className="min-w-0">
            <h1 className="text-2xl leading-tight sm:text-3xl" data-testid="session-champion">
              {champion.name}
            </h1>
            <p className="text-sm text-soft">
              {champion.roles.join(' · ')} · {champion.rangeType === 'ranged' ? 'Ranged' : 'Melee'}
            </p>
          </div>
        </div>

        <div className="min-w-0 flex-1 lg:border-l lg:border-line lg:pl-6">
          <p className="label">Augments taken, in order</p>
          {state.selectedAugmentIds.length === 0 ? (
            <p className="mt-1.5 text-soft">None yet. Results below are starting points for {champion.name}.</p>
          ) : (
            <ol className="mt-1.5 flex flex-wrap gap-2" data-testid="selected-augments">
              {state.selectedAugmentIds.map((id, i) => {
                const a = augmentById.get(id);
                if (!a) return null;
                return (
                  <li key={id} className="flex items-center gap-2 border border-line bg-ground py-1 pl-1 pr-1">
                    <span className="w-4 text-center font-condensed text-sm font-semibold text-faint" aria-hidden="true">
                      {i + 1}
                    </span>
                    <GameImage src={a.iconUrl} name={a.name} size={30} frame={a.tier ? TIER_COLOR[a.tier] : undefined} decorative glyph />
                    <span className="font-condensed font-medium">{a.name}</span>
                    <button
                      type="button"
                      onClick={() => provider.removeAugment(id)}
                      aria-label={`Remove ${a.name}`}
                      className="flex h-8 w-8 items-center justify-center text-faint hover:text-bad"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className="btn btn-quiet" onClick={share}>
            <Icon name="link" size={16} />
            <span aria-live="polite">{shareLabel}</span>
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => provider.setChampion(null)}>
            Change champion
          </button>
          <button type="button" className="btn btn-quiet" onClick={() => provider.reset()} data-testid="reset">
            New session
          </button>
        </div>
      </div>
    </section>
  );
}
