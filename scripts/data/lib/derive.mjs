// Pure derivation rules shared by the ingestion script and its tests.
// Every tag below is derived from text published in the game data. Nothing is hand-assigned
// per champion or per augment, so the output is reproducible from the snapshot sources.

/** Ordered rules: tag -> regular expression tested against the raw (markup-preserving) text. */
export const AUGMENT_TAG_RULES = [
  ['attack-speed', /<attackspeed>|attack speed/i],
  ['on-hit', /<onhit>|on-hit|on hit/i],
  ['crit', /<crit>|critical strike|crit chance|critically/i],
  ['basic-attacks', /basic attack|attacks?(?! (?:damage|speed|range))|hail of blades|press the attack|lethal tempo/i],
  ['adaptive-force', /adaptive force/i],
  ['ability-power', /<scaleap>|ability power/i],
  ['attack-damage', /<scalead>|attack damage/i],
  ['magic-damage', /<magicdamage>|magic damage/i],
  ['physical-damage', /<physicaldamage>|physical damage/i],
  ['true-damage', /<truedamage>|true damage/i],
  ['armor-pen', /<scalelethality>|<armorpen>|lethality|armor penetration/i],
  ['magic-pen', /<magicpen>|magic penetration/i],
  ['ability-haste', /<scaleabilityhaste>|ability haste|cooldowns?\b/i],
  ['abilities', /\babilit(?:y|ies)\b|\bspells?\b(?! shield)/i],
  ['ultimate', /\bultimate\b/i],
  ['mana', /<scalemana>|\bmana\b/i],
  ['healing', /<healing>|\bheal(?:s|ed|ing)?\b|restore.{0,20}health/i],
  ['shielding', /<shield>|\bshield(?:s|ed|ing)?\b/i],
  ['sustain', /<omnivamp>|<lifesteal>|omnivamp|life steal/i],
  ['health', /<scalehealth>|max(?:imum)? health|bonus health|\bhealth\b/i],
  ['resistances', /<scalearmor>|<scalemr>|\barmor\b(?! penetration)|magic resist/i],
  ['move-speed', /move(?:ment)? speed/i],
  ['crowd-control', /\bstun|\broot|knock(?:s|ed|ing)? (?:up|back|away|aside)|\bimmobiliz|\bfear|\bcharm|\btaunt|\bslow(?:s|ed|ing)?\b/i],
  ['damage-over-time', /\bburn|damage over|per second|\bbleed/i],
  ['mobility', /\bdash|\bblink|\bleap|\bteleport/i],
  ['range', /attack range|\brange\b/i],
  ['summoner-spell', /summoner spell/i],
  ['economy', /<gold>|\bgold\b|\banvil|\bshop\b/i],
  ['size', /\bsize\b|larger|\bgrow/i],
  ['tenacity', /tenacity/i],
  ['execute', /\bexecute/i],
  ['quest', /\bquest\b/i],
];

export function deriveAugmentTags(rawText) {
  if (!rawText) return [];
  const tags = [];
  for (const [tag, re] of AUGMENT_TAG_RULES) if (re.test(rawText)) tags.push(tag);
  return tags;
}

/**
 * Turn game markup into readable text. Numeric placeholders (`@Name@`) are not resolved by the
 * source files we ingest, so they are replaced by "X" and the caller is told so; we never guess.
 */
export function cleanDescription(raw) {
  if (!raw) return { text: '', unresolvedValues: false };
  let unresolved = false;
  let t = raw
    .replace(/\{\{[^}]*\}\}/g, () => {
      unresolved = true;
      return '';
    })
    .replace(/%i:[^%]*%/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/@[^@\n]{1,80}@/g, () => {
      unresolved = true;
      return 'X';
    })
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
  return { text: t, unresolvedValues: unresolved };
}

export const CHAMPION_TRAIT_RULES = [
  ['on-hit', /on-hit|on hit/i],
  ['attack-speed', /attack speed/i],
  ['crit', /critical|critically/i],
  ['empowered-attacks', /next (?:basic )?attack|empower(?:s|ed)? (?:her|his|its|their)? ?(?:next|basic)|basic attacks? (?:deal|gain|become)/i],
  ['healing', /\bheal(?:s|ed|ing)?\b|restor(?:e|es|ing) .{0,24}health/i],
  ['shielding', /\bshield(?:s|ed|ing)?\b/i],
  ['ally-support', /all(?:y|ied|ies)\b.{0,60}(?:heal|shield|bonus|grant|speed)|(?:heal|shield|grant)\w* .{0,40}all(?:y|ied|ies)\b/i],
  ['hard-cc', /\bstun|\broot|knock(?:s|ed|ing)? (?:up|back|away|aside|them)|airborne|\bsuppress|\bcharm|\btaunt|\bfear|\bsleep|\bpolymorph|\bsnare|\bpull(?:s|ed|ing)?\b/i],
  ['slows', /\bslow(?:s|ed|ing)?\b/i],
  ['mobility', /\bdash(?:es|ing)?\b|\bleap|\bblink|\blunge|\bvault|\bteleport/i],
  ['stealth', /invisib|camoufl|stealth/i],
  ['health-scaling', /max(?:imum)? health|bonus health|missing health|current health/i],
  ['mana-scaling', /max(?:imum)? mana|bonus mana/i],
  ['damage-over-time', /per second|damage over|\bburn|\bbleed|\bpoison/i],
  ['resets', /reset|refund/i],
  ['summons', /\bsummon|\bpet\b|\bturret|\bclone/i],
  ['execute', /\bexecute/i],
  ['stacking', /\bstack/i],
];

/** Champion traits derived from Data Dragon ability text and base stats. */
export function deriveChampionTraits(champ) {
  const texts = [champ.passive?.description ?? ''];
  let magic = 0;
  let physical = 0;
  let maxRange = 0;
  for (const s of champ.spells ?? []) {
    texts.push(s.description ?? '', s.tooltip ?? '');
    magic += ((s.tooltip ?? '').match(/<magicDamage>/g) ?? []).length;
    physical += ((s.tooltip ?? '').match(/<physicalDamage>/g) ?? []).length;
    for (const r of s.range ?? []) if (r > maxRange && r < 20000) maxRange = r;
  }
  const blob = texts.join('\n');
  const traits = [];
  for (const [tag, re] of CHAMPION_TRAIT_RULES) if (re.test(blob)) traits.push(tag);
  if (maxRange >= 1100) traits.push('long-range-abilities');
  const total = magic + physical;
  let damageProfile = 'unknown';
  if (total > 0) {
    const share = magic / total;
    damageProfile = share >= 0.7 ? 'magic' : share <= 0.3 ? 'physical' : 'mixed';
  }
  return {
    traits,
    damageProfile,
    rangeType: (champ.stats?.attackrange ?? 0) >= 300 ? 'ranged' : 'melee',
  };
}

export function displayPatch(ddragonVersion) {
  const [maj, min] = ddragonVersion.split('.');
  return { majorMinor: `${maj}.${min}`, display: `${Number(maj) + 10}.${min}` };
}
