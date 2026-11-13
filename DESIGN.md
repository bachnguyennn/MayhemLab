# Mayhem Lab — Design System

Source of truth: `apps/web/src/styles.css` (tokens and component classes).

## World

Fantasy-tech in the League tradition, held to four contributions on a working tool: type, palette,
density, and one signature move. Layout and controls are standard web patterns.

## Type

- Display: **Marcellus** (flared roman, single weight). Headings only.
- Body: **Barlow** 400 / 500 / 600.
- Labels, chips, buttons, item captions: **Barlow Semi Condensed** 500 / 600.
- Self-hosted through `@fontsource`. No system display faces. Numerals are tabular.

## Colour (OKLCH)

| Token | Value | Use |
| --- | --- | --- |
| `ground` | 0.155 0.02 250 | page |
| `panel` / `raised` | 0.195 / 0.235 | session bar, footer / hover, image wells |
| `line` / `line-strong` | 0.32 / 0.44 | rules / control borders |
| `ink` / `soft` / `faint` | 0.94 / 0.80 / 0.68 | text, tinted toward the ground hue, all ≥ 4.5:1 |
| `gold` | 0.81 0.10 85 | primary action, current nav, strong fit, core item rail |
| `azure` | 0.77 0.11 225 | links, focus ring, good fit |
| `good` / `bad` | 0.82 0.13 165 / 0.76 0.15 30 | augment helps / works against |
| `silver` / `prismatic` | rarity frames (with `gold`) |

Colour always carries meaning: rarity, fit, interaction direction, or action.

## Signature move

The **cut frame**: every piece of game imagery (champions, items, augment monograms) sits in a
chamfered octagon (`.cut`), with a 1px edge whose colour encodes meaning (gold for the selected
champion and core items, rarity colour for augments). Core items are joined by a thin gold rail
to read as a path.

## Layout

- Explorer: session bar across the top; augment picker in a sticky left column; results on the
  right as full-width rows separated by rules. No cards-in-cards; no modals.
- One column below `lg`. Touch targets ≥ 44px. Works from 360px.

## Motion

One authored moment: results settle in (opacity + 6px rise, expo ease-out, 45ms stagger) when
the selection changes. Removed under `prefers-reduced-motion`.

## Voice

Plain, direct, League terms used correctly. No exclamation marks. Controls name their action.
Empty and error states say what happened and how to recover.
