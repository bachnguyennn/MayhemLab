# Mayhem Lab — data feasibility study

Access date for every source: **2026-11-13**. Anything not confirmed from a page read on that date is marked **UNVERIFIED**. No Riot API key was used; nothing below comes from a live API call.

## Verdict

**No. A current-patch public ranking built on match statistics cannot be shipped today.** The blocker is both technical and legal, and each is sufficient alone:

1. **Technical:** Riot's public match-v5 API does not serve ARAM: Mayhem matches. They return 403 and are absent from players' match-ID lists. This is reported as intended, not a bug (section 1).
2. **Legal/policy:** Riot's LoL policy says "Products cannot display win rates for Augments or Arena Mode items." A playstyle tier derived from augment-conditioned win rates is very plausibly covered (section 3).

The only reuse-licensed dataset that respects that policy (arammayhem.com) contains pick rates only — enough for "popular", not for "best".

## 1. Riot API

### Queue and game mode constants (verified)

From `https://static.developer.riotgames.com/docs/lol/queues.json` (raw file downloaded, last entry of the file):

```json
{
    "queueId": 2400,
    "map": "Howling Abyss",
    "description": "ARAM: Mayhem",
    "notes": null
}
```

For comparison, same file:

```json
{ "queueId": 450,  "map": "Howling Abyss",  "description": "5v5 ARAM games", "notes": null }
{ "queueId": 1700, "map": "Rings of Wrath", "description": "Arena",          "notes": null }
{ "queueId": 2300, "map": "The Bandlewood", "description": "Brawl",          "notes": null }
```

`https://static.developer.riotgames.com/docs/lol/gameModes.json` has **no Mayhem-specific entry**. Its 22 entries end with `SWIFTPLAY` and `BRAWL`; the only ARAM entry is:

```json
{ "gameMode": "ARAM", "description": "ARAM games" }
```

- queueId 2400 = ARAM: Mayhem: **verified**. It was added on 2025-12-26 after a community report (developer-relations issue #1114); the reporter read the value from the local League client.
- The `gameMode` string Mayhem matches carry: **UNVERIFIED**. Community references to an internal name such as "KIWI" were not confirmed on any page read today. Filter on `queueId`, never on `gameMode`.

### Does match-v5 return Mayhem games? No.

Riot's docs pages do not say this anywhere; the evidence is the official issue tracker `RiotGames/developer-relations`:

- **#1109** "[BUG][LoL][match-v5] ARAM: Mayhem matches return 403 Forbidden" — opened 2025-10-22 by metasrc, closed 2025-12-18 as completed with label "closed: is working". Closing comment (lucasMesquitaBorges): "Expected behavior. Mayhem matches are private." The page does not badge anyone as Riot staff, but the same account closed #1109 and performed the `queues.json` update in #1114, so it acts as a maintainer.
- **#1114** — geozukunft, 2025-11-12: "Aram Mayhem data is restricted from match-v5".
- **#1154** "Release ARAM Mayhem match data on API without win/loss stats" — opened 2026-04-22, still open, no Riot reply. One commenter (geozukunft) claims authorised access to Mayhem games under rules agreed with Riot's Game Modes team; this is a private arrangement, unverifiable, and not available to us.
- **#1204** "Player-consented (RSO) access to ARAM: Mayhem matches" — opened 2026-10-28, still open: "These matches return 403 on match-v5 and don't appear in players' match ID lists at all". Community reply: "Mayhem is private because they don't want people generating win rates etc for their fun mode". No Riot reply.
- **#1147** — spectator-v5 reported as returning 404 for Mayhem on EUW while working on NA (open, 2026-03-25, unanswered).

Status as of two weeks ago (#1204) is unchanged. I did not call the API to confirm, per instructions.

### What match-v5 would expose if Mayhem were served

From `https://developer.riotgames.com/api-details/match-v5`:

| Need | Field | Status |
|---|---|---|
| Queue | `InfoDto.queueId` — "Refer to the Game Constants documentation." | documented |
| Patch | `InfoDto.gameVersion` — "The first two parts can be used to determine the patch a game was played on." | documented |
| Win/loss | `ParticipantDto.win` (boolean) | documented |
| Final items | `ParticipantDto.item0` … `item6` (int) | documented; final inventory only |
| Augments | `ParticipantDto.playerAugment1` … `playerAugment4`, plus `playerSubteamId`, `subteamPlacement` | documented (built for Arena) |
| Purchase order | `GET /lol/match/v5/matches/{matchId}/timeline` | endpoint documented; the reference lists `EventsTimeLineDto` with only `timestamp`, `realTimestamp`, `type` and no enumerated event types. `ITEM_PURCHASED` events: **UNVERIFIED** from today's reading |

- Only `playerAugment1..4` appear in the reference read today. `playerAugment5`/`6` are not in it; issue #1059 (2025-03-14) reports those two as "always 0".
- **Whether the augment fields are populated for Mayhem: UNVERIFIED and currently unobservable**, because the matches themselves are not served.
- Augment *offers* (what the player was shown and declined) are not in any documented field. This matters for bias — see `bias-and-interpretation.md`.
- Order in which augments were taken: not documented beyond the slot number. **UNVERIFIED** that slot order equals pick order.

Endpoints: `by-puuid/{puuid}/ids` (params `startTime`, `endTime`, `queue`, `type`, `start`, `count` 0–100, default 20), `matches/{matchId}`, `matches/{matchId}/timeline`, `matches/replays`.

## 2. Access limits

From `https://developer.riotgames.com/docs/portal`:

| Key | Rate limit | Conditions |
|---|---|---|
| Development | Not stated on the page (**UNVERIFIED**; commonly the same as personal) | "They also deactivate every 24 hours." For "products that are not meant for public consumption." |
| Personal | "20 requests every 1 second" and "100 requests every 2 minutes", per region | "Personal keys require a detailed description of the product." No verification, no rate-limit increases. **"You may not run your application for public consumption using a personal key."** "public consumption includes open alpha/beta tests" |
| Production | "500 requests every 10 seconds" and "30,000 requests every 10 minutes", per region | For "products that are intended for large communities or the Internet as a whole." "Typically requires a working prototype before receiving an API key." Reviewed by Developer Relations |

Also: "All products must be registered in, and audited by Riot Games through the Developer Portal" and "Any new features or changes to a product must be audited" (`/policies/general`). All keys are free; the cost is approval, not money.

Consequences for Mayhem Lab:

- A public website needs a **production key**. A personal key cannot back a public product, even in beta.
- Riot evaluates whether "the use case [is] good and approved". An application whose stated purpose is augment-conditioned rankings would be asking approval for something the game policy lists as unapproved.
- Crawl arithmetic, hypothetical: a personal key allows 100 req / 2 min = 72,000 requests/day per region. At one request per match (two with timeline) plus ID listing, that is roughly 35,000–65,000 matches/day/region. `bias-and-interpretation.md` puts the need at ~1.5 million matches per patch at minimum, i.e. more than a full patch cycle on one region. A production key (4.3 million requests/day/region) would be enough.
- Sampling players without a ranked ladder, hypothetical: seed PUUIDs from the ranked league endpoints or any known players, list their matches with `queue=2400`, then snowball through the other nine participants of each match. This oversamples heavy players and is biased towards the seed's skill band. It is **moot today**: Mayhem matches do not appear in match-ID lists.
- Bulk crawling for aggregate statistics is a normal, permitted pattern for standard queues. For Mayhem it is neither possible nor, for augment win rates, permitted.

Not viable workarounds:

- **Local client (LCU) match history.** Issue #1154 mentions tools reading the last ~200 games from a player's own client in an older data format. This yields only the installing user's games, needs a desktop app, is not match-v5, and its policy status for aggregation is **UNVERIFIED**. It cannot produce population statistics for a website.
- **Scraping other stats sites.** No licence, and it does not cure the policy problem.

## 3. Riot policy on augment statistics

Exact text, `https://developer.riotgames.com/docs/lol`, Game Policy, under the unapproved use cases (confirmed in the raw HTML):

> "Products cannot display win rates for Augments or Arena Mode items. This applies to all websites, applications and overlays."

Related, same section: "Products may not provide any game-session-specific information that would be previously unknown to the player."

`https://developer.riotgames.com/policies/general` contains no augment or win-rate language. Relevant lines there: "Products cannot create alternatives for official skill ranking systems such as the ranked ladder." and "Products cannot de-anonymize players who cannot reasonably be identified from visible information."

Does it cover playstyle tiers derived from augment-conditioned win rates?

- The sentence says "Augments", not "Arena augments"; only the item clause is limited to Arena. Mayhem augments fall within the plain wording.
- A tier is an ordinal encoding of a win rate. Showing "S/A/B" in place of "54.1%" discloses the same information at lower resolution. I judge it **plausibly covered, and almost certainly covered in spirit**. This is my reading, not a Riot ruling.
- Two independent parties read it the same way. arammayhem.com: "It does not include win rates, tiers, or rankings built from win rates.", stating that Riot asks developers not to publish Mayhem augment win rates. Riot's TFT precedent (via the Overwolf compliance guide) bans the adjacent metric as well: "Do not display Augment Win rates" and "Do not display Augment average game placements".
- The Brawl precedent shows how Riot treats withheld modes: "Riot Games does NOT approve any Brawl related data being aggregated or visible on third-party products/apps." (Overwolf guide). No equivalent published sentence for Mayhem was found; the Mayhem restriction is evidenced only by the API block and issue #1109.
- A playstyle defined by **items** conditioned on champion only is not literally within the sentence (the item clause is Arena-only). It is still blocked by lack of data, and a playstyle label that is a proxy for an augment set would be an evasion.
- Champion-level win rates in Mayhem: not named in the sentence; no public data source either way. Status **UNVERIFIED**.

Only Riot can give a definitive answer. The route is registering the product and asking in the application.

The Riot support-site copy of the LoL policy (`support-developer.riotgames.com/.../22698698001939`) returned HTTP 403 and was not read.

## 4. Third-party and community datasets

### arammayhem.com/data — usable, but pick rates only

- Per-patch JSON and CSV. Champions and augments: `pickRate`, `pickRateRank`, `previousPickRate`, `pickRateChange`, `pickRateRankChange`; augments add `rarity`, `introducedPatch`, `retiredPatch`, `presence`. Combos and items are catalogues without pick-rate fields. File metadata: `patch`, `statsDate`, `statsDateSource`.
- Coverage: patches 26.10–26.22 (26.17 missing from the table). Some stats dates are flagged as estimated.
- Sample size: **not stated**. "These statistics reflect the available ARAM: Mayhem match sample." They "do not cover every server". The upstream source is called only "the stats source" and is not named.
- Licence: **CC BY 4.0** — "You may use, copy, change and republish this data, including in commercial work." Attribution "Data: arammayhem.com" with a link.
- "It does not include win rates, tiers, or rankings built from win rates." "The data comes as is. It can contain mistakes, and a patch file can be corrected later." "arammayhem.com isn't endorsed by Riot Games."
- Assessment: licence-clean and policy-clean. Supports popularity views. Cannot support a strength ranking, and with no stated sample size it cannot support confidence intervals. Whether the latest file matches the live patch today was not checked.

### github.com/czgreat/aramhex-data — do not use

- Aggregated champion win rates and champion × augment win rates (`games`, `wins`, `win_rate`, `low_sample`), plus item and spell tables and skill-band splits. No match-level rows.
- **Chinese servers only**, labelled with a 16.x version scheme. Stated valid-match counts: 16.22 — 19,790,148 (2026-11-05 to 11-09); 16.21 — 42,169,050; 16.20 — 50,570,166; 16.19 — 20,357,328.
- Collection method **not stated**. The README says it covers some matches, not the whole server, and that holding an augment is correlated with winning, not a cause of it.
- Licence: CC BY-NC 4.0. "本项目和腾讯、Riot Games 没有关系。" (not affiliated with Tencent or Riot).
- Assessment: the size is what the problem needs, but (a) displaying it is exactly what Riot's sentence prohibits; (b) provenance is undisclosed, so the repository owner's right to license it is unknown — a CC licence cannot grant rights the licensor does not hold; (c) the Chinese server has a different player population and possibly a different patch state from Riot-operated regions. It proves the estimation is statistically feasible with ~20 million matches per patch; it does not make it permitted.

### metasrc.com — exists, not reusable

Search snippets show per-champion Mayhem pages with win rates and game counts (for example "9,092 Pyke games"). The site returned HTTP 403 to my fetch, so content, source and terms are **UNVERIFIED**. metasrc is the account that filed #1109, so its access path is unclear; issue #1154 indicates some sites hold private arrangements with Riot. No download, no licence. A site showing something is not evidence that we may.

### Others

- Kaggle: no ARAM: Mayhem dataset found by search (absence not proven).
- League wiki `Module:MayhemAugmentData/data`: augment names, descriptions, tiers. Static reference data, not statistics. Licence not checked — **UNVERIFIED**.

## What can ship at $0 today

- A build planner from static game data (champions, items, augment catalogue), with attribution and licences checked per source.
- Popularity signals from arammayhem.com under CC BY 4.0, labelled as pick rates of an unstated sample.
- Playstyles authored editorially or derived from rules (stat synergies, augment-set definitions), labelled as opinion or theory, **not** as statistically ranked.
- Not shippable: any "best / tier / win-rate" claim tied to augments.

Reopen this study if #1154 or #1204 gets a Riot answer, or if the Game Policy sentence changes.

## Sources

- https://static.developer.riotgames.com/docs/lol/queues.json
- https://static.developer.riotgames.com/docs/lol/gameModes.json
- https://developer.riotgames.com/api-details/match-v5 (content behind https://developer.riotgames.com/apis#match-v5)
- https://developer.riotgames.com/docs/lol
- https://developer.riotgames.com/docs/portal
- https://developer.riotgames.com/policies/general
- https://github.com/RiotGames/developer-relations/issues/1109, /1114, /1147, /1154, /1204, and search result for #1059
- https://dev.overwolf.com/ow-native/guides/game-compliance/riot-games
- https://arammayhem.com/data/ and https://arammayhem.com/about
- https://github.com/czgreat/aramhex-data
- Not readable (HTTP 403): https://support-developer.riotgames.com/hc/en-us/articles/22698698001939-League-of-Legends, https://www.metasrc.com/lol/mayhem/build/garen
