import { Component, useEffect, useMemo, useState, type ReactNode } from 'react';
import { snapshot, validateDataset } from '@mayhem-lab/game-data';
import { recommend } from '@mayhem-lab/recommender';
import { AugmentPicker } from './components/AugmentPicker';
import { ChampionPicker } from './components/ChampionPicker';
import { Loadout } from './components/Loadout';
import { Footer, Landing, PatchPage } from './components/Pages';
import { Playstyles } from './components/Playstyles';
import { EmptyState } from './components/ui';
import { provider, restoreNotice, useGameState, useRoute } from './session';

const datasetIssues = validateDataset(snapshot);

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState title="Something broke on this screen">
          <p>Your session is saved. Reloading usually fixes it; if it keeps happening, start a new session.</p>
          <div className="mt-4 flex justify-center gap-2">
            <button type="button" className="btn" onClick={() => location.reload()}>
              Reload
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                provider.reset();
                location.hash = '#/explore';
                location.reload();
              }}
            >
              New session
            </button>
          </div>
        </EmptyState>
      </div>
    );
  }
}

function Header({ page }: { page: string }) {
  const link = (href: string, label: string, active: boolean) => (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 items-center whitespace-nowrap border-b-2 px-1 font-condensed font-semibold tracking-wide transition-colors ${
        active ? 'border-gold text-gold' : 'border-transparent text-soft hover:text-ink'
      }`}
    >
      {label}
    </a>
  );
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ground/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:gap-8 sm:px-6">
        <a href="#/" className="flex min-h-14 items-center gap-2.5" aria-label="Mayhem Lab home">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
            <path d="M9 2h14l7 7v14l-7 7H9l-7-7V9z" fill="none" stroke="var(--color-gold)" strokeWidth="2" />
            <path d="M9 22V10l7 8 7-8v12" fill="none" stroke="var(--color-gold)" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <span className="whitespace-nowrap font-display text-xl tracking-wide">Mayhem Lab</span>
        </a>
        <nav aria-label="Main" className="flex gap-4 sm:gap-6">
          {link('#/explore', 'Explorer', page === 'explore')}
          {link('#/patch', 'Data', page === 'patch')}
        </nav>
        <a href="#/patch" className="ml-auto hidden font-condensed text-sm text-soft hover:text-ink sm:block" data-testid="patch-chip">
          Patch <span className="font-semibold text-ink">{snapshot.manifest.patch}</span>
        </a>
      </div>
    </header>
  );
}

function Explorer() {
  const state = useGameState();
  const [ready, setReady] = useState(false);
  // The dataset is bundled, so there is no network wait; one frame lets the shell paint first.
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const result = useMemo(() => recommend(state, snapshot), [state]);

  if (datasetIssues.length > 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState title="The game data failed validation">
          <p>
            {datasetIssues.length} problem{datasetIssues.length === 1 ? '' : 's'} found in the bundled dataset, so recommendations are switched
            off rather than risk showing wrong information. First problem: {datasetIssues[0]!.entity} {datasetIssues[0]!.id},{' '}
            {datasetIssues[0]!.problem}.
          </p>
        </EmptyState>
      </div>
    );
  }
  if (!ready) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6" role="status" aria-live="polite">
        <p className="text-soft">Loading game data…</p>
      </div>
    );
  }
  if (!state.championId) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {restoreNotice && (
          <p role="status" className="mb-6 border border-line bg-panel px-4 py-3 text-soft" data-testid="restore-notice">
            {restoreNotice}
          </p>
        )}
        <ChampionPicker onPick={(id) => provider.setChampion(id)} />
      </div>
    );
  }
  return (
    <>
      <Loadout state={state} />
      <div className="mx-auto grid max-w-7xl gap-x-10 gap-y-10 px-4 py-8 sm:px-6 lg:grid-cols-[22rem_1fr]">
        <div className="lg:sticky lg:top-20 lg:self-start">
          <AugmentPicker selected={state.selectedAugmentIds} onAdd={(id) => provider.addAugment(id)} />
        </div>
        <Playstyles result={result} onAddAugment={(id) => provider.addAugment(id)} />
      </div>
    </>
  );
}

export function App() {
  const page = useRoute();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      page === 'explore' ? 'Build explorer — Mayhem Lab' : page === 'patch' ? 'Patch and data — Mayhem Lab' : 'Mayhem Lab — ARAM: Mayhem build explorer';
  }, [page]);
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-30 focus:bg-gold focus:px-3 focus:py-2 focus:text-ground">
        Skip to content
      </a>
      <Header page={page} />
      <main id="main" className="flex-1" tabIndex={-1}>
        <ErrorBoundary key={page}>{page === 'explore' ? <Explorer /> : page === 'patch' ? <PatchPage /> : <Landing />}</ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
