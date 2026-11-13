import { chromium } from '@playwright/test';
const out = process.argv[2];
const b = await chromium.launch();
for (const [name, w, h, url, full] of [
  ['landing', 1440, 900, '/#/', false],
  ['picker', 1440, 900, '/#/explore', false],
  ['explorer', 1440, 1000, '/#/explore?c=Jinx&a=1205', true],
  ['explorer-m', 390, 844, '/#/explore?c=Jinx&a=1205', false],
  ['landing-m', 390, 844, '/#/', false],
]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('http://localhost:4173' + url);
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/${name}.png`, fullPage: full });
  await p.close();
}
await b.close();
