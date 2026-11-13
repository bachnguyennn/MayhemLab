# Approval checklist: before a real Overwolf provider may be enabled

Every item starts unchecked. The real `GameStateProvider` stays disabled (manual input only) until **every** item in sections A to F is checked, with the evidence recorded next to it (link, email, date, name of the person who confirmed).

References like "R 4.3" point to sections of `integration-research.md` (sources read 2026-11-13). Policies change; re-read the source page before checking an item.

## A. Riot Games

- [ ] Product registered on the Riot Developer Portal, describing both the website and the Overwolf app (R 4.2).
- [ ] Riot product status is "Approved" or "Acknowledged", and the written confirmation is saved (R 4.2, R 4.5).
- [ ] Riot has answered in writing: may the app **read the player's picked augments** during an ARAM: Mayhem match and update a build plan from them? (R 4.4)
- [ ] Riot has answered in writing: may the app read the **offered** augments (`augments` key) at all? Until yes, the key stays unused (spec 5.4).
- [ ] Riot has answered in writing: does "Products cannot display win rates for Augments or Arena Mode items" cover ARAM: Mayhem augments? Until answered, treat as yes (R 4.4).
- [ ] Riot has answered in writing whether the TFT rule "augment data can't be displayed on third-party apps" has any equivalent for ARAM: Mayhem (R 1.4).
- [ ] Every feature change after approval is re-submitted for audit on the product's portal page before release (R 4.2).
- [ ] The Riot legal boilerplate ("... isn't endorsed by Riot Games ...") is visible in the app and on the website (R 4.2).
- [ ] No official Riot logo is used; any Riot asset comes from Data Dragon or the Press Kit only (R 4.2).
- [ ] The app does not closely resemble Riot's game UI in style or function (R 4.2, R 4.5 rule 6).
- [ ] If the League Client (LCU) or launcher events are used, that use is declared in the Riot registration (R 4.2).
- [ ] A free tier exists; nothing essential is paywalled (R 4.5).
- [ ] No ads are placed in-game, on loading screens, or in the Riot Client, or Riot has confirmed in writing that the planned placement is acceptable (R 4.5).

## B. Overwolf

- [ ] App idea submitted through the Overwolf app proposal form (R 4.1).
- [ ] DevRel has classed the app as **Public**; the design is not a "faceless bridge" to the website (R 4.1).
- [ ] Approval email received and the developer account is whitelisted (R 4.1, R 5).
- [ ] Framework chosen (Native or Electron) and recorded.
- [ ] `manifest.json` validated against Overwolf's schema; `game_targeting` and `game_events` list game id 5426 only; `launch_events` only for games the app supports (R 1.1).
- [ ] App has at least one desktop window showing that it is running (R 4.1).
- [ ] Only the features in R 1.2 are requested; `team_frames`, `jungle_camps`, `abilities`, `chat` are not requested.
- [ ] Hotkey to open/close, rebindable, with a visible reminder (R 4.1).
- [ ] In-game window is dismissible, not persistent during active play, and does not cover minimap, scoreboard, shop, ability bar or menus (R 4.3, R 4.5).
- [ ] App has its own name, window header and visual identity (R 4.3).
- [ ] A user support channel exists and is linked from the app (R 4.3).
- [ ] The app checks `https://game-events-status.overwolf.com/5426_prod.json` and tells the user when the `augments`, `summoner_info` or `matchState` features are not green (R 1.3).
- [ ] GEP data is not written to any log file (R 1.5).
- [ ] Tested at the resolutions and DPI settings in Overwolf's testing guide; tested offline; tested mid-game install (source S22).
- [ ] `.opk` built with normal compression, with required icons (R 4.1).
- [ ] Submitted to DevRel QA and all QA feedback resolved (R 4.1).
- [ ] Overwolf has confirmed it has seen the Riot approval from section A (R 4.2).
- [ ] Developer Console access granted; store listing complete.

## C. Overwolf LoL compliance rules

- [ ] No notification when a power spike is hit (R 4.3).
- [ ] No notification that dictates player action based on the current game state (R 4.3).
- [ ] No tracking of enemy ability cooldowns, and nothing that helps players time them (R 4.3).
- [ ] No tracking of enemy summoner spell cooldowns (R 4.3).
- [ ] No ultimate timers (R 4.3).
- [ ] No display of other players' summoner names during ranked champion select (not planned; confirm absent) (R 4.3).
- [ ] No Brawl data and no League Classic data collected, aggregated or shown (R 4.3).
- [ ] No push of runes or items; if ever added, disabled for the KR region (R 4.3).
- [ ] Nothing in the app encourages queue dodging or player discrimination (R 4.3).

## D. Monetization

- [ ] Decision recorded: Overwolf ads, Tebex subscriptions, or both. One of them is mandatory for approval since 2026-11-01 (R 4.5).
- [ ] Overwolf has confirmed in writing that the chosen plan satisfies the requirement for a free fan-made app (R 4.5).
- [ ] No third-party monetization, no third-party ad iframes, no ads outside Overwolf's ad platform inside the app (R 4.5).
- [ ] Ad containers follow Overwolf's ad policy: next to app content, never alone in a window, opacity untouched, at most one video container per page, none on dead-end screens (R 4.5).
- [ ] Riot in-game ads rule 1: no ad-bearing window opens in-game without an explicit user action.
- [ ] Rule 2: any large ad-bearing overlay dims the game and has a clear way back.
- [ ] Rule 3: no overlay hides important game UI.
- [ ] Rule 4: no floating ads.
- [ ] Rule 5: no subscription or ad-removal call-to-action inside any in-game overlay.
- [ ] Rule 6: app is visually distinct from Riot's UI (no game fonts, colors or interface elements).
- [ ] The conflict between Riot's "no advertisements in-game" and Overwolf's in-game ad rules is resolved in writing for this app (R 4.5).
- [ ] Revenue share and payment terms (NET 60, $200 minimum, Payoneer, USD) read and accepted by the project owner; revenue share percentage obtained from Overwolf (R 4.5).
- [ ] Ads verified with the test flag, then approved by Overwolf QA before being enabled (R 5, R 4.5).
- [ ] The website's "free, fan-made" statement is still accurate once the app carries ads or a subscription; wording updated if not.

## E. Recommendation behaviour

- [ ] No augment win rates, pick rates presented as win likelihood, or average placements are shown anywhere: app, overlay **and website** (R 4.4).
- [ ] Recommendations always offer several options with reasons; the UI never shows a single "pick this" instruction (R 4.4).
- [ ] Recommendations are built from static data available before the match (champion kit, augment descriptions, item data), not from live information about other players (R 4.4).
- [ ] No game-session-specific information that the player could not already see in their own client is shown (R 4.4).
- [ ] No enemy-team data is read or used by the recommender.
- [ ] The recommender does not reduce choice diversity by design (for example no "only correct build" framing) (R 4.4).
- [ ] The offered-augment list is not consumed unless section A explicitly permits it.
- [ ] Recommendations appear only at allowed moments and never as an alert or pop-up triggered by game state (R 4.3).
- [ ] The engine output for auto-detected state is identical to its output for the same state entered manually on the website (same function, same data).
- [ ] The user can turn auto-detection off and return to manual input.

## F. Technical verification (needs a whitelisted account and a real match)

- [ ] A real ARAM: Mayhem `picked_augment` payload has been captured and its exact shape recorded (envelope, slot keys, slot count, empty-slot value).
- [ ] The augment `name` format is confirmed and mapped to the Mayhem Lab / CommunityDragon augment ids; every augment in the current patch resolves.
- [ ] `matchState.queueId` is confirmed to be `2400` in ARAM: Mayhem; behaviour in normal ARAM (450), Arena (1700/1710), Summoner's Rift and custom games confirmed as "ignored".
- [ ] `summoner_info.champion` is confirmed present in ARAM: Mayhem and resolves to a Data Dragon id for every champion, including Fiddlesticks, Wukong, Nunu, Renata Glasc and multi-word names.
- [ ] Reset confirmed across two consecutive matches without closing the client.
- [ ] Behaviour confirmed when the app starts mid-match.
- [ ] Repeated identical updates produce no duplicate notifications.
- [ ] Assumptions A1 to A7 in `event-normalization-spec.md` each marked confirmed or corrected.
- [ ] All test cases in `event-normalization-spec.md` section 10 pass against the implementation.
- [ ] Minimum GEP / Overwolf client version that carries the `augments` feature (documented since GEP 299.0) is set in the manifest.
- [ ] Privacy: summoner name, Riot ID, account id and match id are not sent to the website or any server, and not stored. Only `championId`, `patch`, `selectedAugmentIds` cross the provider boundary.

## G. Sign-off

- [ ] Project owner has reviewed sections A to F with evidence attached.
- [ ] Date of last policy re-read recorded (Riot general policies, Riot LoL game policy, Overwolf Riot compliance, Overwolf Riot in-game ads, Overwolf monetization).
- [ ] The provider is enabled behind a switch that can be turned off remotely if Riot or Overwolf withdraws approval or an event goes red.
