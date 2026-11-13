# Mayhem Lab — Product Context

## What it is

A free, fan-made build explorer for League of Legends ARAM: Mayhem. A player picks their champion
and the augments they have taken; the site shows several complete playstyles (item path,
situational items, how each augment interacts, strengths, weaknesses) and re-evaluates as augments
are added.

## Who it is for

ARAM: Mayhem players, mid-game or between games, often alt-tabbed or on a second screen or phone.
They know League vocabulary. They have seconds, not minutes: an augment choice is on a timer.

## What it must do

1. Champion → augment → playstyles in three selections or fewer.
2. Make "what changed when I added this augment" obvious.
3. Show several options with reasons. Never dictate a single choice.
4. Be honest: no win rates, no tiers, no invented numbers. Fit labels are rule-derived
   compatibility, and the site says so.

## Voice

Direct, knowledgeable, calm. A well-read teammate, not a hype caster. Plain sentences, League
terms used correctly, no exclamation marks, no marketing superlatives.

## Visual direction

League-inspired fantasy-tech without copying Riot's client: dark, high-contrast, restrained gold
and blue accents, strong hierarchy, champion and item imagery doing the visual work. No heavy
gradients, glow, glassmorphism, or generic dashboard widgets. Motion only where it explains a
change.

## Constraints

- Static site, $0 hosting, no accounts, no tracking.
- WCAG 2.1 AA, keyboard operable, 360px and up, reduced-motion respected.
- Riot assets used under the Legal Jibber Jabber policy with the required disclaimer.
- Must not display augment win rates or win-rate-derived tiers (Riot policy).

## Surfaces

- Landing (Persuade, brief): what it is, one action to start.
- Explorer (Operate): champion picker, augment picker, playstyle results, playstyle detail.
- Patch and data (Read): versions, sources, licences, changelog, limitations.
