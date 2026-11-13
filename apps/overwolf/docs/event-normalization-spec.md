# Event normalization spec: raw Overwolf updates → `GameState`

Status: specification only. No code exists. Sources and quoted payloads are in `integration-research.md` (access date 2026-11-13); section numbers below written as "R 1.3" point into that file.

Items marked **UNVERIFIED** depend on a live capture that has not been made. The function must be written so that each of those items is a table entry or a config value, not a code path.

## 1. Target interface

```ts
interface GameState { championId: string | null; patch: string; selectedAugmentIds: string[]; }
interface GameStateProvider { getState(): GameState; subscribe(cb: (s: GameState) => void): () => void; }
```

- `championId`: the Data Dragon champion `id` string (for example `"MonkeyKing"`, `"Fiddlesticks"`), or `null` when unknown.
- `selectedAugmentIds`: Mayhem Lab augment ids (the dataset's ids, CommunityDragon-derived), in pick order, no duplicates.
- `patch`: not taken from Overwolf. It is the patch of the dataset the normalizer was configured with (see 3). No in-game Overwolf key for the patch was confirmed.

## 2. The function

One pure reducer. No I/O, no clock, no globals, no Overwolf API calls, no logging.

```
normalize(prev: NormalizerState, input: RawInput, config: NormalizerConfig)
  → { next: NormalizerState, diagnostics: Diagnostic[] }

project(state: NormalizerState, config: NormalizerConfig) → GameState
```

Rules:

- Same `(prev, input, config)` always gives the same output.
- `prev` is never mutated. If nothing changes, return the **same** `prev` reference as `next`, so the provider can skip notifying subscribers with `next === prev`.
- It never throws. Malformed input produces a diagnostic and leaves state unchanged.
- The provider shell (not specified here) owns the listeners, calls `normalize` once per raw callback in arrival order, and calls subscribers only when `project(next)` differs from `project(prev)` by value.

### 2.1 `RawInput`

A tagged union of exactly what Overwolf hands over, untouched:

| `kind` | Payload | Origin |
| --- | --- | --- |
| `"info"` | the object passed to `onInfoUpdates2` | game events provider |
| `"events"` | the object passed to `onNewEvents` (`{ events: [{ name, data }] }`) | game events provider |
| `"snapshot"` | `res` from `getInfo()` | game events provider |
| `"launcher_info"` | launcher info update | launcher provider (optional) |
| `"game_closed"` | none | provider shell, when the game process exits |

### 2.2 `NormalizerConfig`

| Field | Meaning |
| --- | --- |
| `patch` | string copied into `GameState.patch` |
| `supportedQueueIds` | set of strings; initial value `{"2400"}` (R 2.4; that Overwolf reports this value is UNVERIFIED) |
| `championIndex` | lookup tables built from Data Dragon `champion.json` (see 7) |
| `championAliases` | explicit overrides; must contain `"FiddleSticks" → "Fiddlesticks"` (R 2.1) |
| `augmentIndex` | lookup from raw augment name to Mayhem Lab augment id (see 6) |
| `maxAugmentSlots` | upper bound on slots accepted; initial value 8 (real count UNVERIFIED, R 1.3 point 6) |

### 2.3 `NormalizerState`

| Field | Type | Initial |
| --- | --- | --- |
| `matchKey` | string or null | null |
| `queueId` | string or null | null |
| `mode` | `"unknown"` \| `"supported"` \| `"unsupported"` | `"unknown"` |
| `rawChampion` | string or null (last raw value seen) | null |
| `championSource` | `"summoner_info"` \| `"live_client_data"` \| null | null |
| `activePlayerName` | string or null | null |
| `allPlayers` | array of `{ name, championName, rawChampionName }` or null | null |
| `slots` | array of raw augment names, index = slot number − 1, `""` = empty | `[]` |
| `matchLive` | boolean | false |

`championId` and `selectedAugmentIds` are **derived** in `project`, not stored. That keeps resolution independent of arrival order (a champion seen before the index is loaded, or an augment seen before the queue id, resolves later without replaying input).

## 3. `project`

```
if state.mode !== "supported":
    return { championId: null, patch: config.patch, selectedAugmentIds: [] }
else:
    return {
      championId: resolveChampion(state, config),          // section 7
      patch: config.patch,
      selectedAugmentIds: resolveAugments(state.slots, config)   // section 6
    }
```

So while the mode is `"unknown"` or `"unsupported"`, subscribers see the empty state. Data received during `"unknown"` is retained in `NormalizerState` and appears the moment the mode becomes `"supported"`.

## 4. Envelope decoding (first step of `normalize`)

Every info-type input is flattened to a list of triples `(feature, category, key, rawValue)` before any rule runs. Two documented envelopes must be accepted (R 1.3 point 3):

1. Nested: `{ "info": { <category>: { <key>: <value>, ... }, ... }, "feature": <feature> }` → one triple per key.
2. Flat: `{ "feature", "category", "key", "value" }` or the same with `"data"` in place of `"value"` (both spellings are documented, R 2.4) → one triple.

A `"snapshot"` input (`getInfo().res`) is `{ <category>: { <key>: <value> } }`; flatten it the same way with `feature` = null.

Rules are selected by **`(category, key)` only**. `feature` is ignored for dispatch, because the documented `matchId` example carries `"feature":"game_info"` rather than `"matchState"` (R 2.4).

Value decoding helper `decodeJsonish(value)`:

1. If `value` is not a string, return it.
2. Trim. If it does not start with `{` or `[`, return the string.
3. Try `JSON.parse`. On success return the result.
4. On failure, remove any comma that is followed only by whitespace and then `}` or `]` (the documented `augments` example ends with `, }`, R 1.3 point 2), then try `JSON.parse` once more.
5. On second failure: emit diagnostic `malformed_json` with `(category, key)` (never the raw value) and treat the triple as absent.

String comparison helper: `isBlank(v)` is true for `null`, `undefined`, `""`, whitespace-only strings, and the literal strings `"null"` / `"undefined"`.

## 5. Rules per input

Rules are applied to the triples of one input **in this fixed order**, regardless of the order the keys appeared in the payload: (1) match identity, (2) queue, (3) match start flag, (4) champion sources, (5) augments. This makes one batched update (for example a `"snapshot"`) deterministic: a match change inside the batch resets first, then the same batch's champion and augments are applied to the new match.

### 5.1 Match identity and reset

Inputs:

- `(game_info, matchId)`: candidate key `"m:" + value`.
- `(match_info, pseudo_match_id)`: candidate key `"p:" + value`. Used only when no `"m:"` key is held.

Rule:

- Blank value → ignore (GEP blanks fields between matches, R 1.5; a blank is not a new match).
- `state.matchKey` is null → set it. **No reset.** (Champion or augments may legitimately have arrived first.)
- Candidate equals `state.matchKey` → no change.
- Held key is `"p:..."` and the candidate is `"m:..."` → upgrade the key. **No reset.**
- Otherwise (a different non-blank key of the same kind) → **RESET**, then set the new key.

**RESET** means: `rawChampion`, `championSource`, `activePlayerName`, `allPlayers` → null; `slots` → `[]`; `queueId` → null; `mode` → `"unknown"`; `matchLive` → false; `matchKey` → null. Emit diagnostic `match_reset` with the reason.

Other reset triggers:

- Event `matchStart` (from `"events"`), or `(game_info, matchStarted)` changing to `"true"` (case-insensitive; S7 sample is `"TRUE"`): if `state.matchLive` is already true, ignore. If false: set `matchLive` = true, and RESET first **only if** `state.slots` contains any non-empty name (stale augments from a previous match whose id never changed). Otherwise keep what has been collected.
- `(game_info, matchStarted)` = `"false"`: set `matchLive` = false. No reset (the end-of-match state stays readable until the next match).
- `"game_closed"`: RESET.
- `"launcher_info"` with `(game_flow, phase)` equal to `ChampSelect`: RESET (a new game is being set up). Other phases: no effect.
- Announcer `victory` / `defeat` events: set `matchLive` = false. No reset.

### 5.2 Queue and mode gating

Inputs: `(game_info, queueId)` from the game provider; `(lobby_info, queueId)` from the launcher.

- Convert to a canonical string: numbers via decimal formatting, strings trimmed (documented as string `"420"` in-game and number `1090` in the launcher, R 2.4).
- Blank → ignore.
- Set `state.queueId`. Set `mode` = `"supported"` if the string is in `config.supportedQueueIds`, else `"unsupported"`.
- A launcher queue id is applied only while `mode` is `"unknown"`; the in-game value always wins.
- Changing `queueId` to a different non-blank value without a match-key change does **not** reset; it only re-evaluates `mode`.

Explicitly not used for gating: the `gameMode` feature (documented as incorrect), `match_info.game_mode` (no Mayhem value documented), `live_client_data.game_data.gameMode` (Mayhem value UNVERIFIED). If any of these arrive they are ignored. They may be surfaced in a diagnostic `mode_hint` to help the first live capture.

In `"unsupported"` mode all champion and augment updates are still stored in `NormalizerState` (cheap, and the mode could be corrected by a later queue update), but `project` hides them.

### 5.3 Champion sources

- `(summoner_info, champion)`: blank → ignore. Otherwise set `rawChampion` = trimmed value, `championSource` = `"summoner_info"`.
- `(live_client_data, active_player)`: decode; take `riotId` if present and non-blank, else `summonerName` (R 2.2; the Riot ID fields in the Overwolf payload are UNVERIFIED). Store in `activePlayerName`.
- `(live_client_data, all_players)`: decode; must be an array, else `malformed_json`. Store for each entry `{ name: riotId ?? summonerName, championName, rawChampionName }`. Nothing else from the payload is kept.

Priority: `summoner_info` wins whenever it has produced a non-blank value in the current match. `live_client_data` is a fallback, never an override.

### 5.4 Augments

`(me, augments)`, the **offered** list: **not part of `GameState`. Ignored.** No state change, no diagnostic carrying its contents. It is deliberately not consumed until Riot has confirmed that reacting to offered augments is permitted (R 4.4, `approval-checklist.md`).

`(me, picked_augment)`:

1. `decodeJsonish`. Result must be a plain object, else `malformed_json` and stop.
2. Collect entries whose key matches `^slot_(\d+)$`. Other keys are ignored. Slot numbers below 1 or above `config.maxAugmentSlots` are ignored with diagnostic `slot_out_of_range`.
3. For each slot, the raw name is `entry.name` if it is a string, else `""`. Trim it.
4. Build `incoming`: an array indexed by slot number − 1, missing slots filled with `""`.
5. Merge into `state.slots` slot by slot:
   - incoming `""` → keep the existing value for that slot (**a pick is never removed by an update**).
   - incoming non-empty and equal to existing → no change.
   - incoming non-empty and existing is `""` or absent → set.
   - incoming non-empty and different from a non-empty existing value → replace, and emit diagnostic `slot_replaced` with the slot number.
6. If the merge changed nothing, return `prev` unchanged.

Consequences:

- A whole-object blank (`null`, `""`, `"{}"`, or all slots empty) changes nothing. Only RESET clears augments.
- The documented type of this key is "the last augment that the player picked", but the documented example is a cumulative slot map (R 1.3 point 4). The merge handles both: a cumulative map and a map containing only the newest slot give the same result.

Limitation, stated plainly: if the live payload turns out to be a bare single augment with no slot key, this rule extracts nothing and emits `malformed_json`. That shape is not documented, so it is not handled; the first live capture decides whether a rule is needed.

## 6. De-duplication and augment id resolution

Three layers of de-duplication:

1. **Identical repeats.** Overwolf re-sends the current info state on subscribe and says handlers must tolerate the same information twice (R 1.5). The slot merge is idempotent, so a repeat returns `prev` by reference and no subscriber is called.
2. **Same augment in two slots.** `resolveAugments` keeps the first occurrence only.
3. **Value-equal `GameState`.** The provider shell compares projected states by value before notifying.

`resolveAugments(slots, config)`:

```
out = []
for name in slots, ascending slot order:
    if name == "": continue
    id = lookupAugment(name, config.augmentIndex)
    if id is null: continue            // unknown augment, see below
    if id in out: continue
    out.push(id)
return out
```

`lookupAugment(name, index)`, first hit wins:

1. Exact match on the index's primary raw-name key.
2. Case-insensitive match.
3. Match after stripping a trailing `_combo` (documented for TFT only, R 1.4; harmless if it never occurs).
4. Otherwise null.

Which CommunityDragon field is the primary raw-name key (`augmentNameId` / `apiName`, with or without an `ARAM_` prefix, or something else) is **UNVERIFIED** (R 3). `augmentIndex` is therefore built outside the normalizer and passed in; changing the key field must not require changing the normalizer.

Unknown augment names:

- Are kept in `state.slots` (so a later index/dataset update can resolve them without replay).
- Are omitted from `selectedAugmentIds`. No placeholder id is invented, and later slots keep their relative order.
- Produce diagnostic `unknown_augment` with the slot number and the raw name. The raw augment name is game content, not personal data, and is needed to fix the index.
- The diagnostic is emitted once per `(matchKey, slot, name)`; because the reducer is pure, "once" is achieved by emitting it only on the `normalize` call in which that slot's value changed.

## 7. Champion name → Data Dragon id

`championIndex` is built from Data Dragon `champion.json` for `config.patch` and holds:

- `byId`: exact `id` → `id` (for example `"MonkeyKing"`).
- `byIdLower`: lower-cased `id` → `id`.
- `byNameFolded`: folded display `name` → `id`, where folding = lower-case and remove every character that is not a letter or digit (so `"Nunu & Willump"` → `nunuwillump`, `"Twisted Fate"` → `twistedfate`).

`resolveChampion(state, config)`:

1. If `state.rawChampion` is non-null, resolve it with `lookupChampion`. If found, return it.
2. Else if `activePlayerName` and `allPlayers` are both set: find the entries whose `name` equals `activePlayerName` exactly. If there is exactly one:
   a. If `rawChampionName` starts with `game_character_displayname_`, strip that prefix and `lookupChampion` the remainder.
   b. Else `lookupChampion(championName)`.
   Zero or several matching entries → null.
3. Else null.

`lookupChampion(raw)`, first hit wins:

1. `config.championAliases[raw]` (must include `FiddleSticks → Fiddlesticks`, the one mismatch Overwolf documents).
2. `byId[raw]`.
3. `byIdLower[raw.toLowerCase()]`.
4. `byNameFolded[fold(raw)]`.
5. Null, with diagnostic `unknown_champion` carrying the raw string.

Known cases the tables must cover (checked against Data Dragon 16.22.1, `en_US`, on 2026-11-13: of 173 champions, the only ones whose display name, with non-letters removed and compared case-insensitively, differs from the id are these three):

| Display name | Data Dragon `id` |
| --- | --- |
| Wukong | MonkeyKing |
| Nunu & Willump | Nunu |
| Renata Glasc | Renata |

Steps 2 and 3 cannot resolve these three from a display name; step 4 does, because `byNameFolded` maps the folded display name to the id (`wukong → MonkeyKing`). They matter only on the `live_client_data.championName` fallback path, and only when `championIndex` was built from the same language as the game client; display names in another client language will not resolve through `championName`, which is why `rawChampionName` is tried first.

A champion that is unknown stays `null`; augments are still reported.

## 8. Ordering guarantees

- Inputs are processed strictly in arrival order, one at a time.
- No rule depends on which of queue id, match id, champion or augments arrives first; all four are stored independently and combined in `project`.
- Within one input, rules run in the fixed order of section 5.
- Late start (the app launched mid-match): the provider shell feeds one `"snapshot"` input from `getInfo()` before live updates. On Overwolf client 0.311.0.6 and later the first `onInfoUpdates2` call carries the same state; both are safe because of idempotence.
- `selectedAugmentIds` order is ascending slot number. It is assumed, not verified, that slot number equals pick order.

## 9. Diagnostics

`Diagnostic = { code, detail }`, codes: `malformed_json`, `match_reset`, `slot_out_of_range`, `slot_replaced`, `unknown_augment`, `unknown_champion`, `mode_hint`.

- Diagnostics are return values. The normalizer does not log.
- They must never contain summoner names, Riot IDs, account ids, match ids, or raw payloads. Overwolf says to avoid logging GEP data (R 1.5).

## 10. Required test cases

Each is a fixture sequence → expected `project` output. Fixtures use the payloads quoted in `integration-research.md` verbatim wherever one exists.

1. Queue `2400`, champion `Samira`, documented `picked_augment` example → champion `Samira`; augments: the two non-empty slots, resolved through a test index.
2. Same inputs in every permutation of arrival order → same final state.
3. Same `picked_augment` payload three times → `next === prev` on the second and third call.
4. Queue `420` (documented example) with champion and augments → empty state; then queue `2400` arrives → full state appears without replaying earlier inputs.
5. No queue id ever → empty state.
6. New `matchId` after a populated match → augments and champion cleared, mode back to `"unknown"`.
7. `matchId` blank update mid-match → no reset.
8. `pseudo_match_id` first, then `matchId` → no reset.
9. `matchStart` event while old augments are held and no new match id → reset.
10. Documented `augments` example (with trailing comma) → no state change, no exception.
11. `picked_augment` with all slots empty after two picks → picks kept.
12. Slot 1 name changes → replaced, `slot_replaced` emitted.
13. Unknown augment in slot 1, known in slot 2 → only slot 2's id; `unknown_augment` emitted once.
14. Same augment name in slots 1 and 2 → one id.
15. `FiddleSticks` → `Fiddlesticks`.
16. No `summoner_info.champion`; documented `active_player` + `all_players` examples → `TwistedFate` via `rawChampionName`.
17. `active_player` name matching zero or two `all_players` entries → `championId` null.
18. Garbage input (non-object, missing `info`, truncated JSON string) → unchanged state, `malformed_json`.
19. `game_closed` → empty state.
20. Flat envelope with `value`, flat envelope with `data`, and nested envelope for the same key → identical result.

## 11. Assumptions to confirm with the first live capture

| # | Assumption | If wrong, what changes |
| --- | --- | --- |
| A1 | Overwolf `queueId` is `"2400"` in ARAM: Mayhem | `config.supportedQueueIds` |
| A2 | `picked_augment` is a `slot_N` map in Mayhem | rule 5.4 |
| A3 | Augment `name` matches a CommunityDragon name key | how `augmentIndex` is built |
| A4 | Slot number = pick order | ordering in `resolveAugments` |
| A5 | `summoner_info.champion` is sent in Mayhem and equals the Data Dragon `id` | priority in section 7 |
| A6 | A new match always changes `matchId` or fires `matchStart` | reset triggers in 5.1 |
| A7 | Picks are never removed or swapped mid-match by the game | merge rule 5.4 step 5 |
