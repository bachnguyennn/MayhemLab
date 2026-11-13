# Design review — 2026-11-13

Method: Impeccable 4.8.2 installed with `npx impeccable install --no-hooks` (hooks were declined
so no unreviewed scripts run on edit). `PRODUCT.md` written first; build followed the Operate-mode
and craft-floor references; the deterministic detector and axe-core were run on the result.

**Honest scope note**: Impeccable's world-discovery step asks for an interview with the product
owner, and its `critique` command is an interactive review. Neither was run with the owner. The
visual direction came from the written brief, and the heuristic review below is a self-review by
the implementer. An owner-led `critique` is open as task T037.

## Automated results

| Check | Result |
| --- | --- |
| `impeccable detect --json apps/web/src` | 0 findings |
| axe-core WCAG 2.1 A/AA on landing, picker, results, patch page (desktop + mobile) | 0 serious or critical violations |
| Horizontal overflow at 360px | none |
| Keyboard-only champion and augment selection | passes |

## Findings from looking at the rendered screens

| # | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| 1 | P0 | Augment icons rendered as empty frames: the public icon files for the Mayhem set are blank | Replaced with rarity-framed monograms |
| 2 | P1 | Header wrapped onto two lines at 390px | Shortened nav label to "Data", no-wrap on brand and links |
| 3 | P1 | Landing example link had an `aria-label` that hid its visible text from assistive tech | Removed the label |
| 4 | P2 | On phones the augment list pushed results far down | List height capped at 19rem below `sm` |
| 5 | P2 | Clipboard failure fell back to a blocking browser prompt | Replaced with an inline message |

## Open items

- Results sit below the augment picker on phones; a results-first layout with the picker in a
  drawer may serve the "seconds, not minutes" use case better. Needs testing with players.
- Augment monograms are a stand-in. Real augment art would improve scanning.
- Main JS bundle is 514 kB (121 kB gzip) because the snapshot is bundled (T038).
