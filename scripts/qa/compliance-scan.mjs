#!/usr/bin/env node
// Compliance boundary scan. Fails if anything that looks like a published statistic, a tier
// grade or a secret reaches a public surface: the built site or the public data snapshot.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const findings = [];

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// 1. The snapshot must not carry outcome statistics.
const FORBIDDEN_KEYS = /"(winRate|win_rate|pickRate|pick_rate|banRate|sampleSize|estimatedWinRate|wins|matches|tierRank)"\s*:/;
for (const f of walk(join(root, 'packages', 'game-data', 'snapshot'))) {
  const m = FORBIDDEN_KEYS.exec(readFileSync(f, 'utf8'));
  if (m) findings.push(`${f}: forbidden statistic key "${m[1]}"`);
}

// 2. The public web app must not import the research statistics package.
for (const f of walk(join(root, 'apps', 'web', 'src'))) {
  if (/@mayhem-lab\/statistics/.test(readFileSync(f, 'utf8'))) findings.push(`${f}: web app imports the research statistics package`);
}

// 3. The built site must not contain statistic patterns or secrets, and must carry the disclaimer.
const dist = join(root, 'apps', 'web', 'dist');
if (!existsSync(dist)) {
  findings.push('apps/web/dist is missing: run "npm run build" first');
} else {
  const PATTERNS = [
    [/\d{1,2}(?:\.\d+)?\s?%\s*(?:win|pick)\s?rate/i, 'percentage win/pick rate'],
    [/(?:win|pick)\s?rate\s*[:=]\s*\d/i, 'win/pick rate value'],
    [/["'>](?:S\+|[SABCDF])[- ]tier["'<]/, 'tier grade label'],
    [/RGAPI-[0-9a-f-]{20,}/i, 'Riot API key'],
    [/gh[pousr]_[A-Za-z0-9]{30,}/, 'GitHub token'],
  ];
  const files = walk(dist).filter((p) => /\.(js|html|css|json)$/.test(p));
  let all = '';
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    all += text;
    for (const [re, label] of PATTERNS) if (re.test(text)) findings.push(`${f}: ${label}`);
  }
  if (!all.includes("isn't endorsed by Riot Games")) findings.push('built site is missing the Riot disclaimer');
}

if (findings.length) {
  console.error('Compliance scan FAILED:\n' + findings.map((f) => ' - ' + f).join('\n'));
  process.exit(1);
}
console.log('Compliance scan passed: no statistics, tier grades or secrets on public surfaces; Riot disclaimer present.');
