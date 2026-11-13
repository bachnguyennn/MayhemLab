#!/usr/bin/env node
// Patch-aware ingestion: downloads official/static sources, normalises them, validates them and
// writes a reproducible snapshot to packages/game-data/snapshot/.
//
//   node scripts/data/ingest.mjs            # latest Data Dragon version
//   node scripts/data/ingest.mjs 16.22.1    # a specific version
//
// No API key, no scraping of HTML pages, no paid services.
import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanDescription, deriveAugmentTags, deriveChampionTraits, displayPatch } from './lib/derive.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = join(ROOT, 'packages', 'game-data', 'snapshot');
const DD = 'https://ddragon.leagueoflegends.com';
const CD = 'https://raw.communitydragon.org';
const HOWLING_ABYSS = '12';

const sources = [];

async function fetchText(url, attempts = 4) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(300_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw new Error(`Failed to fetch ${url}: ${lastErr?.message}`);
}

async function fetchJson(url, meta) {
  const text = await fetchText(url);
  sources.push({
    ...meta,
    url,
    retrievedAt: new Date().toISOString(),
    sha256: createHash('sha256').update(text).digest('hex'),
    bytes: Buffer.byteLength(text),
  });
  return JSON.parse(text);
}

function assert(cond, msg) {
  if (!cond) throw new Error(`Ingestion validation failed: ${msg}`);
}

const RARITY = { kSilver: 'silver', kGold: 'gold', kPrismatic: 'prismatic' };

function findAugmentText(strings, apiName) {
  const n = apiName.toLowerCase();
  const compact = n.replace(/_/g, '');
  const variants = [...new Set([n, compact, n.replace(/_active$/, '')])];
  const mayhem = [];
  const arena = [];
  for (const v of variants) {
    mayhem.push(
      `kiwi_${v}_summary`, `kiwi_${v}_tooltip`, `kiwi_aram_${v}_summary`, `kiwi_aram_${v}_tooltip`,
      `kiwi_${v}_description`, `kiwi_${v}_desc`, `kiwi_augment_${v}_summary`, `kiwi_augment_${v}_tooltip`,
      `kiwi_augment_${v}_desc`, `kiwi_aram_augment_${v}_desc`, `kiwi_aram_augment_${v}_tooltip`,
      `aram_augment_${v}_desc`, `aram_augment_${v}_tooltip`,
    );
    arena.push(`cherry_${v}_summary`, `cherry_${v}_tooltip`, `cherry_${v}_tooltipdescription`, `augment_${v}_desc`, `augment_${v}_summary`);
  }
  for (const k of mayhem) if (strings[k]?.trim()) return { raw: strings[k], source: 'mayhem', key: k };
  for (const k of arena) if (strings[k]?.trim()) return { raw: strings[k], source: 'arena-shared', key: k };
  return { raw: '', source: 'missing', key: null };
}

async function main() {
  const versions = await fetchJson(`${DD}/api/versions.json`, {
    id: 'ddragon-versions',
    name: 'Riot Data Dragon — version list',
    licence: "Riot Games static data; used under Riot's Legal Jibber Jabber policy",
  });
  const version = process.argv[2] ?? versions[0];
  assert(versions.includes(version), `unknown Data Dragon version ${version}`);
  const patch = displayPatch(version);
  console.log(`Ingesting Data Dragon ${version} (patch ${patch.display})`);

  const champFull = await fetchJson(`${DD}/cdn/${version}/data/en_US/championFull.json`, {
    id: 'ddragon-champions',
    name: 'Riot Data Dragon — championFull.json',
    licence: "Riot Games static data; used under Riot's Legal Jibber Jabber policy",
  });
  const itemData = await fetchJson(`${DD}/cdn/${version}/data/en_US/item.json`, {
    id: 'ddragon-items',
    name: 'Riot Data Dragon — item.json',
    licence: "Riot Games static data; used under Riot's Legal Jibber Jabber policy",
  });

  // CommunityDragon keeps per-patch trees named "<major>.<minor>". Fall back to "latest" and
  // verify the content version so patches are never silently mixed.
  let cdPatch = patch.majorMinor;
  let cdMeta;
  try {
    cdMeta = await fetchJson(`${CD}/${cdPatch}/content-metadata.json`, {
      id: 'cdragon-metadata',
      name: 'CommunityDragon — content-metadata.json',
      licence: 'Community-extracted Riot game files; no explicit licence stated (see docs/compliance)',
    });
  } catch {
    cdPatch = 'latest';
    cdMeta = await fetchJson(`${CD}/latest/content-metadata.json`, {
      id: 'cdragon-metadata',
      name: 'CommunityDragon — content-metadata.json',
      licence: 'Community-extracted Riot game files; no explicit licence stated (see docs/compliance)',
    });
  }
  assert(
    String(cdMeta.version).startsWith(`${patch.majorMinor}.`),
    `CommunityDragon content version ${cdMeta.version} does not match Data Dragon ${version}`,
  );
  const cdBase = `${CD}/${cdPatch}`;
  const augmentIndex = await fetchJson(`${cdBase}/plugins/rcp-be-lol-game-data/global/default/v1/cherry-augments.json`, {
    id: 'cdragon-augments',
    name: 'CommunityDragon — cherry-augments.json (augment ids, names, rarities, icons)',
    licence: 'Community-extracted Riot game files; no explicit licence stated (see docs/compliance)',
  });
  const stringTable = await fetchJson(`${cdBase}/game/en_us/data/menu/en_us/lol.stringtable.json`, {
    id: 'cdragon-stringtable',
    name: 'CommunityDragon — lol.stringtable.json (augment description text)',
    licence: 'Community-extracted Riot game files; no explicit licence stated (see docs/compliance)',
  });
  const strings = stringTable.entries;

  // ---- Champions -------------------------------------------------------------------------
  const champions = Object.values(champFull.data)
    .map((c) => {
      const d = deriveChampionTraits(c);
      return {
        id: c.id,
        key: Number(c.key),
        name: c.name,
        title: c.title,
        patch: version,
        roles: c.tags,
        resource: c.partype || 'None',
        attackRange: c.stats.attackrange,
        rangeType: d.rangeType,
        ratings: { attack: c.info.attack, defense: c.info.defense, magic: c.info.magic },
        damageProfile: d.damageProfile,
        traits: d.traits,
        imageUrl: `${DD}/cdn/${version}/img/champion/${c.image.full}`,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));

  // ---- Items -----------------------------------------------------------------------------
  const EXCLUDED_TAGS = new Set(['Consumable', 'Trinket', 'Jungle', 'Vision', 'GoldPer']);
  const items = Object.entries(itemData.data)
    .filter(([id, it]) => {
      if (!it.maps?.[HOWLING_ABYSS] || !it.gold?.purchasable) return false;
      if (it.requiredChampion || it.requiredAlly) return false;
      if (Number(id) >= 100000) return false; // mode-specific duplicates
      if (it.tags.some((t) => EXCLUDED_TAGS.has(t))) return false;
      return true;
    })
    .map(([id, it]) => {
      const isBoots = it.tags.includes('Boots');
      return {
        id: Number(id),
        name: it.name,
        patch: version,
        summary: it.plaintext ?? '',
        stats: it.stats ?? {},
        tags: it.tags,
        cost: it.gold.total,
        buildsFrom: (it.from ?? []).map(Number),
        buildsInto: (it.into ?? []).map(Number),
        kind: isBoots ? 'boots' : !it.into?.length && it.gold.total >= 2000 ? 'completed' : 'component',
        imageUrl: `${DD}/cdn/${version}/img/item/${it.image.full}`,
      };
    })
    .sort((a, b) => a.id - b.id);

  // ---- Augments (ARAM: Mayhem set) -------------------------------------------------------
  const report = { missingDescriptions: [], arenaSharedDescriptions: [], unresolvedValues: 0, untagged: [] };
  const augments = augmentIndex
    .filter((a) => typeof a.augmentNameId === 'string' && a.augmentNameId.startsWith('ARAM_'))
    .map((a) => {
      const apiName = a.augmentNameId.slice('ARAM_'.length);
      const found = findAugmentText(strings, apiName);
      const { text, unresolvedValues } = cleanDescription(found.raw);
      const tags = deriveAugmentTags(found.raw);
      if (found.source === 'missing') report.missingDescriptions.push(a.nameTRA);
      if (found.source === 'arena-shared') report.arenaSharedDescriptions.push(a.nameTRA);
      if (unresolvedValues) report.unresolvedValues++;
      if (found.source !== 'missing' && tags.length === 0) report.untagged.push(a.nameTRA);
      const iconPath = String(a.augmentSmallIconPath ?? '')
        .replace(/^\/lol-game-data\/assets\//i, '')
        .toLowerCase();
      return {
        id: String(a.id),
        apiName: a.augmentNameId,
        name: a.nameTRA,
        description: text,
        descriptionSource: found.source,
        unresolvedValues,
        tier: RARITY[a.rarity] ?? 'unknown',
        patch: version,
        tags,
        iconUrl: iconPath ? `${cdBase}/plugins/rcp-be-lol-game-data/global/default/${iconPath}` : undefined,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'en') || a.id.localeCompare(b.id));

  // ---- Validation ------------------------------------------------------------------------
  assert(champions.length >= 160, `only ${champions.length} champions`);
  assert(new Set(champions.map((c) => c.id)).size === champions.length, 'duplicate champion ids');
  assert(champions.every((c) => c.name && c.roles.length > 0), 'champion without name or roles');
  assert(items.filter((i) => i.kind === 'completed').length >= 60, 'too few completed items');
  assert(new Set(items.map((i) => i.id)).size === items.length, 'duplicate item ids');
  assert(augments.length >= 100, `only ${augments.length} Mayhem augments`);
  assert(new Set(augments.map((a) => a.id)).size === augments.length, 'duplicate augment ids');
  assert(augments.every((a) => a.name), 'augment without a name');
  assert(augments.every((a) => a.tier !== 'unknown'), 'augment with unknown rarity');

  // ---- Changelog against the previous snapshot -------------------------------------------
  let changelog = [];
  const manifestPath = join(OUT, 'manifest.json');
  if (existsSync(manifestPath)) {
    const prev = JSON.parse(await readFile(manifestPath, 'utf8'));
    changelog = prev.changelog ?? [];
    if (prev.dataDragonVersion !== version) {
      const prevAug = JSON.parse(await readFile(join(OUT, 'augments.json'), 'utf8'));
      const prevItems = JSON.parse(await readFile(join(OUT, 'items.json'), 'utf8'));
      const prevChamps = JSON.parse(await readFile(join(OUT, 'champions.json'), 'utf8'));
      const diff = (before, after, key = 'id') => {
        const b = new Map(before.map((x) => [String(x[key]), x.name]));
        const a = new Map(after.map((x) => [String(x[key]), x.name]));
        return {
          added: [...a].filter(([k]) => !b.has(k)).map(([, n]) => n),
          removed: [...b].filter(([k]) => !a.has(k)).map(([, n]) => n),
          renamed: [...a].filter(([k, n]) => b.has(k) && b.get(k) !== n).map(([k, n]) => `${b.get(k)} → ${n}`),
        };
      };
      changelog.unshift({
        from: prev.dataDragonVersion,
        to: version,
        date: new Date().toISOString().slice(0, 10),
        champions: diff(prevChamps, champions),
        items: diff(prevItems, items),
        augments: diff(prevAug, augments),
      });
    }
  }
  if (changelog.length === 0) {
    changelog.push({ from: null, to: version, date: new Date().toISOString().slice(0, 10), note: 'Initial snapshot.' });
  }

  const manifest = {
    schemaVersion: 1,
    dataDragonVersion: version,
    patch: patch.display,
    patchNote: `Display patch ${patch.display} corresponds to Data Dragon ${version} (Data Dragon major = season − 10).`,
    communityDragonPatch: cdPatch,
    communityDragonContentVersion: cdMeta.version,
    generatedAt: new Date().toISOString(),
    counts: { champions: champions.length, items: items.length, augments: augments.length },
    quality: report,
    sources,
    changelog,
  };

  await mkdir(OUT, { recursive: true });
  const write = (name, data) => writeFile(join(OUT, name), JSON.stringify(data, null, 1) + '\n');
  await write('champions.json', champions);
  await write('items.json', items);
  await write('augments.json', augments);
  await write('manifest.json', manifest);
  console.log(JSON.stringify({ counts: manifest.counts, quality: { ...report, missingDescriptions: report.missingDescriptions.length, arenaShared: report.arenaSharedDescriptions.length, arenaSharedDescriptions: undefined } }, null, 1));
  if (report.missingDescriptions.length) console.log('Missing descriptions:', report.missingDescriptions.join(', '));
  if (report.untagged.length) console.log('Untagged:', report.untagged.join(', '));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
