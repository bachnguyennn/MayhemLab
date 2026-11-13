# DRAFT — NOT SENT

**Status: internal draft only. Nothing has been submitted to Riot Games, Overwolf or anyone else. Do not send without the project owner's sign-off.**

Intended channel (when approved internally): product registration / support ticket on the Riot Developer Portal (https://developer.riotgames.com/). Placeholders in [brackets] must be filled in first.

---

**Subject:** Mayhem Lab — product registration and policy questions for an ARAM: Mayhem build planner (website now, Overwolf app later)

Hello Riot Developer Relations,

I am registering Mayhem Lab, a free fan-made build-planning tool for ARAM: Mayhem, and would like confirmation on several points before building further.

**Developer:** [name / contact email]
**Product URL / mockups:** [link]

## What exists today (website)

- The player manually selects a champion and the augments they have taken.
- The site shows several complete build archetypes ("playstyles"): items, augment synergies and a written explanation of why they fit.
- Recommendations are qualitative and rules-based. The site shows no win rates of any kind.
- Data: Data Dragon for champions and items. Augment names, descriptions and icons from CommunityDragon.
- No Riot API key is used. No player accounts, no player lookup, no match history.
- Free to use. The required legal boilerplate is shown on every page.

## What we would like to build later (Overwolf app)

- An Overwolf app for League of Legends that reads the local player's champion and their own picked augments (Overwolf game events `augments` / `picked_augment`) so the player does not have to type them in.
- When the player's own augment selection changes, the app shows the same archetype content as the website: multiple build options with explanations.
- It would not: show win rates; show information about enemies or anything not visible in the client; track cooldowns or timers; push notifications telling the player what to do; automate any input.

## Questions

1. **Scope of the augment win-rate rule.** The League of Legends policy says "Products cannot display win rates for Augments or Arena Mode items. This applies to all websites, applications and overlays." Does this apply to ARAM: Mayhem augments? We assume yes and show none.
2. **Tiers.** May a product show tier labels (for example S to F) for augments or for whole playstyles?
   a. if the tiers are editorial / rules-based with no statistical input;
   b. if the tiers are derived from match win rates but no numbers are shown.
3. **Playstyle-level statistics.** Is a win rate for a full build archetype (a combination of items and augments, not an individual augment) treated the same as an augment win rate?
4. **Internal research.** May we analyse match data privately to inform our written, qualitative recommendations, if no win rates or derived rankings are displayed? Is ARAM: Mayhem match data available through the API for this purpose, and which key type would be required?
5. **Real-time recommendations.** Is an in-game overlay that updates its suggested build options when the player picks an augment acceptable, given that it always presents multiple options and never a single instruction? Or does this fall under "Apps that dictate player decisions"?
6. **Timing.** If in-game display is not acceptable, would the same content be acceptable in a second-screen/desktop window, or only outside an active game?
7. **Auto-detection.** Is reading the local player's own offered and picked augments through Overwolf game events permitted for this purpose?
8. **CommunityDragon.** Is using CommunityDragon for augment names, descriptions and icons acceptable, or is there a supported Riot source for ARAM: Mayhem augment data we should use instead?
9. **Monetization.** The general policy says ads may not be placed "in-game". Overwolf requires Overwolf monetization for new apps and documents opt-in ad rules for overlays in Riot games. What ad placement, if any, is acceptable for a League of Legends Overwolf app? Are standard web ads on the free website acceptable once the product is Approved or Acknowledged?
10. **Registration.** Is a single product registration sufficient for the website and the later Overwolf app, with the app submitted as a feature change for audit?

We will not build or release the Overwolf features, any statistics-derived content, or any monetization until we have your answer.

Thank you,
[name]

---

## Internal notes (not part of the message)

- Policy basis for each question is in [feature-matrix.md](feature-matrix.md) and [policy-sources.md](policy-sources.md).
- Overwolf states that apps integrating Riot games must seek Riot approval "even if you do not intend to use the Riot API itself", and will be asked for it at publication. A separate Overwolf app proposal is also required; the proposal page could not be read on 2026-11-13 (HTTP 404), so its exact requirements are UNVERIFIED.
- Before sending: attach mockups or a working link. Riot's docs say they need "a link to a working site, mockup, prototype, or rendering where it is easy to understand the user flows of the tool."
