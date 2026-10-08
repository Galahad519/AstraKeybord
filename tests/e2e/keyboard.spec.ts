import { test, expect } from '@playwright/test';
const target = 'Le soleil se couchait doucement derrière les immeubles de Paris.';
test('typing, fallback, accents, controls, debug and accessible activation', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const centre = page.locator('[data-position="centre"]');
  const first = await centre.getAttribute('data-char');
  await centre.click();
  await expect(page.getByRole('textbox')).toHaveText(first!);
  await expect(page.getByTestId('hit-rate')).toContainText('100.0');
  await page.getByRole('button', { name: 'Autres lettres', exact: false }).click();
  await page.getByRole('button', { name: 'Insérer é', exact: true }).click();
  await expect(page.getByRole('textbox')).toHaveText(`${first}é`);
  await expect(page.getByRole('group', { name: 'Alphabet complet' })).toHaveCount(0);
  await expect(page.getByTestId('hit-rate')).toContainText('50.0');
  await page.getByRole('button', { name: 'espace' }).click();
  await page.getByRole('button', { name: 'Apostrophe' }).click();
  await page.getByRole('button', { name: 'Retour arrière' }).click();
  await expect(page.getByTestId('backspaces')).toHaveText('1');
  await page.getByLabel('Afficher les probabilités').uncheck();
  await expect(centre.locator('.key-probability')).toHaveCount(0);
  await page.getByRole('button', { name: 'Ouvrir le debug', exact: false }).click();
  await expect(page.getByRole('table')).toBeVisible();
  const next = await centre.getAttribute('data-char');
  await centre.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('textbox')).toHaveText(`${first}é ${next}`);
  expect(errors).toEqual([]);
});
test('directional swipe commits once, dead-zone return and cancellation commit nothing', async ({ page }) => {
  await page.goto('/');
  const centre = page.locator('[data-position="centre"]');
  const right = page.locator('[data-position="droite"]');
  const letter = await right.getAttribute('data-char');
  await centre.scrollIntoViewIfNeeded();
  const box = (await centre.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + 65, y, { steps: 6 });
  await expect(right).toHaveClass(/is-active/);
  await page.mouse.up();
  await expect(page.getByRole('textbox')).toHaveText(letter!);
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x - 65, y); await page.mouse.move(x, y); await page.mouse.up();
  await expect(page.getByRole('textbox')).toHaveText(letter!);
  await page.mouse.move(x, y); await page.mouse.down();
  await centre.dispatchEvent('pointercancel', { pointerId: 1, isPrimary: true });
  await page.mouse.up();
  await expect(page.getByRole('textbox')).toHaveText(letter!);
  expect(parseInt((await page.getByTestId('distance').innerText()).replace(/\D/g, ''))).toBeGreaterThan(100);
});
test('complete target solely through on-screen keys and export frozen metrics', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Phrase de test', exact: true }).click();
  // Add an incorrect first letter then correct it, exercising the experimental error counters.
  await page.getByRole('button', { name: 'Autres lettres', exact: false }).click();
  await page.getByRole('button', { name: 'Insérer Z', exact: true }).click();
  await page.getByRole('button', { name: 'Retour arrière' }).click();
  for (const char of target) {
    if (char === ' ') { await page.getByRole('button', { name: 'espace' }).click(); continue; }
    if (char === '.') { await page.getByRole('button', { name: 'Point', exact: true }).click(); continue; }
    const shift = page.getByRole('button', { name: 'Majuscule pour la prochaine lettre' });
    const upper = char !== char.toLocaleLowerCase('fr');
    if ((await shift.getAttribute('aria-pressed') === 'true') !== upper) await shift.click();
    const predicted = page.locator(`[data-position][data-char="${char}"]`);
    if (await predicted.count()) await predicted.click();
    else { await page.getByRole('button', { name: 'Autres lettres', exact: false }).click(); await page.getByRole('button', { name: `Insérer ${char}`, exact: true }).click(); }
  }
  await expect(page.getByRole('textbox')).toHaveText(target);
  await expect(page.getByRole('status')).toContainText('Phrase recopiée. Bien joué.');
  await expect(page.getByRole('status')).toContainText('1 erreurs cumulées · 1 corrigées · 0 erreurs restantes');
  await expect(page.locator('[data-position="centre"]')).toBeDisabled();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter les résultats' }).click();
  expect((await download).suggestedFilename()).toBe('astra-session.json');
  await page.getByRole('button', { name: 'Recommencer', exact: false }).click();
  await expect(page.getByRole('textbox')).toContainText('Les lettres viennent à vous.');
  await expect(page.getByTestId('hit-rate')).toContainText('—');
});
test('responsive layout and native touch taps', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) {
    const key = page.locator('[data-position="centre"]'); const char = await key.getAttribute('data-char');
    await key.tap(); await expect(page.getByRole('textbox')).toHaveText(char!);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/${isMobile ? 'mobile' : 'desktop'}.png`, fullPage: true });
});
test('native touch swipes select all four directions and ignore tap jitter', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'Native touch scenario on the mobile project');
  await page.goto('/');
  const client = await context.newCDPSession(page);
  let text = '';
  for (const [position, dx, dy] of [['haut', 0, -55], ['bas', 0, 55], ['gauche', -55, 0], ['droite', 55, 0], ['centre', 5, 4]] as const) {
    const centre = page.locator('[data-position="centre"]');
    text += await page.locator(`[data-position="${position}"]`).getAttribute('data-char');
    await centre.scrollIntoViewIfNeeded();
    const box = (await centre.boundingBox())!;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx, y: y + dy }] });
    await expect(page.locator(`[data-position="${position}"]`)).toHaveClass(/is-active/);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page.getByRole('textbox')).toHaveText(text);
  }
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
