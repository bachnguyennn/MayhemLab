# Feature Compliance Matrix

Assessed 2026-11-13 against the sources in [policy-sources.md](policy-sources.md). Research summary, not legal advice.

Classifications: **Supported** = Supported by verified policy · **Approval** = Requires explicit approval · **Prohibited** = Prohibited under currently documented policy · **Unclear** = Unclear; needs clarification.

## Precondition for everything

Riot requires registration even with no API key: "If your product serves players, you must register it with us regardless of whether or not your product uses official documented APIs." (https://developer.riotgames.com/docs/lol). A Data Dragon-only website is not exempt. Every "Supported" row below assumes the product is registered on the Developer Portal and shows the required boilerplate.

## Matrix

| # | Feature | Classification | Basis | Source |
|---|---|---|---|---|
| 1 | Static champion/item metadata from Data Dragon | Supported by verified policy | Data Dragon assets "can be used by third-party developers"; Data Dragon is on the general policy's list of usable assets. | docs/lol; policies/general |
| 2 | Champion/item/augment images | Supported by verified policy (Data Dragon images only) | Champion and item images from Data Dragon are covered by row 1. Augment icons are not confirmed to be in Data Dragon; if sourced from CommunityDragon they fall under row 3. No Riot logos: "You may not use any of our logos or trademarks anywhere in your Project". | docs/lol; policies/general; riotgames.com/en/legal |
| 3 | Augment names + descriptions from CommunityDragon | Unclear; needs clarification | CommunityDragon states no licence; its docs say it operates under Legal Jibber Jabber and "has been acknowledged by Riot". Riot's own pages do not mention it, and the general policy says "Products should use supported services from Riot Games for data ingestion". Content is Riot IP, so Legal Jibber Jabber's noncommercial terms apply. Widely used in practice, but not expressly authorised in any Riot text read. | CommunityDragon Docs README; policies/general |
| 4 | Qualitative rules-based build archetypes on a website (pre/post-game, manual input) | Supported by verified policy | "Products should not remove game decisions, but may highlight decisions that are important and give multiple choices to help players make good decisions." Present several archetypes, not one mandated build. No win rates. | policies/general |
| 5 | Showing augment win rates | Prohibited under currently documented policy | "Products cannot display win rates for Augments or Arena Mode items. This applies to all websites, applications and overlays." "Augments" is unqualified; ARAM: Mayhem is not named, but nothing limits the rule to Arena. | docs/lol |
| 6 | Playstyle tiers (S+..F) derived from augment/playstyle win rates | Unclear; needs clarification | The rule bans displaying "win rates". A tier letter computed from augment win rates is a bucketed form of the same data and may be treated as a workaround. No Riot text read addresses tiers. Tiers based on editorial/rules-based judgement are a different case (row 4). **Do not ship win-rate-derived tiers until Riot answers.** | docs/lol |
| 7 | Internal-only statistical research on match data | Unclear; needs clarification | The rule restricts what products "display". Personal keys list personal research as an allowed use. Not confirmed: whether Mayhem match data is available via the API, and whether research whose outputs shape a public product counts as "personal". | docs/portal; docs/lol |
| 8 | Collecting match data through the Riot API (personal/production key) | Requires explicit approval | "You may not run your application for public consumption using a personal key." A public product needs a production key, granted only after Riot reviews the use case. Legal Jibber Jabber: if the key is revoked "you must immediately shut down your Project." | docs/portal; docs/lol; riotgames.com/en/legal |
| 9 | Scraping third-party stat sites | Unclear; needs clarification | Riot: "Products should use supported services from Riot Games for data ingestion". Legal Jibber Jabber: "You may not use a third party's IP in your Project without their permission." The scraped sites' own terms were not read. Scraping to obtain augment win rates for display would fall under row 5 regardless. **Recommendation: do not do this.** | policies/general; riotgames.com/en/legal |
| 10 | Overwolf in-game overlay that auto-detects picked augments | Requires explicit approval | Overwolf: "you are required to seek their approval through their 3rd party application process", and apps without Riot approval at publication "will be asked to provide one before proceeding." Overwolf GEP does expose `augments` and `picked_augment` for ARAM Mayhem, but that is capability, not permission. The player's own picks are already known to them, which is consistent with the "previously unknown" rule. | Overwolf riot-games compliance; Overwolf LoL GEP page; docs/lol |
| 11 | Real-time in-game build recommendations reacting to augment picks | Requires explicit approval | Not expressly banned, not expressly allowed. Riot will not approve "Apps that dictate player decisions"; Overwolf prohibits "Notifications that dictate player action based on the current game state". Riot permits tools that "highlight decisions" and "give multiple choices". The only explicitly approved overlay example is "static data that is available prior to the game". Whether a multi-option, non-statistical recommendation reacting to live picks is acceptable is the key open question for Riot. | docs/lol; policies/general; Overwolf riot-games compliance |
| 12 | Ads/monetization | Requires explicit approval | Riot: monetization allowed only when "your product status is either Approved or Acknowledged", with "a free tier of access for players, which may include advertising". "You may not place advertisements in Riot properties, which include in-game, loading screens, and the Riot Client." Overwolf separately requires its own monetization from 2026-11-01 and has opt-in rules for in-overlay ads. | policies/general; Overwolf monetization overview; Overwolf riot-in-game-ads |

## Notes on the hard calls

**Row 5 — does the win-rate rule cover ARAM: Mayhem?** The sentence does not name the mode. A plain reading of "win rates for Augments ... all websites, applications and overlays" covers Mayhem augments. A third-party site (arammayhem.com) says "Riot asks developers not to publish Mayhem win rates for augments" but cites no Riot source. Several stat sites reportedly display Mayhem augment win rates; that is not evidence of permission. Treat as prohibited.

**Row 11 — real-time recommendations.** Design constraints that keep the request credible: always present multiple options, never a single "pick this"; no win rates or win-rate-derived ranks; no information the player could not see in the client; no notifications pushing an action.

**Row 12 — tension to resolve.** Riot's general policy forbids ads "in-game", while Overwolf publishes rules for opt-in ads inside overlays in Riot games and now requires Overwolf monetization for approval. Which governs for a LoL overlay is a question for both parties. A free website with ordinary web ads is the low-risk path once the product is registered and Approved/Acknowledged.

## Milestone implications

- **Website v1 (rows 1, 2, 4):** viable now, subject to Developer Portal registration and disclaimers. Use rules-based archetypes with explanations; no win rates, no win-rate-derived tiers.
- **Augment data (row 3):** proceed with caution; raise in the Riot registration description.
- **Statistics pipeline (rows 6-9):** blocked on Riot clarification and a production key.
- **Overwolf app (rows 10-12):** blocked on Riot approval, then Overwolf concept approval and QA.
