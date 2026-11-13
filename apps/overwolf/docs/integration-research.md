# Overwolf integration research (Mayhem Lab)

- Access date for every source below: **2026-11-13**.
- Method: each page was downloaded and read as raw HTML on the access date. JSON blocks marked "Quoted from the docs" are copied character-for-character from the page (only HTML tags removed).
- Rule used in this file: anything not confirmed on a page read on the access date is labelled **UNVERIFIED**. Statements labelled **INFERENCE** are my reading of verified facts, not something a page says.
- Nothing here was tested against a running game or a running Overwolf client. No live capture exists yet.

## Source list

| Ref | URL |
| --- | --- |
| S1 | https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/league-of-legends |
| S2 | https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/league-of-legends-arena |
| S3 | https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/league-of-legends-swarm |
| S4 | https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/teamfight-tactics |
| S5 | https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/league-of-legends-launcher |
| S6 | https://dev.overwolf.com/ow-native/live-game-data-gep/verifying-events-for-your-app |
| S7 | https://game-events-status.overwolf.com/5426_prod.json (live status feed named by S6) |
| S8 | https://dev.overwolf.com/ow-native/reference/games/events |
| S9 | https://dev.overwolf.com/ow-native/live-game-data-gep/live-game-data-gep-intro |
| S10 | https://dev.overwolf.com/ow-native/guides/dev-tools/games-ids |
| S11 | https://dev.overwolf.com/ow-native/guides/game-compliance/riot-games/ |
| S12 | https://dev.overwolf.com/ow-native/guides/game-compliance/riot-in-game-ads/ |
| S13 | https://dev.overwolf.com/ow-native/guides/game-compliance/overview |
| S14 | https://dev.overwolf.com/ow-native/getting-started/project-roadmap (Phase 1) |
| S15 | https://dev.overwolf.com/ow-native/getting-started/develop-your-idea (Phase 2) |
| S16 | https://dev.overwolf.com/ow-native/getting-started/release-your-app (Phase 3) |
| S17 | https://dev.overwolf.com/ow-native/monetization/overview |
| S18 | https://dev.overwolf.com/ow-native/monetization/advertising/overview |
| S19 | https://dev.overwolf.com/ow-native/getting-started/onboarding-resources/setting-up-dev-environment |
| S20 | https://dev.overwolf.com/ow-native/getting-started/onboarding-resources/basic-sample-app |
| S21 | https://dev.overwolf.com/ow-native/developers-console/releases-management/testing |
| S22 | https://dev.overwolf.com/ow-native/guides/test-your-app/how-to-test-your-app |
| S23 | https://developer.riotgames.com/policies/general (page states "LAST UPDATED: MAY 29, 2025") |
| S24 | https://developer.riotgames.com/docs/lol |
| S25 | https://developer.riotgames.com/docs/portal |
| S26 | https://static.developer.riotgames.com/docs/lol/queues.json |
| S27 | https://static.developer.riotgames.com/docs/lol/gameModes.json |
| S28 | https://ddragon.leagueoflegends.com/cdn/16.22.1/data/en_US/champion.json (16.22.1 was the first entry of https://ddragon.leagueoflegends.com/api/versions.json) |
| S29 | https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json |
| S30 | https://raw.communitydragon.org/latest/cdragon/arena/en_us.json |

Site-wide banner present on every dev.overwolf.com page read (S1, S2, S3, S21 and others). Quoted from the docs:

> From November 1, 2026, Overwolf only approves apps with Overwolf monetization. See Native monetization or Electron monetization.

---

## 1. Game ID, features, and the `augments` feature

### 1.1 Game ID

- League of Legends game ID is **5426**. S6: "to check event health in LOL (Game ID 5426) you should call: https://game-events-status.overwolf.com/5426_prod.json". S7 returns `"game_id":5426,"name":"League of Legends"`.
- S1 itself does not print the game ID.
- LoL **launcher** ID is **10902** (S10: "currently only available for League of Legends launcher id 10902"). Used in `launch_events`.
- TFT, LoL Arena, LoL Swarm and their PBE variants share the LoL game ID (S2, S3, S4: "... and LOL share the same Game ID"). For status checks only, S2 gives 21556 (Arena) / 215561 (Arena PBE) and S3 gives 13956 (Swarm).
- Game IDs go in `manifest.json` under `game_targeting`, `game_events`, `launch_events` (S10). Instance IDs have one extra digit; `Math.floor(id / 10)` gives the game ID; `RunningGameInfo.classId` already equals the game ID (S10).

### 1.2 Features available for LoL (S1 "Available Features", in page order)

`gep_internal`, `live_client_data`, `matchState`, `match_info`, `death`, `respawn`, `abilities`, `kill`, `assist`, `gold`, `minions`, `summoner_info`, `gameMode`, `teams`, `level`, `announcer`, `counters`, `damage`, `heal`, `jungle_camps`, `team_frames`, `chat`, `panel_location`, `augments`.

**Features Mayhem Lab should request** (INFERENCE, minimum set for `GameState`): `gep_internal`, `summoner_info`, `matchState`, `match_info`, `live_client_data`, `augments`.

Do not request features the app does not use. In particular `team_frames` (ultimate cooldown timers), `jungle_camps`, `abilities` and `chat` relate directly to behaviour Overwolf lists as prohibited or sensitive for LoL (see section 4).

### 1.3 `augments` feature (S1, section "augments")

Table, quoted from the docs:

| key | Category | Values | Notes | Since GEP Ver. |
| --- | --- | --- | --- | --- |
| augments | me | List of available augments in ARAM Mayhem mode | See notes | 299.0 |
| picked_augment | me | The last augment that the player picked in ARAM Mayhem mode | See notes | 299.0 |

Facts:

- Feature name: `augments`. Category: `me`. Keys: `augments` and `picked_augment`.
- **Both are Info Updates, not Events.** S1 lists them only under "Info Updates"; the `augments` section has no "Events" table. They arrive through `overwolf.games.events.onInfoUpdates2` (and `getInfo()`), not through `onNewEvents`.
- Documented mode on the LoL page: **ARAM Mayhem** (both rows say "in ARAM Mayhem mode").
- Version history: both keys "Since GEP Ver." **299.0** on S1. The page has no further changelog entry for them.

`augments` data example. Quoted from the docs (S1, "augments note"):

```
{"feature":"augments","category":"me","key":"augments","value":"{\"augment_1\":{\"name\":\"TFT8_Augment_DefenderTrait\"}, \"augment_2\":{\"name\":\"TFT7_Augment_PandorasBench\"}, \"augment_3\":{\"name\":\"TFT6_Augment_SecondWind1\"}, }"}
```

`picked_augment` data example. Quoted from the docs (S1, "picked_augment note"):

```
{"info":{"me":{"picked_augment":"{\"slot_1\":{\"name\":\"TFT9_Augment_CyberneticBulk3\"}, \"slot_2\":{\"name\":\"TFT9_Augment_SettTheBoss\"}, \"slot_3\":{\"name\":\"\"}}"}},"feature":"augments"}
```

Things these examples show, and their limits:

1. The value is a **JSON string inside JSON** (double encoded). It must be parsed a second time.
2. The documented `augments` example value ends with `, }` (a trailing comma). That is **not valid JSON**. Whether the live payload has the trailing comma is UNVERIFIED.
3. The two examples use **two different envelopes**: a flat `{feature, category, key, value}` and a nested `{info: {me: {picked_augment: "..."}}, feature}`. S8 documents the `onInfoUpdates2` object as `{ info, feature }` (nested form). Which envelope the live `augments` key uses is UNVERIFIED; the flat form may be log/simulator notation.
4. `picked_augment` is described as "The last augment that the player picked", but the example is a **slot map of all picks so far** (`slot_1`..`slot_3`), with `"name":""` for an empty slot. So one update carries the cumulative state.
5. **The example names are TFT placeholders** (`TFT8_Augment_...`, `TFT9_Augment_...`). The LoL-page examples are byte-identical to the examples on the Arena page (S2). The docs therefore show the *shape* but not a real ARAM Mayhem augment name. The real name format in ARAM Mayhem is **UNVERIFIED**.
6. Number of slots in ARAM Mayhem: the example shows 3. The real count is UNVERIFIED (the TFT page example has `slot_4`).

Live status (S7, read on the access date): feature `augments` state `1` (green), keys `augments` and `picked_augment` both type `1` (info), state `1`, category `me`, **no sample data**. Game-level: `"state":1,"issue_code":101,"issue_reason":"Partial availability"`, `"min_gep_version":"315.0.1"`. Status codes (S6): 0 unsupported, 1 green, 2 yellow, 3 red.

### 1.4 The same feature on the other pages

| Page | `augments` feature | Mode wording | Since |
| --- | --- | --- | --- |
| LoL (S1) | yes, keys `augments`, `picked_augment`, category `me` | "in ARAM Mayhem mode" | 299.0 / 299.0 |
| LoL Arena (S2) | yes, same keys, same examples | no mode named ("List of available augments", "The last augment that the player picked") | 230.0 / 222.0 |
| LoL Swarm (S3) | **not listed**. Only mention: `match_clock` "Including augments selection" | - | - |
| TFT (S4) | yes, keys `me` and `picked_augment`, category `me`; `_combo` suffix note | TFT | 197.1 / 222.0 |

TFT page warning (S4), quoted from the docs:

> DO NOT include augment data support in your apps. This data can't be displayed on third-party apps and websites by any means as this is a violation of Riot TOS. Displaying this data can result in banning.

That warning is on the TFT page only. The LoL page (S1) carries no such warning on its `augments` section. Whether Riot applies an equivalent restriction to ARAM Mayhem augment data is **UNVERIFIED** and must be asked (see section 4 and `approval-checklist.md`).

### 1.5 How updates are delivered (S8, S9)

- `overwolf.games.events.setRequiredFeatures(features, callback)` must succeed before data flows. Result: `{ success, error, supportedFeatures }`.
- `onInfoUpdates2` fires with `{ info, feature }`. Quoted from the docs (S8):

```
{
   "info":{
      "game_info":{
         "minionKills":"3"
      }
   },
   "feature":"minions"
}
```

- `onNewEvents` fires with `{ events: [{ name, data }] }`.
- S8: "As of Overwolf client 0.311.0.6, the moment you subscribe you receive one event carrying the info state as it stands." and "Make sure your handler tolerates receiving the same information twice."
- S9: info updates fire only when a value changes; GEP resets fields to a meaningless value (example: `null`) between matches so the next match triggers an update.
- S9: "Avoid logging GEP data to any of the log files."

---

## 2. Local player's champion, and detecting ARAM: Mayhem

### 2.1 `summoner_info` → `champion` (S1)

Table row, quoted from the docs:

| key | Category | Values | Notes | Since GEP Ver. |
| --- | --- | --- | --- | --- |
| champion | summoner_info | Name of the selected champion | All champion names (provided by the Overwolf Game Events Provider) match the champion-key from the Riot API, except for Fiddlesticks. Game Events Provider value: "FiddleSticks" Riot API value: "Fiddlesticks" Also, check notes | 70.0 |

Data example. Quoted from the docs (S1, "champion note"; `summoner_info` is unquoted on the page):

```
{"info":{"summoner_info":{"champion":"Samira"}},"feature":summoner_info}
```

- This is the simplest source: one string for the local player.
- S7 sample data for this key: `Katarina`.
- "champion-key from the Riot API" is read here as the Data Dragon champion `id` string (for example `MonkeyKing`), not the numeric `key`. This reading is an INFERENCE; no doc example shows a champion whose display name differs from its id.
- The Arena page (S2) lists only `id`, `region`, `level`, `accountId` under `summoner_info` (no `champion`). The LoL page (S1) is the one that applies to ARAM Mayhem by its `augments` wording, but whether `champion` is populated in ARAM Mayhem matches is UNVERIFIED until captured.

### 2.2 `live_client_data` (S1)

Keys (category `live_client_data`): `active_player`, `all_players`, `events`, `game_data` (all since 143.1), `port` (since 155.0).

`active_player` identifies the local player by `summonerName`; `all_players` gives each player's champion. Excerpts quoted from the docs (S1; the full examples on the page are much longer, `...` marks where I cut):

```
{
  "info": {
    "live_client_data": {
      "active_player": {
        "abilities": { ... },
        "championStats": { ... },
        "currentGold": 0,
        "fullRunes": { ... },
        "level": 1,
        "summonerName": "Sh4rgaas"
      }
    }
  },
  "feature": "live_client_data"
}
```

```
{
  "info": {
    "live_client_data": {
      "all_players": [
        {
          "championName": "Twisted Fate",
          "isBot": false,
          "isDead": false,
          "items": [ ... ],
          "level": 1,
          "position": "NONE",
          "rawChampionName": "game_character_displayname_TwistedFate",
          "rawSkinName": "game_character_skin_displayname_TwistedFate_9",
          "respawnTimer": 0,
          "runes": { ... },
          "scores": { ... },
          "skinID": 9,
          "skinName": "Cutpurse Twisted Fate",
          "summonerName": "Sh4rgaas",
          "summonerSpells": { ... },
          "team": "CHAOS"
        },
        ...
      ]
    }
  },
  "feature": "live_client_data"
}
```

- `championName` is a **localized display name** ("Twisted Fate"). `rawChampionName` is `game_character_displayname_<Id>` ("TwistedFate").
- To find the local champion: match `active_player.summonerName` to the `all_players[].summonerName` entry.
- Riot's own Live Client Data doc (S24) says the endpoints now return "a RiotID shim over summonerName, and new fields called riotId, riotIdGameName and riotIdTagLine". The Overwolf example predates that; the exact fields present in the Overwolf payload today are UNVERIFIED.

`game_data` example. Quoted from the docs (S1):

```
{
  "info": {
    "live_client_data": {
      "game_data": {
        "gameMode": "ARAM",
        "gameTime": 0.0417339988052845,
        "mapName": "Map12",
        "mapNumber": 12,
        "mapTerrain": "Default"
      }
    }
  },
  "feature": "live_client_data"
}
```

### 2.3 `teams` (S1)

Category `game_info`, key `teams`, a URI-encoded JSON string; decode with `decodeURI()` then `JSON.parse()`. Decoded entries look like `{"team":"Order","champion":"Riven","skinId":"7","summoner":"ruizete"}`. S1 warning: it "might be provided a bit late in some game modes". Not needed for `GameState`.

### 2.4 Game mode / queue

`gameMode` feature. Quoted from the docs (S1):

> The information provided by this feature is incorrect at the moment. Please use "queueId" instead. (can be found either in the launcher events provider or in the game events provider).

So **do not use `gameMode`**.

`matchState` feature (S1), info updates in category `game_info`:

| key | Values | Since |
| --- | --- | --- |
| matchStarted | true/false (string) | 140.0 |
| matchId | Current match id | 120.0 |
| queueId | Current match queue id | 120.0 |

Events: `matchStart` (data `null`, since 140.0), `matchEnd` (deprecated; use announcer `defeat` / `victory` or the launcher game flow).

Examples quoted from the docs (S1):

```
{"info":{"game_info":{"matchStarted":"true"}},"feature":"matchState"}
```

```
{"info":{"game_info":{"matchId":"2603009084"}},"feature":"game_info"}
```

```
{"feature": "matchState", "category": "game_info", "key": "queueId", "data": "420"}
```

Notes: the `matchId` example's `feature` is `"game_info"` on the page (not `"matchState"`); the `queueId` example uses the flat envelope with `data` (not `value`); queue id is a **string** there.

`match_info` feature (S1), category `match_info`:

- `pseudo_match_id`: "This is an Overwolf-generated code unrelated to Riot Games." Example value `a4e8fc75-b35e-466f-976c-09f4ee633d95`.
- `game_mode`: "Whether the current game mode is TFT, Arena, Swarm, Brawl, LoL classic or default LoL." Examples quoted from the docs:

```
{"feature": "match_info", "category": "match_info", "key": "game_mode", "data": "lol"}
{"feature": "match_info", "category": "match_info", "key": "game_mode", "data": "tft"}
{"feature": "match_info", "category": "match_info", "key": "game_mode", "data": "arena"}
{"feature": "match_info", "category": "match_info", "key": "game_mode", "data": "classic"}
```

  No value for ARAM Mayhem is documented. S7 sample data for this key is `ranked`. The value sent during an ARAM Mayhem match is UNVERIFIED.

Launcher provider (S5), available before the game process starts:

- `lobby_info` → `queueId`. Quoted from the docs: `{"feature":"lobby_info","category":"lobby_info","key":"queueId","value":1090}` (a **number** here).
- `game_flow` → `phase`: `Lobby`, `ReadyCheck`, `ChampSelect`, `GameStart`, `InProgress`, `WaitingForStats`, `PreEndOfGame`, `EndOfGame`.
- `champ_select` → `aram_champ_select` (since 287.0): "The IDs of the champions available for selection in ARAM mode", example value `"[36,163,157]"`.
- `end_game` Arena example contains `"queueId":1700,"queueType":"CHERRY"`.

**Queue ID for ARAM: Mayhem.** Riot's queue list (S26) contains, read on the access date:

```
{
    "queueId": 2400,
    "map": "Howling Abyss",
    "description": "ARAM: Mayhem",
    "notes": null
}
```

For contrast (S26): 450 = "5v5 ARAM games" (Howling Abyss), 1700 / 1710 = "Arena", 2300 = "Brawl".

Recommended detection rule (INFERENCE): the match is ARAM: Mayhem if and only if `matchState.queueId` (or launcher `lobby_info.queueId`) equals `2400`.

Still UNVERIFIED:

- That Overwolf's `queueId` actually reports `2400` during ARAM Mayhem (no Overwolf page lists the value).
- What `live_client_data.game_data.gameMode` reports in ARAM Mayhem. S27 (Riot `gameModes.json`) has no ARAM-Mayhem-specific entry on the access date; it lists `ARAM` among others.
- Whether rotating/custom variants of ARAM Mayhem use a different queue id.

---

## 3. Augment identifier format

- **Verified:** each augment is reported as an object with a single documented field, `name`, holding a **string** (`{"name":"..."}`). No numeric id is documented in either `augments` or `picked_augment`.
- **UNVERIFIED:** what that string is for ARAM Mayhem. The only documented samples are TFT-style names (see 1.3 point 5).

CommunityDragon side, read on the access date:

- S29 `cherry-augments.json`: 596 entries; fields `id` (number), `augmentNameId` (string), `nameTRA`, `simpleNameTRA`, `summaryDescription`, `augmentSmallIconPath`, `rarity`. 170 entries have an `augmentNameId` starting with `ARAM_`, for example `{"id":1205,"augmentNameId":"ARAM_ADAPt","nameTRA":"ADAPt", ... "rarity":"kSilver"}`. Both `id` and lower-cased `augmentNameId` are unique within the file.
- S30 `cdragon/arena/en_us.json`: `augments[]` with fields `apiName`, `id`, `name`, `rarity`, `desc`, `tooltip`, `iconSmall`, `iconLarge`, `dataValues`, `calculations` (example `id` 93, `apiName` `WarmupRoutine`, `name` `Warmup Routine`).
- Requests for `.../v1/kiwi-augments.json`, `cdragon/kiwi/en_us.json` and the directory listings returned HTTP 522 on the access date, so whether a dedicated ARAM Mayhem augment file exists is UNVERIFIED.
- That the `ARAM_`-prefixed entries are the ARAM Mayhem augment set is an INFERENCE from the prefix.

Mapping plan (INFERENCE, to be proven by a live capture):

1. Most likely key: Overwolf `name` == CommunityDragon `augmentNameId` / `apiName` (possibly with or without the `ARAM_` prefix, possibly different letter case).
2. Fallbacks to test in the capture: localized display name (`nameTRA` / `name`), or numeric id serialized as a string.
3. Until one real ARAM Mayhem payload has been captured and matched against the Mayhem Lab dataset, the mapping is UNVERIFIED and the provider must stay disabled.

---

## 4. Approval, compliance, monetization

### 4.1 Overwolf approval process (S14, S15, S16)

1. **Phase 1, idea approval.** Sign in with an Overwolf account and submit the app idea form. DevRel classifies it Public or Private. Quoted (S14): "Overwolf doesn't approve private apps. All apps must be listed and distributed through the Overwolf Appstore, and public distribution outside the Overwolf platform isn't permitted." A private app includes one "built for the sole purpose of being a faceless bridge to another service (e.g. feeding information to a website...)". Public apps "must have at least one desktop window indicating the app is running."
2. **Whitelisting.** After approval "You should have received an email from Overwolf letting you know that account is whitelisted" (S15). Quoted (S14, S16, S13): "Using Overwolf's APIs require your app idea to be whitelisted. This is only given to app ideas submitted and approved using the App proposal process. Apps that haven't been approved are considered non-compliant or non-approved Overwolf apps."
3. **Phase 2, develop.** Choose Native or Electron; follow product guidelines.
4. **Phase 3, release.** Self-test, build an `.opk` (zip with normal compression, renamed), submit through the submission form to DevRel QA. QA cycles until MVP standards are met. Developer Console access is granted after the first submission passes QA.
5. Pre-submission checklist (S16) includes: game compliance, UX, FTUE, advertising compliance, app name in manifest, hotkey reminder, resolution compatibility, second screen support, and "Monetization: make sure your app integrates Overwolf ads, subscriptions powered by Tebex, or both. Overwolf doesn't approve apps without Overwolf monetization."
6. S16: "Overwolf won't be able to test or approve apps that only have background processes."

Consequence for Mayhem Lab (INFERENCE): an Overwolf app that only forwards game state to the website, with no window of its own, matches the "faceless bridge" description and would be classed Private, which is not approved.

### 4.2 Riot approval is required as well (S11)

Quoted from the docs:

> If you wish to integrate your app with any of Riot's games, you are required to seek their approval through their 3rd party application process.
>
> These guidelines hold even if you do not intend to use the Riot API itself. Do note that apps which reach the publication phase and do not yet possess a Riot approval will be asked to provide one before proceeding.

Riot side (S23, S25): "All products must be registered in, and audited by Riot Games through the Developer Portal"; "Any new features or changes to a product must be audited through the product's page in the Developer Portal". Monetization is allowed only when "your product status is either Approved or Acknowledged".

Branding (S11, S23): avoid the official Riot logo; show this boilerplate where users can see it:

> [Your app name] isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

### 4.3 LoL-specific compliance rules listed by Overwolf (S11, "League of Legends game compliance guidelines")

Quoted from the docs. "It is strictly prohibited to provide:"

- "Notifications that alert players when a power spike hits (for example, X champion has hit level 6)."
- "Notifications that dictate player action based on the current game state (for example, enemy champion is underleveled, go gank top lane)."
- "Tracking of enemy ability cooldowns, or facilitating players tracking these with timers."
- "Tracking of enemy summoner spells cooldowns, or facilitating players tracking these with timers."
- Timers: "The use of Ultimate timers is strictly forbidden since this may provide an unfair advantage."
- Champion Select Anonymity: in Ranked Solo/Duo champion select, non-party summoner names must be replaced with "Ally #"; applies only during champion select.
- Brawl: "Riot Games does NOT approve any Brawl related data being aggregated or visible on third-party products/apps." (also on S1).
- League Classic: Riot "does NOT approve any League Classic data being aggregated or displayed to users, in any form".
- API restrictions: "Minor rune data will no longer be visible."
- S1: "Push runes/items feature is not allowed (by Riot) on Korea region".

TFT section of the same page (S11), relevant by analogy only: do not display Legend win rates, Augment win rates, or Augment average game placements.

General Overwolf rules (S13): the app must not interfere with gameplay; must not encourage queue dodging; must follow the game's EULA/TOS; must have its own visual identity; overlays should appear on loading screens, after a match, or between rounds. Quoted: "Apps that display persistent overlays during gameplay will not be approved. Overlays must always be easy to dismiss".

### 4.4 Riot's own rules that touch a live augment recommender (S23, S24)

Game Integrity (S24), quoted:

- "Products must not use or incorporate information not present in the game client that would give players a competitive edge (e.g., automatically or manually allowing tracking enemy ultimate cooldowns)..."
- "Products should increase, and not decrease the diversity of game decisions (builds, compositions, characters, decks)."
- "Products should not remove game decisions, but may highlight decisions that are important and give multiple choices to help players make good decisions."

Approved use case example (S24), quoted: "Game overlays that provide static data that is available prior to the game."

Unapproved use cases (S24), quoted:

- "Products cannot display win rates for Augments or Arena Mode items. This applies to all websites, applications and overlays."
- "Products may not provide any game-session-specific information that would be previously unknown to the player."
- "Apps that dictate player decisions."

Assessment (INFERENCE, not a ruling):

- The win-rate rule says "Augments" without naming a mode and says it applies to "all websites, applications and overlays". Treat it as applying to ARAM Mayhem augments, and to the **website** as well as the app, until Riot says otherwise.
- An app that reads the offered augments (`augments` key) and tells the player which single one to take is close to "Apps that dictate player decisions" and to Overwolf's "notifications that dictate player action based on the current game state". The compatible shape is: several options, explained, built from static pre-game data, never a single "pick this" instruction, no win rates.
- Using `picked_augment` (what the player already chose) to update a build plan is a weaker concern than reacting to the offered list, but it is still game-session-specific. Whether either use is acceptable is **UNVERIFIED** and is a question for Riot's product review.

### 4.5 Monetization

Overwolf requirements (S14, S16, S17, banner):

- Quoted (S17): "All apps must integrate Overwolf ads, subscriptions powered by Tebex, or both. Overwolf won't approve apps that don't. Third-party monetization services aren't allowed."
- Quoted (S17): "All apps must be listed and distributed through the Overwolf Appstore. Overwolf doesn't approve private apps intended for personal use, and public distribution outside the Overwolf platform isn't permitted."
- Banner: effective "From November 1, 2026".
- **A free app with no monetization is not approvable under these rules.** No exemption for free or fan-made apps appears on any page read.
- Ad policy (S18): only ads through Overwolf's platform; no third-party ad iframes; do not change ad opacity; ad containers must sit next to app content, not alone in a window; one video ad container per page; no ads on dead-end screens.
- Payment terms (S17): NET 60; paid first week of each month; minimum payout $200 net, rolled over until reached; via Payoneer; USD only.
- Revenue share percentage: UNVERIFIED (S17 says "based on the agreed revenue share" and gives no number).

Riot in-game ads rules as enforced by Overwolf (S12):

1. Overlays with ads must be opt-in by the user (explicit action; no auto-opened ad windows in-game; no flashing).
2. Large ad overlays must dim the game and offer a clear way back.
3. Overlays can't hide important game UI (minimap, scoreboard, shop, ability bar, menus).
4. No floating ads.
5. No in-game CTAs for ad removal or upgrades.
6. Be visually distinct by design (no Riot fonts, colors or UI imitation; show app branding).

Riot's own monetization policy (S23, S24): must have a free tier; "You may not place advertisements in Riot properties, which include in-game, loading screens, and the Riot Client."; no gambling; paid content must be transformative.

Open tension (INFERENCE): Riot's text forbids ads in-game, Overwolf's rules describe conditions for in-game ad overlays. How these fit together for a specific app is UNVERIFIED. The lowest-risk design keeps any ad on a desktop or second-screen window and none in an in-game overlay.

---

## 5. Building and testing locally at $0

Verified:

- Unpacked loading exists (S20): Overwolf settings → About → "Development options" → "Load unpacked extension" → select the app root folder. You must be logged in to the client or you get "Unauthorized App".
- It is gated (S20): "To load an app as unpacked, your OW account has to be whitelisted as a developer." S19: "To develop, load or run unpacked or unreleased apps, you have to get whitelisted first."
- Whitelisting follows idea approval (S15): "After your app idea has been approved and your account is whitelisted, you gain access to Overwolf's development tools."
- The Developers channel of the client is optional (S19).
- Tools named in the docs (S16): CEF dev tools, manifest validation, "Events recorder and simulator", "Game events simulator", OW-Logs. I did not read the simulator pages, so their capabilities (for example whether the simulator can replay `augments` / `picked_augment`) are UNVERIFIED.
- Testing channels in the Developer Console (S21) distribute builds by direct link and "are always exempt from mandatory version review". Console access comes only after the first QA pass (S16).
- Test ads locally with `localStorage.owAdTestAd = true` in the window's dev console (S22).

Cost:

- No page read mentions any fee for an Overwolf account, the idea submission, whitelisting, the client, or the SDK. That there is **no** fee anywhere in the process is UNVERIFIED (absence of a statement, not a statement).
- So: local build and test is possible without paying anything that the docs mention, **but not without approval**. An un-whitelisted account cannot load an unpacked app, and whitelisting requires an approved app idea, which in turn requires a public app with an Overwolf monetization plan.

What can be done at $0 before any approval (INFERENCE): everything on the Mayhem Lab side of the `GameStateProvider` interface, that is the normalizer in `event-normalization-spec.md`, driven by fixture payloads copied from this document. No Overwolf API is touched by that work.

---

## 6. Open items that block a real provider

1. Real ARAM Mayhem `augments` / `picked_augment` payload (name format, slot count, envelope, trailing comma).
2. Proof that Overwolf `queueId` is `2400` in ARAM Mayhem.
3. Proof that `summoner_info.champion` is populated in ARAM Mayhem, and its exact string for multi-word champions.
4. Riot's position on (a) reading offered augments in-session, (b) recommending among them, (c) any augment statistics on the website.
5. Whether Overwolf accepts Mayhem Lab's monetization plan and window design.
