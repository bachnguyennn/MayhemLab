import { useState, type ReactNode } from 'react';
import type { AugmentTier } from '@mayhem-lab/contracts';

/** Game image in the cut frame. Falls back to initials if the asset fails to load. */
export function GameImage({
  src,
  name,
  size,
  frame,
  decorative = false,
  glyph = false,
}: {
  src?: string;
  name: string;
  size: number;
  frame?: string;
  decorative?: boolean;
  /**
   * Augment tile. The public augment icon files for the Mayhem set are blank placeholders, so
   * augments are drawn as a rarity-framed monogram instead of an empty image.
   */
  glyph?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/[\s'-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  const cut = size >= 72 ? 'cut-lg' : size <= 36 ? 'cut-sm' : '';
  return (
    <span
      className={`cut cut-frame ${cut} inline-block shrink-0 align-middle`}
      style={{ width: size, height: size, ['--frame' as string]: frame ?? 'var(--color-line-strong)' }}
    >
      {src && !failed && !glyph ? (
        <img
          src={src}
          alt={decorative ? '' : name}
          width={size - 2}
          height={size - 2}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={`cut ${cut} block h-full w-full bg-raised object-cover`}
        />
      ) : (
        <span
          role={decorative ? undefined : 'img'}
          aria-label={decorative ? undefined : name}
          aria-hidden={decorative || undefined}
          className={`cut ${cut} flex h-full w-full items-center justify-center bg-raised font-condensed font-semibold text-soft`}
          style={{ fontSize: Math.max(11, size * 0.32), color: glyph ? frame : undefined }}
        >
          {initials}
        </span>
      )}
    </span>
  );
}

export const TIER_COLOR: Record<AugmentTier, string> = {
  silver: 'var(--color-silver)',
  gold: 'var(--color-gold)',
  prismatic: 'var(--color-prismatic)',
};
export const TIER_LABEL: Record<AugmentTier, string> = { silver: 'Silver', gold: 'Gold', prismatic: 'Prismatic' };

const paths = {
  search: <path d="M10.5 3a7.5 7.5 0 1 0 4.55 13.46l4.24 4.25 1.42-1.42-4.25-4.24A7.5 7.5 0 0 0 10.5 3Zm0 2a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z" />,
  close: <path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z" />,
  plus: <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" />,
  chevron: <path d="m6.7 8.3 5.3 5.3 5.3-5.3 1.4 1.4-6.7 6.7-6.7-6.7 1.4-1.4Z" />,
  arrow: <path d="M13.3 5.3 20 12l-6.7 6.7-1.4-1.4 4.3-4.3H4v-2h12.2l-4.3-4.3 1.4-1.4Z" />,
  up: <path d="M12 5 5 12l1.4 1.4L11 8.8V19h2V8.8l4.6 4.6L19 12l-7-7Z" />,
  down: <path d="m12 19 7-7-1.4-1.4L13 15.2V5h-2v10.2l-4.6-4.6L5 12l7 7Z" />,
  dot: <circle cx="12" cy="12" r="4" />,
  link: <path d="M10.6 13.4a3 3 0 0 0 4.2 0l3.6-3.6a3 3 0 0 0-4.2-4.2l-1 1-1.4-1.4 1-1a5 5 0 0 1 7 7l-3.6 3.6a5 5 0 0 1-7 0l1.4-1.4Zm2.8-2.8a3 3 0 0 0-4.2 0l-3.6 3.6a3 3 0 0 0 4.2 4.2l1-1 1.4 1.4-1 1a5 5 0 0 1-7-7l3.6-3.6a5 5 0 0 1 7 0l-1.4 1.4Z" />,
};

export function Icon({ name, size = 18, className }: { name: keyof typeof paths; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" className={className}>
      {paths[name]}
    </svg>
  );
}

export function SearchField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
      <input
        id={id}
        type="search"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="field"
      />
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-dashed border-line px-5 py-10 text-center">
      <p className="font-display text-xl text-ink">{title}</p>
      <div className="mx-auto mt-2 max-w-[48ch] text-soft">{children}</div>
    </div>
  );
}
