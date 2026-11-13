import { Fragment, useState } from 'react';
import type { BuildRecommendation, ChangeNote, FitLevel, ItemRef, RecommendationResult } from '@mayhem-lab/contracts';
import { EmptyState, GameImage, Icon, TIER_COLOR } from './ui';

const FIT: Record<FitLevel, { label: string; color: string; pips: number }> = {
  strong: { label: 'Strong fit', color: 'var(--color-gold)', pips: 3 },
  good: { label: 'Good fit', color: 'var(--color-azure)', pips: 2 },
  possible: { label: 'Possible', color: 'var(--color-soft)', pips: 1 },
};

const DAMAGE: Record<BuildRecommendation['damageType'], string> = {
  physical: 'Physical damage',
  magic: 'Magic damage',
  mixed: 'Mixed damage',
  utility: 'Utility',
};

function FitBadge({ fit }: { fit: FitLevel }) {
  const f = FIT[fit];
  return (
    <span className="inline-flex items-center gap-2 font-condensed text-sm font-semibold uppercase tracking-wider" style={{ color: f.color }}>
      <span aria-hidden="true" className="flex gap-0.5">
        {[1, 2, 3].map((n) => (
          <span key={n} className="h-2.5 w-2.5 rotate-45 border" style={{ borderColor: f.color, background: n <= f.pips ? f.color : 'transparent' }} />
        ))}
      </span>
      {f.label}
    </span>
  );
}

/** The item path: boots, then core items in purchase order, joined by a rail. */
function ItemPath({ boots, core }: { boots: ItemRef[]; core: ItemRef[] }) {
  return (
    <div className="flex flex-wrap items-start gap-y-3">
      {core.map((item, i) => (
        <Fragment key={item.id}>
          {i > 0 && <span aria-hidden="true" className="mt-[23px] h-px w-3 bg-gold-deep sm:w-5" />}
          <figure className="flex w-[4.5rem] flex-col items-center gap-1 text-center">
            <GameImage src={item.imageUrl} name={item.name} size={48} frame="var(--color-gold-deep)" decorative />
            <figcaption className="font-condensed text-[0.8rem] leading-tight text-soft">
              <span className="sr-only">Core item {i + 1}: </span>
              {item.name}
            </figcaption>
          </figure>
        </Fragment>
      ))}
      {boots.length > 0 && (
        <div className="ml-3 flex items-start gap-2 border-l border-line pl-3 sm:ml-5 sm:pl-5">
          {boots.map((b, i) => (
            <Fragment key={b.id}>
              {i > 0 && <span className="mt-3.5 font-condensed text-sm text-faint">or</span>}
              <figure className="flex w-[4.5rem] flex-col items-center gap-1 text-center">
                <GameImage src={b.imageUrl} name={b.name} size={48} decorative />
                <figcaption className="font-condensed text-[0.8rem] leading-tight text-soft">{b.name}</figcaption>
              </figure>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

function Interactions({ rec }: { rec: BuildRecommendation }) {
  if (rec.interactions.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {rec.interactions.map((i) => {
        const tone = i.kind === 'synergy' ? 'text-good' : i.kind === 'conflict' ? 'text-bad' : 'text-faint';
        const word = i.kind === 'synergy' ? 'Helps' : i.kind === 'conflict' ? 'Works against' : 'Neutral';
        return (
          <li key={i.augmentId} className="flex gap-2 text-[0.95rem]" data-interaction={i.kind}>
            <Icon name={i.kind === 'synergy' ? 'up' : i.kind === 'conflict' ? 'down' : 'dot'} size={16} className={`mt-1 shrink-0 ${tone}`} />
            <span>
              <span className="font-medium text-ink">{i.augmentName}</span>{' '}
              <span className={`font-condensed text-sm font-semibold uppercase tracking-wide ${tone}`}>{word}</span>
              <span className="text-soft">: {i.reasons.slice(0, 3).join('; ')}.</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Detail({ rec, onAddAugment }: { rec: BuildRecommendation; onAddAugment: (id: string) => void }) {
  return (
    <div className="mt-5 grid gap-x-10 gap-y-7 border-t border-line pt-5 md:grid-cols-2">
      <div>
        <h4 className="label">Why this suits the champion</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-soft marker:text-gold-deep">
          {rec.championReasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="label">Strengths</h4>
          <ul className="mt-2 space-y-1 text-soft">
            {rec.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="label">Weaknesses</h4>
          <ul className="mt-2 space-y-1 text-soft">
            {rec.weaknesses.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="md:col-span-2">
        <h4 className="label">Situational items</h4>
        <ul className="mt-2 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
          {rec.situationalItems.map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              <GameImage src={s.imageUrl} name={s.name} size={36} decorative />
              <span className="min-w-0 text-[0.95rem]">
                <span className="font-medium text-ink">{s.name}</span>
                <span className="block text-sm text-soft">{s.reason}</span>
              </span>
            </li>
          ))}
        </ul>
        {rec.unavailableItems.length > 0 && (
          <p className="mt-3 text-sm text-faint">Not in this patch and left out: {rec.unavailableItems.join(', ')}.</p>
        )}
      </div>

      {rec.augmentsToConsider.length > 0 && (
        <div className="md:col-span-2">
          <h4 className="label">Augments that would deepen this build if offered</h4>
          <ul className="mt-2 flex flex-wrap gap-2">
            {rec.augmentsToConsider.map((a) => (
              <li key={a.augmentId}>
                <button
                  type="button"
                  className="chip"
                  title={`${a.reasons.slice(0, 2).join('; ')}. Select to add it to your session.`}
                  onClick={() => onAddAugment(a.augmentId)}
                >
                  <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 rotate-45" style={{ background: a.tier ? TIER_COLOR[a.tier] : 'var(--color-faint)' }} />
                  {a.augmentName}
                  <span className="sr-only">: add to session</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-faint">Listed alphabetically within rule strength. These are options, not instructions.</p>
        </div>
      )}

      <p className="text-sm text-faint md:col-span-2">
        Limits: this playstyle is a curated outline matched by rules to champion and augment text for game data {rec.patch}. It does not know
        your team, the enemy team, or match results. {rec.statistics.reason}
      </p>
    </div>
  );
}

function PlaystyleRow({ rec, rank, onAddAugment }: { rec: BuildRecommendation; rank: number; onAddAugment: (id: string) => void }) {
  const [open, setOpen] = useState(rank === 0);
  const id = `detail-${rec.playstyleId}`;
  return (
    <li className="settle border-t border-line py-6 first:border-t-0 first:pt-2" style={{ animationDelay: `${rank * 45}ms` }} data-playstyle={rec.playstyleId}>
      <article aria-labelledby={`title-${rec.playstyleId}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 id={`title-${rec.playstyleId}`} className="text-2xl">
            {rec.name}
          </h3>
          <div className="flex items-center gap-4">
            <span className="font-condensed text-sm text-faint">{DAMAGE[rec.damageType]}</span>
            <FitBadge fit={rec.fit} />
          </div>
        </div>
        <p className="mt-1 max-w-[70ch] text-soft">{rec.summary}</p>

        <div className="mt-4">
          <ItemPath boots={rec.boots} core={rec.coreItems} />
        </div>

        {rec.interactions.length > 0 && (
          <div className="mt-4">
            <Interactions rec={rec} />
          </div>
        )}

        <button type="button" className="btn btn-quiet mt-4" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
          {open ? 'Hide full build' : 'Show full build'}
          <Icon name="chevron" size={16} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
        <div id={id} hidden={!open}>
          {open && <Detail rec={rec} onAddAugment={onAddAugment} />}
        </div>
      </article>
    </li>
  );
}

const CHANGE_TONE: Record<ChangeNote['kind'], string> = {
  initial: 'var(--color-line-strong)',
  reinforced: 'var(--color-good)',
  pivot: 'var(--color-gold)',
  hybrid: 'var(--color-azure)',
  'no-modelled-interaction': 'var(--color-faint)',
  unchanged: 'var(--color-line-strong)',
};
const CHANGE_TITLE: Record<ChangeNote['kind'], string> = {
  initial: 'Starting points',
  reinforced: 'Direction holds',
  pivot: 'New direction worth a look',
  hybrid: 'Hybrid available',
  'no-modelled-interaction': 'Nothing moved',
  unchanged: 'No change in order',
};

export function Playstyles({ result, onAddAugment }: { result: RecommendationResult; onAddAugment: (id: string) => void }) {
  if (result.status !== 'ok') {
    return (
      <EmptyState title={result.status === 'no-compatible-playstyle' ? 'No modelled playstyle fits' : 'Nothing to show yet'}>
        <p>{result.message}</p>
      </EmptyState>
    );
  }
  return (
    <section aria-labelledby="results-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="results-heading" className="text-xl">
          {result.recommendations.length} {result.recommendations.length === 1 ? 'playstyle' : 'playstyles'} to explore
        </h2>
        <p className="font-condensed text-sm text-faint">Ordered by rule-based fit. Not win rates.</p>
      </div>

      <div
        role="status"
        aria-live="polite"
        key={result.change.message}
        data-testid="change-note"
        data-change={result.change.kind}
        className="settle mt-3 border border-line bg-panel px-4 py-3"
        style={{ borderTopColor: CHANGE_TONE[result.change.kind], borderTopWidth: 2 }}
      >
        <p className="label" style={{ color: CHANGE_TONE[result.change.kind] === 'var(--color-line-strong)' ? undefined : CHANGE_TONE[result.change.kind] }}>
          {CHANGE_TITLE[result.change.kind]}
        </p>
        <p className="mt-0.5 text-ink">{result.change.message}</p>
      </div>

      {result.warnings.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-faint" data-testid="warnings">
          {result.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <ol className="mt-4" key={result.recommendations.map((r) => r.playstyleId + r.compatibility).join('|')} data-testid="playstyle-list">
        {result.recommendations.map((rec, i) => (
          <PlaystyleRow key={rec.playstyleId} rec={rec} rank={i} onAddAugment={onAddAugment} />
        ))}
      </ol>
    </section>
  );
}
