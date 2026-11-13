import { useMemo } from 'react';
import type { EntityDiff } from '@mayhem-lab/contracts';
import { RIOT_DISCLAIMER, STATISTICS_UNAVAILABLE_REASON } from '@mayhem-lab/contracts';
import { snapshot, snapshotAgeDays } from '@mayhem-lab/game-data';
import { FIT_THRESHOLDS, PLAYSTYLES, recommend } from '@mayhem-lab/recommender';
import { GameImage, Icon, TIER_COLOR } from './ui';

const m = snapshot.manifest;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

export function Landing() {
  // A real engine result, not a mock-up: Jinx with one attack-speed augment.
  const example = useMemo(() => {
    const champion = snapshot.champions.find((c) => c.id === 'Jinx') ?? snapshot.champions[0]!;
    const augment = snapshot.augments.find((a) => a.name === 'Deft') ?? snapshot.augments.find((a) => a.tags.includes('attack-speed'));
    const result = recommend({ championId: champion.id, patch: m.dataDragonVersion, selectedAugmentIds: augment ? [augment.id] : [] }, snapshot);
    return { champion, augment, result };
  }, []);
  const recs = example.result.status === 'ok' ? example.result.recommendations.slice(0, 3) : [];
  const href = `#/explore?c=${example.champion.id}${example.augment ? `&a=${example.augment.id}` : ''}`;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="grid gap-10 py-12 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <h1 className="text-[clamp(2.4rem,6vw,4.25rem)] leading-[1.05]">
            You took the augment. <span className="text-gold">Now what do you build?</span>
          </h1>
          <p className="mt-5 max-w-[56ch] text-lg text-soft">
            Mayhem Lab maps your champion and augments in ARAM: Mayhem to complete playstyles: the item path, the situational picks, and how
            each augment helps or hurts. Add another augment and the picture updates.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#/explore" className="btn btn-primary cut cut-sm px-6 text-lg" data-testid="start">
              Open the build explorer
              <Icon name="arrow" />
            </a>
            <span className="font-condensed text-faint">Free. No account. Patch {m.patch}.</span>
          </div>
        </div>

        <a href={href} className="group block border border-line bg-panel p-5 transition-colors hover:border-gold-deep sm:p-6">
          <p className="label">Live example from the engine</p>
          <div className="mt-3 flex items-center gap-3">
            <GameImage src={example.champion.imageUrl} name={example.champion.name} size={56} frame="var(--color-gold)" decorative />
            <Icon name="plus" className="text-faint" />
            {example.augment && (
              <GameImage src={example.augment.iconUrl} name={example.augment.name} size={44} frame={example.augment.tier ? TIER_COLOR[example.augment.tier] : undefined} decorative glyph />
            )}
            <p className="font-display text-xl">
              {example.champion.name}
              {example.augment && <span className="text-soft"> with {example.augment.name}</span>}
            </p>
          </div>
          <ol className="mt-4 divide-y divide-line border-t border-line">
            {recs.map((r) => (
              <li key={r.playstyleId} className="flex items-center justify-between gap-3 py-3">
                <span className="min-w-0">
                  <span className="block font-medium">{r.name}</span>
                  <span className="block truncate text-sm text-soft">{r.coreItems.map((i) => i.name).join(' → ')}</span>
                </span>
                <span className="flex shrink-0 -space-x-1">
                  {r.coreItems.slice(0, 3).map((i) => (
                    <GameImage key={i.id} src={i.imageUrl} name={i.name} size={34} decorative />
                  ))}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 flex items-center gap-2 font-condensed text-sm font-semibold text-gold">
            See the full builds <Icon name="arrow" size={16} className="transition-transform group-hover:translate-x-1" />
          </p>
        </a>
      </section>

      <section className="grid gap-x-12 gap-y-8 border-t border-line py-12 md:grid-cols-3" aria-label="How it works">
        <div>
          <h2 className="text-2xl">Whole playstyles, not single cards</h2>
          <p className="mt-2 text-soft">
            {PLAYSTYLES.length} build archetypes, from crit carry to enchanter. Each comes with a core path, situational items with the reason
            to buy them, strengths, and weaknesses.
          </p>
        </div>
        <div>
          <h2 className="text-2xl">It keeps up with your picks</h2>
          <p className="mt-2 text-soft">
            Your first augment sets a direction; it never locks you in. Every augment you add is weighed against every playstyle, and you are
            told what changed.
          </p>
        </div>
        <div>
          <h2 className="text-2xl">Several options, with reasons</h2>
          <p className="mt-2 text-soft">
            You see every playstyle that fits and why. The decision stays yours. Nothing here tells you what to pick.
          </p>
        </div>
      </section>

      <section className="border-t border-line py-12" aria-labelledby="honest-heading">
        <h2 id="honest-heading" className="text-3xl">
          What you will not find here
        </h2>
        <div className="mt-4 grid gap-x-12 gap-y-4 md:grid-cols-2">
          <p className="max-w-[60ch] text-soft">
            <strong className="font-semibold text-ink">No win rates and no tier list.</strong> {STATISTICS_UNAVAILABLE_REASON} We would rather
            show nothing than invent a number.
          </p>
          <p className="max-w-[60ch] text-soft">
            <strong className="font-semibold text-ink">Fit labels are rules, not results.</strong> "Strong fit" means the champion's kit and
            your augments line up with a playstyle under documented rules. It is not a measure of how often the build wins.{' '}
            <a href="#/patch" className="text-azure underline">
              See the data and the method
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

function Diff({ label, d }: { label: string; d?: EntityDiff }) {
  if (!d || d.added.length + d.removed.length + d.renamed.length === 0) return null;
  return (
    <div className="mt-2 text-sm text-soft">
      <span className="font-medium text-ink">{label}:</span>
      {d.added.length > 0 && <> added {d.added.join(', ')}.</>}
      {d.removed.length > 0 && <> removed {d.removed.join(', ')}.</>}
      {d.renamed.length > 0 && <> renamed {d.renamed.join(', ')}.</>}
    </div>
  );
}

export function PatchPage() {
  const age = snapshotAgeDays(m);
  const facts: [string, string][] = [
    ['Game patch', m.patch],
    ['Data Dragon version', m.dataDragonVersion],
    ['CommunityDragon content', m.communityDragonContentVersion],
    ['Dataset built', `${fmtDate(m.generatedAt)} (${age === 0 ? 'today' : `${age} day${age === 1 ? '' : 's'} ago`})`],
    ['Champions', String(m.counts.champions)],
    ['Items on Howling Abyss', String(m.counts.items)],
    ['Mayhem augments', String(m.counts.augments)],
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-4xl">Patch and data</h1>
      <p className="mt-3 max-w-[68ch] text-soft">
        Everything on this site is built from one dated snapshot of public game data plus a set of written rules. This page says exactly which
        snapshot, where it came from, and what it cannot tell you.
      </p>

      {age > 21 && (
        <p role="alert" className="mt-5 border border-bad px-4 py-3 text-ink">
          This dataset is {age} days old and a newer patch has probably shipped. Item and augment details may be out of date.
        </p>
      )}

      <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 border-y border-line py-5" data-testid="patch-facts">
        {facts.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-soft">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-sm text-faint">{m.patchNote}</p>

      <h2 className="mt-12 text-2xl">Sources</h2>
      <ul className="mt-3 divide-y divide-line border-y border-line">
        {m.sources.map((s) => (
          <li key={s.id} className="py-3">
            <p className="font-medium">{s.name}</p>
            <p className="break-all text-sm">
              <a href={s.url} className="text-azure underline" rel="noreferrer">
                {s.url}
              </a>
            </p>
            <p className="mt-1 text-sm text-soft">
              Retrieved {fmtDate(s.retrievedAt)} · {s.licence}
            </p>
            <p className="break-all font-mono text-xs text-faint">sha256 {s.sha256}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 text-2xl">How playstyles are matched</h2>
      <div className="mt-3 max-w-[68ch] space-y-3 text-soft">
        <p>
          Champion traits and augment tags are derived from the game's own ability and augment text by keyword rules. Each of the{' '}
          {PLAYSTYLES.length} playstyles is a curated outline with rules that say which traits and tags support it and which work against it.
        </p>
        <p>
          The rule weights that match are added up. A total of {FIT_THRESHOLDS.strong} or more is labelled "Strong fit", {FIT_THRESHOLDS.good}{' '}
          or more "Good fit", and anything lower "Possible". One augment can move a playstyle by at most 3. These labels describe how well the
          text lines up. They are not performance ratings.
        </p>
      </div>

      <h2 className="mt-12 text-2xl">Known gaps</h2>
      <ul className="mt-3 max-w-[68ch] list-disc space-y-2 pl-5 text-soft marker:text-gold-deep">
        <li>{STATISTICS_UNAVAILABLE_REASON}</li>
        <li>
          {m.quality.unresolvedValues} augment descriptions contain numbers the public data does not resolve. They are shown as "X".
        </li>
        <li>
          {m.quality.arenaSharedDescriptions.length} augments reuse description text that the game shares with Arena. Their Mayhem numbers may
          differ.
        </li>
        {m.quality.missingDescriptions.length > 0 && (
          <li>No description text was found for: {m.quality.missingDescriptions.join(', ')}. They can be selected but have no modelled effect.</li>
        )}
        {m.quality.untagged.length > 0 && (
          <li>These augments have text but match no rule yet, so they do not move any playstyle: {m.quality.untagged.join(', ')}.</li>
        )}
        <li>Rules read text, not gameplay. Unusual champions can be matched to playstyles a seasoned player would rank differently.</li>
      </ul>

      <h2 className="mt-12 text-2xl">Dataset changelog</h2>
      <ol className="mt-3 divide-y divide-line border-y border-line">
        {m.changelog.map((c) => (
          <li key={`${c.from}-${c.to}`} className="py-3">
            <p className="font-medium">
              {c.from ? `${c.from} → ${c.to}` : c.to} <span className="font-normal text-faint">· {c.date}</span>
            </p>
            {c.note && <p className="text-sm text-soft">{c.note}</p>}
            <Diff label="Champions" d={c.champions} />
            <Diff label="Items" d={c.items} />
            <Diff label="Augments" d={c.augments} />
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-panel">
      <div className="mx-auto max-w-7xl space-y-3 px-4 py-8 text-sm text-soft sm:px-6">
        <p className="max-w-[90ch]" data-testid="riot-disclaimer">
          {RIOT_DISCLAIMER}
        </p>
        <p className="max-w-[90ch]">
          Mayhem Lab was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse
          or sponsor this project.
        </p>
        <p>
          Champion and item data and images: Riot Games Data Dragon. Augment names, icons and text: CommunityDragon. Game data{' '}
          {m.dataDragonVersion}, built {fmtDate(m.generatedAt)}.{' '}
          <a href="#/patch" className="text-azure underline">
            Sources and licences
          </a>
        </p>
      </div>
    </footer>
  );
}
