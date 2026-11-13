// Curated playstyle catalog.
//
// IMPORTANT: everything in this file is editorial, rules-based knowledge. It is not derived from
// match outcomes and carries no win-rate meaning. Item names are resolved against the patch
// snapshot at run time; anything missing from the patch is dropped and reported.

import type { Champion } from '@mayhem-lab/contracts';

export interface FitRule {
  /** All listed conditions must hold. */
  role?: string;
  rangeType?: Champion['rangeType'];
  damageProfile?: Champion['damageProfile'][];
  trait?: string;
  minAttack?: number;
  minMagic?: number;
  minDefense?: number;
  weight: number;
  reason: string;
}

export interface TagRule {
  weight: number;
  reason: string;
}

export interface PlaystyleDefinition {
  id: string;
  name: string;
  summary: string;
  damageType: 'physical' | 'magic' | 'mixed' | 'utility';
  fitRules: FitRule[];
  boots: string[];
  coreItems: string[];
  situationalItems: { name: string; reason: string }[];
  /** Augment tag → why it helps this playstyle. */
  synergies: Record<string, TagRule>;
  /** Augment tag → why it works against this playstyle. */
  conflicts: Record<string, TagRule>;
  strengths: string[];
  weaknesses: string[];
}

/** A champion needs at least this much rule weight for a playstyle to be offered at all. */
export const MIN_CHAMPION_FIT = 3;
/** Compatibility thresholds for the fit label. Documented in docs/architecture/recommendation-rules.md. */
export const FIT_THRESHOLDS = { strong: 7, good: 4.5 } as const;
/** One augment can add or remove at most this much, so a single card never decides the ranking alone. */
export const MAX_AUGMENT_EFFECT = 3;

const s = (weight: number, reason: string): TagRule => ({ weight, reason });

export const PLAYSTYLES: PlaystyleDefinition[] = [
  {
    id: 'crit-carry',
    name: 'Critical Strike Carry',
    summary: 'Stack attack damage and crit chance, then win long fights from the back line with basic attacks.',
    damageType: 'physical',
    fitRules: [
      { role: 'Marksman', weight: 4, reason: 'Marksman kit built around sustained basic attacks.' },
      { rangeType: 'ranged', minAttack: 7, weight: 1.5, reason: 'Ranged with a high attack rating, so crit items scale every auto.' },
      { trait: 'crit', weight: 2, reason: 'Abilities reference critical strikes directly.' },
      { role: 'Fighter', rangeType: 'melee', trait: 'crit', weight: 2, reason: 'Melee attacker whose kit scales with crit.' },
      { trait: 'attack-speed', damageProfile: ['physical'], weight: 1, reason: 'Built-in attack speed means more crits per fight.' },
    ],
    boots: ["Berserker's Greaves"],
    coreItems: ['Infinity Edge', 'Yun Tal Wildarrows', 'Phantom Dancer', "Lord Dominik's Regards"],
    situationalItems: [
      { name: "Runaan's Hurricane", reason: 'ARAM fights are clumped; bolts spread your on-attack effects.' },
      { name: 'The Collector', reason: 'Burst and execute when your team is ahead.' },
      { name: 'Bloodthirster', reason: 'Lifesteal and a shield when nobody on your team can heal you.' },
      { name: 'Mortal Reminder', reason: 'Anti-heal against healing-heavy enemy teams.' },
      { name: 'Immortal Shieldbow', reason: 'Survive burst from assassins and divers.' },
      { name: 'Rapid Firecannon', reason: 'Extra range to poke safely before fights.' },
    ],
    synergies: {
      crit: s(3, 'adds crit value directly to the stat this build stacks'),
      'attack-speed': s(2, 'more attacks means more crits'),
      'basic-attacks': s(2, 'empowers the basic attacks this build relies on'),
      'attack-damage': s(1.5, 'attack damage multiplies with crit'),
      range: s(1.5, 'extra range keeps a fragile carry safe'),
      'armor-pen': s(1, 'helps crits cut through armour'),
      'physical-damage': s(1, 'adds physical damage that your armour penetration also benefits'),
      sustain: s(1, 'lifesteal converts steady damage into survivability'),
      'on-hit': s(0.5, 'applies on every attack, though you buy few on-hit items'),
    },
    conflicts: {
      'ability-power': s(2, 'pushes toward ability power, which crit items do not provide'),
      mana: s(1, 'mana scaling is wasted on an attack-focused build'),
      ultimate: s(0.5, 'ultimate-focused value is small when damage comes from attacks'),
    },
    strengths: ['Highest sustained damage late', 'Shreds tanks with armour penetration', 'Scales with every item'],
    weaknesses: ['Fragile until three items', 'Needs peel in tight ARAM fights', 'Weak when forced to play from behind'],
  },
  {
    id: 'on-hit',
    name: 'On-Hit Attack Speed',
    summary: 'Attack very fast and let on-hit effects, not crits, do the damage. Strong against high-health teams.',
    damageType: 'mixed',
    fitRules: [
      { trait: 'on-hit', role: 'Marksman', weight: 4, reason: 'Marksman whose abilities apply or amplify on-hit effects.' },
      { trait: 'on-hit', role: 'Fighter', weight: 3, reason: 'Fighter whose abilities apply on-hit effects.' },
      { trait: 'attack-speed', weight: 1.5, reason: 'Kit grants attack speed, which every on-hit item multiplies.' },
      { role: 'Marksman', weight: 3, reason: 'Relies on basic attacks, which is all an on-hit build needs.' },
      { trait: 'attack-speed', role: 'Fighter', rangeType: 'melee', weight: 2, reason: 'Melee attacker with built-in attack speed.' },
      { trait: 'on-hit', weight: 1, reason: 'Abilities mention on-hit effects.' },
      { trait: 'empowered-attacks', minAttack: 6, weight: 0.5, reason: 'Empowered attacks apply on-hit effects too.' },
    ],
    boots: ["Berserker's Greaves"],
    coreItems: ['Blade of The Ruined King', "Guinsoo's Rageblade", 'Kraken Slayer', "Wit's End"],
    situationalItems: [
      { name: 'Terminus', reason: 'Mixed penetration plus resistances for long fights.' },
      { name: "Runaan's Hurricane", reason: 'Spreads on-hit effects across clumped enemies.' },
      { name: "Jak'Sho, The Protean", reason: 'Lets melee on-hit champions survive in the middle of the fight.' },
      { name: 'Immortal Shieldbow', reason: 'A shield against burst.' },
      { name: "Nashor's Tooth", reason: 'If your augments lean toward ability power.' },
    ],
    synergies: {
      'on-hit': s(3, 'adds another effect to every attack'),
      'attack-speed': s(3, 'attack speed multiplies every on-hit effect'),
      'basic-attacks': s(2, 'empowers the basic attacks this build relies on'),
      'magic-damage': s(1, 'on-hit builds already deal mixed damage'),
      'true-damage': s(1, 'per-hit true damage scales with attack speed'),
      sustain: s(1, 'fast attacks turn lifesteal into strong healing'),
      range: s(1, 'more range means more uninterrupted attacks'),
      'damage-over-time': s(0.5, 'fast attacks keep damage-over-time effects refreshed'),
      health: s(0.5, 'extra health helps you stay in range to keep attacking'),
    },
    conflicts: {
      crit: s(1.5, 'crit value is mostly wasted without crit items'),
      'ability-haste': s(0.5, 'cooldown value is minor when attacks do the work'),
      ultimate: s(0.5, 'ultimate-focused value is small when damage comes from attacks'),
    },
    strengths: ['Excellent into tanks and high-health teams', 'Mixed damage is hard to itemise against', 'Online after two items'],
    weaknesses: ['Short effective range', 'Lower burst than crit', 'Struggles if it cannot attack freely'],
  },
  {
    id: 'lethality',
    name: 'Lethality Burst and Poke',
    summary: 'Flat armour penetration and ability haste to delete fragile targets or poke from range with physical abilities.',
    damageType: 'physical',
    fitRules: [
      { role: 'Assassin', damageProfile: ['physical', 'mixed'], weight: 4, reason: 'Physical assassin that wants to burst one target.' },
      { damageProfile: ['physical'], trait: 'long-range-abilities', minAttack: 6, weight: 3, reason: 'Long-range physical abilities make lethality poke effective.' },
      { role: 'Marksman', damageProfile: ['physical'], trait: 'long-range-abilities', weight: 1, reason: 'Ability-based marksman that can poke instead of auto-attacking.' },
      { trait: 'stealth', damageProfile: ['physical', 'mixed'], weight: 1, reason: 'Stealth helps reach the back line.' },
      { trait: 'mobility', role: 'Assassin', weight: 1, reason: 'Mobility to get in and out.' },
      { role: 'Fighter', damageProfile: ['physical'], minAttack: 8, weight: 1.5, reason: 'High attack rating fighter that can trade durability for burst.' },
      { role: 'Marksman', damageProfile: ['physical', 'mixed'], weight: 3, reason: 'Physical abilities can be built for burst and poke instead of sustained attacks.' },
      { role: 'Fighter', damageProfile: ['physical'], trait: 'mobility', weight: 3, reason: 'Mobile physical fighter that can play for picks.' },
    ],
    boots: ['Ionian Boots of Lucidity'],
    coreItems: ["Youmuu's Ghostblade", 'The Collector', "Serylda's Grudge", 'Edge of Night'],
    situationalItems: [
      { name: 'Manamune', reason: 'For ability poke that spends a lot of mana.' },
      { name: 'Axiom Arc', reason: 'Refunds your ultimate cooldown on takedowns.' },
      { name: 'Voltaic Cyclosword', reason: 'An energised slow to start a pick.' },
      { name: 'Profane Hydra', reason: 'Area burst when enemies stack up.' },
      { name: 'Eclipse', reason: 'Extra durability and percent-health damage against bruisers.' },
      { name: "Serpent's Fang", reason: 'Against teams with many shields.' },
      { name: 'Maw of Malmortius', reason: 'Against heavy magic burst.' },
    ],
    synergies: {
      'armor-pen': s(3, 'stacks with the flat penetration this build buys'),
      'attack-damage': s(2, 'physical abilities scale with attack damage'),
      'physical-damage': s(2, 'adds physical burst that your lethality amplifies'),
      'ability-haste': s(2, 'more ability casts means more poke and more resets'),
      abilities: s(1, 'rewards casting abilities, which is how this build deals damage'),
      execute: s(2, 'finishes the low targets this build creates'),
      mobility: s(1.5, 'helps reach or escape the back line'),
      'move-speed': s(1, 'speed makes picks and escapes easier'),
      ultimate: s(1, 'burst combos lean on the ultimate'),
      'true-damage': s(1, 'adds burst that ignores resistances'),
    },
    conflicts: {
      'ability-power': s(2, 'pushes toward ability power, which this build does not buy'),
      'attack-speed': s(1, 'attack speed adds little to an ability-burst pattern'),
      crit: s(1, 'crit value is mostly wasted without crit items'),
      healing: s(0.5, 'heal and shield power has nothing to amplify here'),
    },
    strengths: ['Kills fragile carries quickly', 'Strong early and mid game', 'Good poke on long-range champions'],
    weaknesses: ['Falls off into armour stacking', 'All-in burst is risky in a single lane', 'Low sustained damage'],
  },
  {
    id: 'ap-burst',
    name: 'Ability Power Burst',
    summary: 'Raw ability power and magic penetration for one decisive spell rotation, plus poke between fights.',
    damageType: 'magic',
    fitRules: [
      { role: 'Mage', damageProfile: ['magic'], weight: 4, reason: 'Mage whose abilities deal magic damage.' },
      { role: 'Assassin', damageProfile: ['magic', 'mixed'], minMagic: 6, weight: 3.5, reason: 'Magic assassin that bursts a single target.' },
      { damageProfile: ['magic'], minMagic: 7, weight: 1.5, reason: 'High magic rating.' },
      { trait: 'long-range-abilities', damageProfile: ['magic'], weight: 1, reason: 'Long-range spells let you poke safely.' },
      { role: 'Support', damageProfile: ['magic'], trait: 'hard-cc', minMagic: 5, weight: 1, reason: 'Crowd control sets up your own burst.' },
      { role: 'Support', damageProfile: ['magic', 'mixed'], weight: 3, reason: 'Magic-damage abilities scale with ability power when the team does not need a pure support.' },
      { role: 'Tank', damageProfile: ['magic'], trait: 'hard-cc', weight: 3, reason: 'Engage abilities with magic damage can be built for burst instead of durability.' },
      { role: 'Fighter', damageProfile: ['magic'], weight: 3, reason: 'Magic-damage fighter that can trade durability for burst.' },
    ],
    boots: ["Sorcerer's Shoes"],
    coreItems: ["Luden's Echo", 'Shadowflame', "Rabadon's Deathcap", 'Void Staff'],
    situationalItems: [
      { name: "Zhonya's Hourglass", reason: 'Stasis against dive and physical burst.' },
      { name: "Banshee's Veil", reason: 'Blocks the one spell that starts the engage on you.' },
      { name: 'Horizon Focus', reason: 'More damage for long-range poke.' },
      { name: 'Lich Bane', reason: 'If you weave basic attacks between spells.' },
      { name: 'Hextech Rocketbelt', reason: 'A dash for short-range burst champions.' },
      { name: 'Cryptbloom', reason: 'Penetration with a team heal on takedowns.' },
      { name: 'Morellonomicon', reason: 'Anti-heal against healing-heavy teams.' },
      { name: "Archangel's Staff", reason: 'If mana runs out in long poke phases.' },
    ],
    synergies: {
      'ability-power': s(3, 'adds the stat this build stacks'),
      'magic-damage': s(2, 'adds magic damage that your penetration amplifies'),
      'magic-pen': s(3, 'stacks with the magic penetration this build buys'),
      abilities: s(1.5, 'rewards casting abilities, which is how this build deals damage'),
      'ability-haste': s(2, 'more spell rotations per fight'),
      ultimate: s(1.5, 'burst combos lean on the ultimate'),
      mana: s(1, 'keeps you casting through long poke phases'),
      execute: s(1.5, 'finishes the low targets your burst creates'),
      'adaptive-force': s(1, 'adaptive force becomes ability power on this build'),
      'true-damage': s(1, 'adds burst that ignores resistances'),
      range: s(0.5, 'extra range helps poke safely'),
    },
    conflicts: {
      'attack-speed': s(1.5, 'attack speed is not used by a spell-burst build'),
      crit: s(2, 'crit does nothing for spells'),
      'attack-damage': s(1.5, 'attack damage does not scale magic abilities'),
      'armor-pen': s(1.5, 'armour penetration does not affect magic damage'),
    },
    strengths: ['High burst and wave clear', 'Poke wins the lane before fights start', 'Scales hard with Deathcap'],
    weaknesses: ['Long cooldowns after a missed rotation', 'Fragile', 'Weak into stacked magic resist'],
  },
  {
    id: 'ap-sustained',
    name: 'Sustained Magic and Burn',
    summary: 'Health, ability haste and burn effects to deal magic damage over long fights instead of one rotation.',
    damageType: 'magic',
    fitRules: [
      { trait: 'damage-over-time', damageProfile: ['magic', 'mixed'], weight: 3.5, reason: 'Abilities deal damage over time, which burn items amplify.' },
      { role: 'Mage', damageProfile: ['magic', 'mixed'], weight: 3, reason: 'Mage who can trade burst for health and sustained damage.' },
      { role: 'Fighter', damageProfile: ['magic'], weight: 3, reason: 'Magic-damage fighter who stays in the fight.' },
      { role: 'Tank', damageProfile: ['magic'], minMagic: 5, weight: 1.5, reason: 'Durable magic-damage champion who fights for a long time.' },
      { trait: 'health-scaling', damageProfile: ['magic'], weight: 1, reason: 'Health scaling fits the health these items give.' },
      { trait: 'slows', damageProfile: ['magic'], weight: 0.5, reason: 'Built-in slows keep enemies inside your damage.' },
    ],
    boots: ["Sorcerer's Shoes"],
    coreItems: ["Liandry's Torment", "Rylai's Crystal Scepter", 'Riftmaker', "Rabadon's Deathcap"],
    situationalItems: [
      { name: 'Blackfire Torch', reason: 'More burn and mana for spammable spells.' },
      { name: 'Malignance', reason: 'If your ultimate is a zone or has a short cooldown.' },
      { name: 'Cosmic Drive', reason: 'Ability haste and movement speed for kiting.' },
      { name: "Bloodletter's Curse", reason: 'Shreds magic resist for the whole team in long fights.' },
      { name: "Zhonya's Hourglass", reason: 'Stasis while your damage keeps ticking.' },
      { name: 'Morellonomicon', reason: 'Anti-heal against healing-heavy teams.' },
      { name: 'Spirit Visage', reason: 'If you heal yourself and face magic damage.' },
      { name: 'Void Staff', reason: 'Against stacked magic resist.' },
    ],
    synergies: {
      'damage-over-time': s(3, 'adds or strengthens the burn this build is built around'),
      'ability-power': s(2, 'adds ability power'),
      'magic-damage': s(2, 'adds sustained magic damage'),
      'ability-haste': s(2, 'keeps spells cycling in long fights'),
      abilities: s(1.5, 'rewards frequent ability casts'),
      health: s(1.5, 'health keeps you alive while damage ticks'),
      'crowd-control': s(1, 'keeps enemies inside your damage'),
      sustain: s(1.5, 'omnivamp turns area damage into healing'),
      'magic-pen': s(2, 'stacks with burn damage'),
      mana: s(1, 'keeps spammable spells going'),
      'adaptive-force': s(1, 'adaptive force becomes ability power on this build'),
      size: s(0.5, 'extra bulk suits standing in the fight'),
    },
    conflicts: {
      crit: s(2, 'crit does nothing for spells'),
      'attack-damage': s(1.5, 'attack damage does not scale magic abilities'),
      'armor-pen': s(1.5, 'armour penetration does not affect magic damage'),
      execute: s(0.5, 'this build wins slowly rather than by bursting'),
    },
    strengths: ['Melts tanks with percent-health burn', 'Durable for a damage dealer', 'Strong in long, clumped fights'],
    weaknesses: ['Low burst', 'Needs time in the fight to pay off', 'Weak against long-range poke'],
  },
  {
    id: 'ap-on-hit',
    name: 'Hybrid Ability Power On-Hit',
    summary: 'Attack speed plus ability power so every basic attack deals bonus magic damage.',
    damageType: 'mixed',
    fitRules: [
      { trait: 'on-hit', damageProfile: ['magic', 'mixed'], rangeType: 'ranged', weight: 4, reason: 'Ranged attacker with on-hit effects and magic damage.' },
      { trait: 'on-hit', damageProfile: ['magic', 'mixed'], rangeType: 'melee', weight: 3.5, reason: 'Melee attacker with on-hit effects and magic damage.' },
      { trait: 'attack-speed', damageProfile: ['magic', 'mixed'], weight: 1.5, reason: 'Kit grants attack speed and deals magic damage.' },
      { role: 'Marksman', damageProfile: ['magic', 'mixed'], weight: 1, reason: 'Basic-attack champion with magic scaling.' },
    ],
    boots: ["Berserker's Greaves"],
    coreItems: ["Nashor's Tooth", "Guinsoo's Rageblade", "Rabadon's Deathcap", 'Lich Bane'],
    situationalItems: [
      { name: 'Dusk and Dawn', reason: 'Health, attack speed and ability power in one slot.' },
      { name: "Wit's End", reason: 'On-hit magic damage with magic resist.' },
      { name: 'Riftmaker', reason: 'Omnivamp and health for extended fights.' },
      { name: "Zhonya's Hourglass", reason: 'Stasis against dive.' },
      { name: 'Void Staff', reason: 'Against stacked magic resist.' },
      { name: 'Blade of The Ruined King', reason: 'Against very high health teams.' },
    ],
    synergies: {
      'on-hit': s(3, 'adds another effect to every attack'),
      'attack-speed': s(3, 'attack speed multiplies your on-hit magic damage'),
      'ability-power': s(2.5, 'ability power scales the on-hit damage'),
      'basic-attacks': s(2, 'empowers the basic attacks this build relies on'),
      'magic-damage': s(1.5, 'adds magic damage alongside your attacks'),
      'magic-pen': s(1.5, 'most of this build\'s damage is magic'),
      'adaptive-force': s(1, 'adaptive force becomes ability power on this build'),
      sustain: s(1, 'fast attacks turn omnivamp into strong healing'),
      range: s(1, 'more range means more uninterrupted attacks'),
    },
    conflicts: {
      crit: s(2, 'crit value is wasted without crit items'),
      'armor-pen': s(1.5, 'armour penetration does not affect magic damage'),
    },
    strengths: ['Mixed damage is hard to itemise against', 'Strong duelling and tower pressure', 'Scales with both attack speed and ability power'],
    weaknesses: ['Must stay in basic attack range', 'Item-hungry', 'Less burst than a pure ability power build'],
  },
  {
    id: 'bruiser',
    name: 'Bruiser Skirmisher',
    summary: 'Attack damage with health and ability haste to dive, survive the first rotation, and keep fighting.',
    damageType: 'physical',
    fitRules: [
      { role: 'Fighter', damageProfile: ['physical', 'mixed'], weight: 4, reason: 'Fighter who deals physical damage at close range.' },
      { role: 'Fighter', rangeType: 'melee', weight: 1, reason: 'Melee fighter that needs durability to reach targets.' },
      { role: 'Assassin', rangeType: 'melee', damageProfile: ['physical', 'mixed'], weight: 3, reason: 'Melee assassin that can trade burst for survivability in ARAM.' },
      { role: 'Tank', damageProfile: ['physical', 'mixed'], weight: 3, reason: 'Durable champion with meaningful physical damage.' },
      { trait: 'healing', role: 'Fighter', weight: 1, reason: 'Self-healing gets more value from health and resistances.' },
      { trait: 'health-scaling', damageProfile: ['physical'], rangeType: 'melee', weight: 0.5, reason: 'Abilities scale with health.' },
    ],
    boots: ["Mercury's Treads", 'Plated Steelcaps'],
    coreItems: ['Black Cleaver', 'Sundered Sky', "Sterak's Gage", "Death's Dance"],
    situationalItems: [
      { name: 'Spear of Shojin', reason: 'For ability-spam fighters.' },
      { name: 'Trinity Force', reason: 'For fighters who weave attacks between abilities.' },
      { name: 'Eclipse', reason: 'Early burst and a shield in short trades.' },
      { name: 'Stridebreaker', reason: 'A slow to stick to ranged targets.' },
      { name: 'Titanic Hydra', reason: 'If your augments lean toward health.' },
      { name: 'Endless Hunger', reason: 'Omnivamp and tenacity for drawn-out fights.' },
      { name: 'Maw of Malmortius', reason: 'Against heavy magic burst.' },
      { name: 'Chempunk Chainsword', reason: 'Anti-heal against healing-heavy teams.' },
      { name: "Overlord's Bloodmail", reason: 'Converts stacked health into attack damage.' },
    ],
    synergies: {
      health: s(2, 'health makes your dive survivable'),
      'attack-damage': s(2, 'adds the damage stat this build scales with'),
      'physical-damage': s(1.5, 'adds physical damage in extended fights'),
      sustain: s(2.5, 'omnivamp and lifesteal keep you fighting'),
      healing: s(1.5, 'healing stretches further on a durable champion'),
      shielding: s(1, 'shields stretch further on a durable champion'),
      'ability-haste': s(1.5, 'more ability casts in extended fights'),
      resistances: s(1.5, 'resistances multiply your health'),
      mobility: s(1.5, 'helps reach the back line'),
      'move-speed': s(1.5, 'helps a melee champion reach targets'),
      tenacity: s(2, 'shrugs off the crowd control that stops a dive'),
      'basic-attacks': s(1, 'fighters weave basic attacks between abilities'),
      size: s(1, 'extra bulk suits a front-to-back fighter'),
      'adaptive-force': s(1, 'adaptive force becomes attack damage on this build'),
      abilities: s(0.5, 'rewards frequent ability casts'),
    },
    conflicts: {
      'ability-power': s(2, 'pushes toward ability power, which this build does not buy'),
      'magic-pen': s(1.5, 'magic penetration does not affect physical damage'),
      range: s(0.5, 'range bonuses matter little at melee distance'),
    },
    strengths: ['Hard to kill and still threatening', 'Strong mid-game fights', 'Punishes fragile back lines'],
    weaknesses: ['Kited by long-range teams', 'Out-scaled by true carries late', 'Needs to commit to fights'],
  },
  {
    id: 'tank',
    name: 'Frontline Tank',
    summary: 'Health and resistances to start fights, absorb damage and lock enemies down for your team.',
    damageType: 'utility',
    fitRules: [
      { role: 'Tank', weight: 4, reason: 'Tank class with a kit built to absorb damage.' },
      { minDefense: 7, weight: 1.5, reason: 'High defence rating.' },
      { trait: 'hard-cc', role: 'Tank', weight: 1, reason: 'Crowd control makes the frontline role valuable.' },
      { trait: 'health-scaling', minDefense: 5, weight: 1, reason: 'Abilities scale with health.' },
      { role: 'Fighter', minDefense: 6, trait: 'hard-cc', weight: 1.5, reason: 'Durable fighter with crowd control can flex to the front line.' },
      { role: 'Fighter', rangeType: 'melee', minDefense: 5, weight: 3, reason: 'Melee fighter with enough base durability to build as a front line.' },
      { role: 'Support', rangeType: 'melee', trait: 'hard-cc', weight: 1.5, reason: 'Melee support with engage tools.' },
    ],
    boots: ["Mercury's Treads", 'Plated Steelcaps'],
    coreItems: ['Heartsteel', 'Sunfire Aegis', "Jak'Sho, The Protean", 'Thornmail'],
    situationalItems: [
      { name: 'Kaenic Rookern', reason: 'Against magic-heavy teams.' },
      { name: 'Force of Nature', reason: 'Against sustained magic damage.' },
      { name: "Randuin's Omen", reason: 'Against crit carries.' },
      { name: 'Frozen Heart', reason: 'Against attack-speed teams.' },
      { name: 'Spirit Visage', reason: 'If your kit or team heals and shields you.' },
      { name: 'Unending Despair', reason: 'Drain healing in long fights.' },
      { name: "Warmog's Armor", reason: 'Regeneration between fights when there is no recall.' },
      { name: 'Hollow Radiance', reason: 'Magic resist with wave clear.' },
      { name: 'Abyssal Mask', reason: 'Amplifies your team\'s magic damage.' },
      { name: 'Locket of the Iron Solari', reason: 'A team shield against area burst.' },
    ],
    synergies: {
      health: s(3, 'adds the stat this build stacks'),
      resistances: s(3, 'resistances multiply your health'),
      size: s(1.5, 'extra bulk suits a frontline'),
      'crowd-control': s(2, 'more lockdown from the champion already in the middle of the fight'),
      shielding: s(2, 'shields stretch further on high resistances'),
      healing: s(1.5, 'healing stretches further on high resistances'),
      tenacity: s(2, 'keeps you moving after you engage'),
      'move-speed': s(1.5, 'helps start fights'),
      mobility: s(1, 'helps start fights'),
      'damage-over-time': s(1, 'aura and burn damage scale with time spent in the fight'),
      sustain: s(1, 'drain healing scales with time spent in the fight'),
      'ability-haste': s(1, 'more frequent engage and crowd control'),
    },
    conflicts: {
      crit: s(2, 'crit is wasted on a tank build'),
      'attack-speed': s(1, 'attack speed adds little without damage items'),
      'armor-pen': s(1.5, 'penetration is wasted on a tank build'),
      'magic-pen': s(1.5, 'penetration is wasted on a tank build'),
      'ability-power': s(1, 'ability power adds little without damage items'),
      range: s(0.5, 'range bonuses matter little on the front line'),
    },
    strengths: ['Starts and survives fights', 'Useful even from behind', 'Regeneration and health stack well in ARAM'],
    weaknesses: ['Low damage', 'Depends on teammates to follow up', 'Vulnerable to percent-health damage'],
  },
  {
    id: 'enchanter',
    name: 'Enchanter Support',
    summary: 'Heal and shield power with ability haste to keep allies alive and stronger through every fight.',
    damageType: 'utility',
    fitRules: [
      { role: 'Support', trait: 'ally-support', rangeType: 'ranged', weight: 6, reason: 'Ranged support whose abilities heal, shield or buff allies.' },
      { trait: 'ally-support', role: 'Support', weight: 1, reason: 'Abilities target allies.' },
      { trait: 'healing', role: 'Support', rangeType: 'ranged', weight: 1.5, reason: 'Has a heal for heal power to amplify.' },
      { trait: 'shielding', role: 'Support', rangeType: 'ranged', weight: 1, reason: 'Has a shield for shield power to amplify.' },
      { trait: 'ally-support', role: 'Mage', minMagic: 5, weight: 1.5, reason: 'Mage with tools that protect or empower allies.' },
    ],
    boots: ['Ionian Boots of Lucidity'],
    coreItems: ['Moonstone Renewer', 'Redemption', 'Ardent Censer', 'Staff of Flowing Water'],
    situationalItems: [
      { name: 'Dawncore', reason: 'Converts mana regeneration into heal and shield power late.' },
      { name: "Mikael's Blessing", reason: 'Cleanses crowd control from a carry.' },
      { name: "Shurelya's Battlesong", reason: 'Team movement speed to engage or escape.' },
      { name: 'Locket of the Iron Solari', reason: 'A team shield against area burst.' },
      { name: 'Imperial Mandate', reason: 'If your kit applies crowd control more than healing.' },
      { name: 'Echoes of Helia', reason: 'If you deal damage often enough to charge it.' },
      { name: "Knight's Vow", reason: 'To protect one fed carry.' },
      { name: 'Morellonomicon', reason: 'Anti-heal against healing-heavy teams.' },
    ],
    synergies: {
      healing: s(3, 'amplifies or adds healing'),
      shielding: s(3, 'amplifies or adds shielding'),
      'ability-haste': s(2.5, 'more heals and shields per fight'),
      mana: s(1.5, 'keeps you casting'),
      abilities: s(1, 'rewards frequent ability casts'),
      'move-speed': s(1.5, 'helps you stay in range of allies and out of danger'),
      'crowd-control': s(1.5, 'more peel for your carries'),
      'ability-power': s(1, 'ability power scales heals and shields'),
      'summoner-spell': s(1, 'extra utility from the back line'),
      resistances: s(0.5, 'helps a fragile support survive'),
    },
    conflicts: {
      crit: s(2, 'crit is wasted on a support build'),
      'attack-speed': s(1.5, 'attack speed is rarely used by an enchanter'),
      'armor-pen': s(2, 'penetration is wasted on a support build'),
      'attack-damage': s(1.5, 'attack damage does not scale heals or shields'),
      execute: s(0.5, 'this build enables allies rather than finishing kills'),
    },
    strengths: ['Makes the whole team harder to kill', 'Cheap, early power spikes', 'Always useful regardless of gold'],
    weaknesses: ['Very low damage', 'Depends on allies to win fights', 'Fragile when focused'],
  },
];

/**
 * Curated notes for specific augments whose effect cannot be read from tags alone.
 * Keyed by API name. `supports`/`opposes` list playstyle damage types.
 */
export const AUGMENT_OVERRIDES: Record<
  string,
  { supports?: PlaystyleDefinition['damageType'][]; opposes?: PlaystyleDefinition['damageType'][]; weight: number; reason: string }
> = {
  ARAM_ADAPt: {
    supports: ['magic'],
    opposes: ['physical'],
    weight: 3,
    reason: 'converts bonus attack damage into ability power',
  },
};
