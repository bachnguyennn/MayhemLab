# Policy Sources

All pages accessed 2026-11-13. Quotes are short excerpts retrieved with an automated fetch tool that returns fragments, not full page dumps. **Before relying on any quote for a launch decision, a human should re-open the URL and confirm the wording in context.** Anything not read directly is marked UNVERIFIED.

This is a research summary, not legal advice.

---

## 1. Riot Developer Portal — General Policies

URL: https://developer.riotgames.com/policies/general

Registration
- "All products must be registered in, and audited by Riot Games through the Developer Portal"
- "Any new features or changes to a product must be audited through the product's page in the Developer Portal"
- "Products should use supported services from Riot Games for data ingestion"

Required boilerplate
- "You must post the following legal boilerplate to your product in a location that is readily visible to players"
- "[Your product] isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc." (reassembled from three consecutive fragments)

Permitted assets
- "Use the following assets in the development and marketing of your product:" — listed: Data Dragon, Press Kit, TFT Assets, LoR Assets.
- "Using Riot logos, trademarks etc. from the Press Kit must be limited to those cases where such use is inevitable" ... "to serve the core value of the product."
- "Products cannot closely resemble Riot's games or products in style or function"

Game integrity
- "Products cannot create an unfair advantage for players, like a cheating program or giving some players an advantage that others would not otherwise have."
- "Products should increase, and not decrease the diversity of game decisions (builds, compositions, characters, decks)."
- "Products should not remove game decisions, but may highlight decisions that are important and give multiple choices to help players make good decisions."
- "Products cannot create alternatives for official skill ranking systems such as the ranked ladder."

Monetization
- "You may monetize your product as long as your product is registered on the Developer Portal and your product status is either Approved or Acknowledged."
- "You must have a free tier of access for players, which may include advertising"
- "Your content must be transformative if you are charging players for it"
- Acceptable charges: "Subscriptions, donations, or crowdfunding"; "Entry fees for tournaments"; "Currencies that cannot be exchanged back into fiat"
- "You may not place advertisements in Riot properties, which include in-game, loading screens, and the Riot Client."
- "Your product cannot feature betting or gambling functionality."

Not on this page: the words augment, win rate, Arena, ARAM, Mayhem, overlay, real-time. No sentence about scraping. No definition of "Approved" vs "Acknowledged".

## 2. Riot Developer Portal — League of Legends docs (Game Policy)

URL: https://developer.riotgames.com/docs/lol

Registration
- "If your product serves players, you must register it with us regardless of whether or not your product uses official documented APIs."
- "You must make sure its description and metadata are kept up to date with the current version of your product."

Unapproved use cases ("The following use cases will not be approved:")
- **"Products cannot display win rates for Augments or Arena Mode items. This applies to all websites, applications and overlays."**
- "Products may not provide any game-session-specific information that would be previously unknown to the player."
- "Apps that dictate player decisions."
- "Apps that violate the general game policies."

Approved use cases (examples)
- "Game overlays that provide static data that is available prior to the game."
- "Aggregate player stats (no specific players)."
- "Training tools that allow players to view their own match histories and aggregate stats."

Game integrity (LoL-specific addition)
- "Products must not use or incorporate information not present in the game client that would give players a competitive edge (e.g., automatically or manually allowing tracking enemy ultimate cooldowns) especially when such data is not already accessible through regular gameplay."

League Client API
- "This service is not officially supported for use with third party applications."
- "Whether you're combining the Riot Games API and League Client API, or doing something by only using the League Client endpoints, we need to know about it."

Data Dragon
- "Data Dragon is our way of centralizing League of Legends game data and assets."
- "All of which can be used by third-party developers."
- "Updating Data Dragon after each League of Legends patch is a manual process."
- No explicit licence text for Data Dragon was found on the page.

Key findings
- The win-rate rule names **"Augments"** (unqualified) and **"Arena Mode items"**. **"ARAM" and "Mayhem" do not appear** in the Game Policy section. "real-time" does not appear. TFT is not named in this section.
- CommunityDragon is not mentioned anywhere on the page.

## 3. Riot Developer Portal — Portal docs (keys)

URL: https://developer.riotgames.com/docs/portal

- Development key: for "products that are not meant for public consumption"; expires every 24 hours.
- "Personal API keys should be used for products that are intended for just the developer or a small private community." Limits: 20 requests / 1 s, 100 / 2 min per region. Personal research is listed as an allowed use.
- "You may not run your application for public consumption using a personal key."
- "Production API keys should be used for products that are intended for large communities or the Internet as a whole." Starting limits: 500 / 10 s, 30,000 / 10 min per region.
- "Securing your API key is a requirement to publishing a project"
- No text on data storage, scraping, augments, win rates, ARAM or Mayhem.

## 4. Riot "Legal Jibber Jabber"

URL: https://www.riotgames.com/en/legal ("Last Updated: August 2018")

- Scope: "strictly for noncommercial (except as specifically provided below) community use."
- Riot may deny IP use "at any time, for any reason or no reason."
- Notice: "If you share your Project with others, please conspicuously include the following notice (e.g., on your Project's website):"
  - "[The title of your Project] was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project."
- Ads: "We permit individual players to promote their Projects on websites, streams, or videos and passively generate revenue through appropriate advertisements, including pre-roll ads, ad breaks, and sponsor ad overlays." / "No inappropriate ads—we alone decide what qualifies as inappropriate."
- "We prohibit the use of our IP in games and apps."
- "we do not allow any Projects on the Apple Store or Google Play Store unless they have either a written license agreement from us or a valid Riot API key"
- Commercial API projects: "We permit commercial Projects that both (1) comply with our [API terms] ... use a currently valid Riot API key that we granted to you specifically for your Project." / "If we revoke your API key for any reason, you must immediately shut down your Project."
- "You may not use any of our logos or trademarks anywhere in your Project" (without a written licence). No Riot names in domain names or social accounts.
- "You may not use a third party's IP in your Project without their permission."

## 5. CommunityDragon

URLs: https://github.com/CommunityDragon/Docs/blob/master/README.md (read) · https://www.communitydragon.org/ (**UNVERIFIED** — returned HTTP 522 today)

- "CommunityDragon (also referred to as cdragon) is an open-source organization" that scrapes and hosts Riot client data.
- "CommunityDragon was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project."
- Says it "has been acknowledged by Riot through the Riot Developer Portal."
- "The usage of CommunityDragon does not pose a risk to your API key."
- "CommunityDragon operates on good faith"
- "Beware that CDN will be deprecated in the future" (RAW is the long-term endpoint).
- **No licence or terms of use are stated** for the data. The underlying assets are Riot IP.
- Spot check: `https://raw.communitydragon.org/latest/cdragon/arena/en_us.json` returns an `augments` array (fields include `apiName`, `desc`, `iconLarge`, `iconSmall`, `id`, `name`, `rarity`, `tooltip`). This is the Arena file. **UNVERIFIED:** which CommunityDragon path holds ARAM: Mayhem augments.

## 6. League of Legends Wiki

URL: https://wiki.leagueoflegends.com/en-us/League_of_Legends_Wiki:Copyrights

- Text is licensed "CC-BY-SA 3.0", covering contributed work "with the exception of" Riot Games' intellectual property.
- Attribution: e.g. "a hyperlink or URL to the article or articles you contributed to" or "a list of all authors."
- Share-alike: adaptations must be distributed "under the same license."
- Riot-owned images and assets are excluded from the CC licence and fall under Legal Jibber Jabber.
- **UNVERIFIED:** whether the port is "Unported" or another CC BY-SA 3.0 variant.

## 7. arammayhem.com data page

URL: https://arammayhem.com/data/

- What: a third-party fan site offering per-patch ARAM: Mayhem pick-rate data (champions, augments, combos, items) as JSON/CSV.
- Operator: not named. Contact address only (arammayhem@gmail.com). No company or legal entity stated.
- Licence: "The data is licensed under Creative Commons Attribution 4.0 (CC BY 4.0)." / "You may use, copy, change and republish this data, including in commercial work."
- Credit: "Data: arammayhem.com" with a link.
- "It does not include win rates, tiers, or rankings built from win rates."
- "Riot asks developers not to publish Mayhem win rates for augments, so we keep them out of anything meant for reuse." — **no Riot source is linked for this claim; treat as that site's reading of policy, not as Riot's words.**
- Data provenance: "These statistics reflect the available ARAM: Mayhem match sample." The source is not named.
- Disclaimer: "ARAM Mayhem is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games"
- Caveat: the site's CC BY grant covers only what the operator can license. It is not evidence that Riot permits any use, and its existence proves nothing about what is allowed.

## 8. Overwolf — Riot Games compliance

URL: https://dev.overwolf.com/ow-native/guides/game-compliance/riot-games

- "If you wish to integrate your app with any of Riot's games, you are required to seek their approval through their 3rd party application process."
- "These guidelines hold even if you do not intend to use the Riot API itself."
- "apps which reach the publication phase and do not yet possess a Riot approval will be asked to provide one before proceeding."
- "Avoid using the official Riot Logo."
- LoL — "It is strictly prohibited to provide:"
  - "Notifications that alert players when a power spike hits" (example: "X champion has hit level 6")
  - "Notifications that dictate player action based on the current game state" (example: "enemy champion is underleveled, go gank top lane")
  - "Tracking of enemy ability cooldowns, or facilitating players tracking these with timers."
  - "The use of Ultimate timers is strictly forbidden since this may provide an unfair advantage."
- "Riot Games does NOT approve any Brawl related data being aggregated or visible on third-party products/apps."
- TFT section: "Do not display Augment Win rates" / "Do not display Augment average game placements" / "Do not display Legend Win rates"
- **"ARAM" and "Mayhem" do not appear on this page.** Augments are mentioned only under TFT. Part of the LoL section rendered as "Loading..." in the fetch, so it may be incomplete.

## 9. Overwolf — Riot in-game ads rules

URL: https://dev.overwolf.com/ow-native/guides/game-compliance/riot-in-game-ads

- "Overlays that display ads must be explicitly enabled by the user through an opt-in action"
- "Any large overlay, or window with an ad shown over gameplay must include a dimmed background"
- "Overlays must be placed so they don't cover important UI elements, such as minimaps, scoreboards"
- "Ads must always be part of a screen or overlay that provides real value or content to the user."
- "You must not show subscription offers or upgrade CTAs inside any in-game overlay"
- "Your overlay should never look like it's part of the official Riot game UI."

## 10. Overwolf — Monetization

URL: https://dev.overwolf.com/ow-native/monetization/overview

- "From November 1, 2026, Overwolf only approves apps with Overwolf monetization."
- Apps must integrate "Overwolf ads, subscriptions powered by Tebex, or both." "Overwolf won't approve apps that don't."
- "Overwolf doesn't approve private apps intended for personal use."
- Revenue share percentage is not stated on the page ("the agreed revenue share"; $200 minimum payout).

## 11. Overwolf — LoL game events (GEP)

URL: https://dev.overwolf.com/ow-native/live-game-data-gep/supported-games/league-of-legends

- Feature `augments`, category `me`:
  - key `augments` — "List of available augments in ARAM Mayhem mode." (since GEP 299.0)
  - key `picked_augment` — "The last augment that the player picked in ARAM Mayhem mode." (since GEP 299.0)
- No compliance notes are attached to these keys. Technical availability is not permission to use them.

---

## Could not verify today

| Item | Status |
|---|---|
| https://www.communitydragon.org/ | UNVERIFIED — HTTP 522 |
| Overwolf proposal / app-creation pages (`/ow-native/getting-started/submitting-an-app-proposal`, `/app-creation-process`) | UNVERIFIED — HTTP 404. Process details (concept review, QA, whitelisting) seen only in search snippets |
| Any Riot statement naming ARAM: Mayhem in connection with augment win rates | NOT FOUND in any Riot page read |
| arammayhem.com's claim that "Riot asks developers not to publish Mayhem win rates" | UNVERIFIED — no Riot source linked |
| Search-snippet claim that OP.GG Desktop removed a Mayhem feature "in accordance with Riot's policies" | UNVERIFIED — patch-notes page returned 404 |
| Whether ARAM: Mayhem matches are exposed through Riot's match API | UNVERIFIED — not checked against the API reference |
| Meaning of "Approved" vs "Acknowledged" product status | UNVERIFIED — not defined on pages read |
| Riot Developer Terms of Use / API Terms (linked from the policies) | NOT READ |
| Terms of service of third-party stat sites (op.gg, u.gg, etc.) | NOT READ |
| Current status of TFT augment-stat policy (a news headline suggests Riot changed course) | UNVERIFIED — article not read |
