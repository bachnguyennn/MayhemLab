import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const pickChampion = async (page: Page, name: string) => {
  await page.goto('/#/explore');
  await page.getByLabel('Search champions').fill(name.slice(0, 3));
  await page.locator(`[data-champion="${name}"]`).click();
  await expect(page.getByTestId('session-champion')).toHaveText(name);
};
const addAugment = async (page: Page, name: string) => {
  await page.getByLabel('Search augments').fill(name);
  await page.getByTestId('augment-list').getByRole('button', { name: new RegExp(`^${name}`) }).first().click();
};

test.beforeEach(async ({ page }) => {
  // Start each test with empty storage, but keep it across reloads within the test.
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-init')) {
      localStorage.clear();
      sessionStorage.setItem('e2e-init', '1');
    }
  });
});

test('landing explains the product and opens the explorer', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Now what do you build?');
  await expect(page.getByTestId('riot-disclaimer')).toContainText("isn't endorsed by Riot Games");
  await page.getByTestId('start').click();
  await expect(page.getByRole('heading', { name: 'Who are you playing?' })).toBeVisible();
});

test('champion, augment, playstyles, then a second augment updates results', async ({ page }) => {
  await pickChampion(page, 'Jinx');
  await expect(page.getByTestId('change-note')).toHaveAttribute('data-change', 'initial');
  const rows = page.getByTestId('playstyle-list').locator('[data-playstyle]');
  expect(await rows.count()).toBeGreaterThanOrEqual(2);

  await addAugment(page, 'Deft');
  await expect(page.getByTestId('selected-augments').getByText('Deft')).toBeVisible();
  await expect(page.locator('[data-playstyle="on-hit"] [data-interaction="synergy"]')).toContainText('Deft');
  await expect(page).toHaveURL(/c=Jinx&a=\d+/);

  await addAugment(page, 'ADAPt');
  await expect(page.getByTestId('selected-augments').locator('li')).toHaveCount(2);
  await expect(page.locator('[data-playstyle="crit-carry"] [data-interaction="conflict"]')).toContainText('ADAPt');
  await expect(page.getByTestId('change-note')).not.toHaveAttribute('data-change', 'initial');

  // Full build detail is open on the first playstyle.
  const first = rows.first();
  await expect(first.getByText('Situational items')).toBeVisible();
  await expect(first.getByText('Strengths')).toBeVisible();
});

test('session survives refresh, augments can be removed, and reset starts over', async ({ page }) => {
  await pickChampion(page, 'Lux');
  await addAugment(page, 'Archmage');
  await page.reload();
  await expect(page.getByTestId('session-champion')).toHaveText('Lux');
  await expect(page.getByTestId('selected-augments').getByText('Archmage')).toBeVisible();

  await page.getByRole('button', { name: 'Remove Archmage' }).click();
  await expect(page.getByTestId('selected-augments')).toHaveCount(0);
  await expect(page.getByTestId('change-note')).toHaveAttribute('data-change', 'initial');

  await page.getByTestId('reset').click();
  await expect(page.getByRole('heading', { name: 'Who are you playing?' })).toBeVisible();
});

test('a shared link restores the session; unknown ids are dropped, not guessed', async ({ page }) => {
  await page.goto('/#/explore?c=Jinx&a=999999');
  await expect(page.getByTestId('session-champion')).toHaveText('Jinx');
  await expect(page.getByTestId('selected-augments')).toHaveCount(0);
});

test('an unknown champion in a link falls back to the picker', async ({ page }) => {
  await page.goto('/#/explore?c=NotAChampion');
  await expect(page.getByRole('heading', { name: 'Who are you playing?' })).toBeVisible();
});

test('a session saved on another patch is cleared with an explanation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mayhem-lab:session:v1', JSON.stringify({ championId: 'Jinx', patch: '1.0.0', selectedAugmentIds: [] }));
  });
  await page.goto('/#/explore');
  await expect(page.getByTestId('restore-notice')).toContainText('avoid mixing patches');
});

test('empty searches show an empty state with a way out', async ({ page }) => {
  await page.goto('/#/explore');
  await page.getByLabel('Search champions').fill('zzzzzz');
  await expect(page.getByText('No champion matches that search')).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByTestId('champion-grid').locator('li').first()).toBeVisible();

  await page.locator('[data-champion="Garen"]').click();
  await page.getByLabel('Search augments').fill('zzzzzz');
  await expect(page.getByText('No augment matches')).toBeVisible();
});

test('unavailable images and network errors fall back to text without breaking the flow', async ({ page }) => {
  await page.route(/ddragon\.leagueoflegends\.com|communitydragon\.org/, (r) => r.abort());
  await pickChampion(page, 'Jinx');
  await addAugment(page, 'Deft');
  await expect(page.getByRole('img', { name: 'Jinx' })).toBeVisible();
  await expect(page.locator('[data-playstyle]').first()).toBeVisible();
});

test('patch page shows versions, sources and gaps', async ({ page }) => {
  await page.goto('/#/patch');
  await expect(page.getByTestId('patch-facts')).toContainText('Data Dragon version');
  await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  await expect(page.getByText('sha256').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Known gaps' })).toBeVisible();
});

test('compliance: no win rates, pick rates or tier grades are rendered', async ({ page }) => {
  await pickChampion(page, 'Jinx');
  await addAugment(page, 'Deft');
  const closed = page.getByRole('button', { name: 'Show full build' });
  while ((await closed.count()) > 0) await closed.first().click();
  const text = await page.locator('main').innerText();
  expect(text).not.toMatch(/\d+(\.\d+)?\s?%\s*(win|pick)/i);
  expect(text).not.toMatch(/\b(win|pick) ?rate:?\s*\d/i);
  expect(text).not.toMatch(/\b(S\+|[SABCDF])[- ]tier\b/i);
  expect(text).toContain('Not win rates');
});

test('keyboard only: pick a champion and an augment', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hardware keyboard flow');
  await page.goto('/#/explore');
  await page.getByLabel('Search champions').focus();
  await page.keyboard.type('garen');
  await page.locator('[data-champion="Garen"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('session-champion')).toHaveText('Garen');
  await page.getByLabel('Search augments').focus();
  await page.keyboard.type('Goliath');
  await page.getByTestId('augment-list').getByRole('button').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('selected-augments').getByText('Goliath')).toBeVisible();
});

test('no horizontal overflow at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await pickChampion(page, 'Jinx');
  await addAugment(page, 'Deft');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const [name, hash] of [
  ['landing', '/#/'],
  ['champion picker', '/#/explore'],
  ['explorer results', '/#/explore?c=Jinx'],
  ['patch page', '/#/patch'],
] as const) {
  test(`accessibility: ${name} has no serious or critical violations`, async ({ page }) => {
    await page.goto(hash);
    if (hash.includes('c=Jinx')) await addAugment(page, 'Deft');
    await page.waitForTimeout(700); // let the settle animation finish before contrast checks
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  });
}
