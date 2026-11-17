import { expect, test, type Page } from '@playwright/test';

const ROUTES = ['today', 'learn', 'review', 'scenarios', 'exam', 'road', 'log', 'progress', 'settings', 'sources', 'more', 'lesson/l-sign-shapes'];

async function fresh(page: Page) {
  await page.goto('/#/today');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

test('every screen renders without errors or horizontal overflow', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/tile\.openstreetmap|ERR_|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  await fresh(page);
  for (const r of ROUTES) {
    await page.goto(`/#/${r}`);
    await expect(page.locator('main h1')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, r).toBeLessThanOrEqual(0);
  }
  expect(errors).toEqual([]);
});

test('language switch keeps the current question and selection, and survives reload', async ({ page }) => {
  await fresh(page);
  await page.goto('/#/lesson/l-sign-shapes');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Question 1 of 6')).toBeVisible();
  const firstChoice = page.locator('.choice').first();
  const enText = await firstChoice.locator('.choice-text').innerText();
  await firstChoice.click();
  await page.getByRole('button', { name: 'Cambiar a español' }).click();
  await expect(page.getByText('Pregunta 1 de 6')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-MX');
  await expect(page.locator('.choice').first()).toHaveClass(/is-selected/);
  expect(await page.locator('.choice-text').first().innerText()).not.toBe(enText);
  await page.reload();
  await expect(page.getByText('Pregunta 1 de 6')).toBeVisible();
});

test('answering grades once, explains, and wrong answers come back', async ({ page }) => {
  await fresh(page);
  await page.goto('/#/lesson/l-start-test');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next' }).click();
  // Pick a wrong answer deliberately.
  const choices = page.locator('.choice');
  const n = await choices.count();
  let wrongIndex = 0;
  for (let i = 0; i < n; i++) {
    const t = await choices.nth(i).innerText();
    if (!/Identify signs by shape/.test(t)) { wrongIndex = i; break; }
  }
  await choices.nth(wrongIndex).click();
  const check = page.getByRole('button', { name: 'Check answer' });
  await check.dblclick();
  await expect(page.getByText('Not quite')).toBeVisible();
  await expect(page.getByText('Why your choice does not fit')).toBeVisible();
  const review = await page.evaluate(() => JSON.parse(localStorage.getItem('vamos:data')!).profiles.p1.review['st-exam-content']);
  expect(review.seen).toBe(1);
  expect(review.box).toBe(1);
  const queue = await page.evaluate(() => JSON.parse(localStorage.getItem('vamos:data')!).profiles.p1.lessonSession.queue);
  expect(queue.filter((q: string) => q === 'st-exam-content')).toHaveLength(2);
});

test('lesson is fully keyboard operable', async ({ page }) => {
  await fresh(page);
  await page.goto('/#/lesson/l-markings');
  for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: 'Next' }).focus(); await page.keyboard.press('Enter'); }
  await page.locator('.choice input').first().focus();
  await page.keyboard.press('ArrowDown');
  await page.getByRole('button', { name: 'Check answer' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.feedback')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeFocused();
});

test('practice exam hides answers until submission and saves history', async ({ page }) => {
  await fresh(page);
  await page.goto('/#/exam');
  await page.getByRole('button', { name: 'Start practice test' }).click();
  await expect(page.getByText('Question 1 of 35')).toBeVisible();
  await page.locator('.choice').first().click();
  await expect(page.locator('.feedback')).toHaveCount(0);
  await expect(page.locator('.is-correct, .is-wrong')).toHaveCount(0);
  await page.getByRole('button', { name: 'Flag for review' }).click();
  await page.getByRole('button', { name: 'Review and submit' }).first().click();
  await expect(page.getByRole('dialog')).toContainText('34 unanswered will count as incorrect. 1 flagged.');
  await page.getByRole('dialog').getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
  await expect(page.getByText(/of 35 correct/)).toBeVisible();
  await page.goto('/#/exam');
  await expect(page.locator('.attempt-list li')).toHaveCount(1);
});

test('profiles stay separate and can be renamed', async ({ page }) => {
  await fresh(page);
  await page.goto('/#/settings');
  const inputs = page.getByLabel('Display name');
  await inputs.nth(1).fill('Ana');
  await page.getByRole('button', { name: 'Save name' }).nth(1).click();
  await expect(page.getByText('Saved as "Ana"')).toBeVisible();
  await page.goto('/#/lesson/l-start-test');
  await page.goto('/#/today');
  await page.getByRole('button', { name: /Switch learner/ }).click();
  await page.getByRole('button', { name: 'Ana' }).click();
  await expect(page.getByRole('heading', { name: 'Hi, Ana' })).toBeVisible();
  const p2Session = await page.evaluate(() => JSON.parse(localStorage.getItem('vamos:data')!).profiles.p2.lessonSession);
  expect(p2Session).toBeNull();
});

test('voice: unsupported recognition and denied microphone fall back cleanly; navigation stops speech', async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__spoken = 0; (window as any).__cancelled = 0;
    const synth = window.speechSynthesis;
    synth.speak = () => { (window as any).__spoken++; };
    synth.cancel = () => { (window as any).__cancelled++; };
    class FakeRec { lang = ''; interimResults = false; maxAlternatives = 1; continuous = false; onresult: any; onerror: any; onend: any;
      start() { setTimeout(() => this.onerror?.({ error: 'not-allowed' }), 10); } abort() {} stop() {} }
    (window as any).SpeechRecognition = FakeRec;
  });
  await fresh(page);
  await page.goto('/#/lesson/l-sign-shapes');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Speak your answer' }).click();
  await expect(page.getByText('Microphone access was not allowed')).toBeVisible();
  await page.locator('.choice').first().click();
  await expect(page.getByRole('button', { name: 'Check answer' })).toBeEnabled();
  await page.getByRole('button', { name: 'Read aloud' }).first().click();
  const before = await page.evaluate(() => (window as any).__cancelled);
  await page.goto('/#/today');
  expect(await page.evaluate(() => (window as any).__cancelled)).toBeGreaterThan(before);
});

test('spoken answer requires confirmation before grading', async ({ page }) => {
  await page.addInitScript(() => {
    class FakeRec { lang = ''; interimResults = false; maxAlternatives = 1; continuous = false; onresult: any; onerror: any; onend: any;
      start() { setTimeout(() => this.onresult?.({ results: [[{ transcript: 'B' }]] }), 10); } abort() {} stop() {} }
    (window as any).SpeechRecognition = FakeRec;
  });
  await fresh(page);
  await page.goto('/#/lesson/l-sign-shapes');
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Speak your answer' }).click();
  await expect(page.getByText('Heard: "B"')).toBeVisible();
  await expect(page.locator('.feedback')).toHaveCount(0);
  await page.getByRole('button', { name: 'Use this answer' }).click();
  await expect(page.locator('.feedback')).toBeVisible();
});

test('map tile failure shows a fallback and the list still works', async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', (r) => r.abort());
  await fresh(page);
  await page.goto('/#/scenarios');
  await expect(page.getByText('The map could not load')).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /Someone stepping out/ }).click();
  await expect(page.getByText('Illustrated practice scenario inspired by this area').first()).toBeVisible();
  await expect(page.locator('.leaflet-control-attribution')).toContainText('OpenStreetMap');
});

test('corrupt storage shows a notice instead of crashing', async ({ page }) => {
  await page.goto('/#/today');
  await page.evaluate(() => localStorage.setItem('vamos:data', '{broken'));
  await page.reload();
  await expect(page.getByText('could not be read')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hi, Learner 1' })).toBeVisible();
});

test('rename shows an inline confirmation and survives reload', async ({ page }) => {
  await fresh(page);
  await page.goto('/#/settings');
  const save = page.getByRole('button', { name: 'Save name' }).first();
  await expect(save).toBeDisabled();
  await page.getByLabel(/Display name/).first().fill('Nicole');
  await expect(page.getByText('Unsaved changes').first()).toBeVisible();
  await save.click();
  await expect(page.getByText('Saved as "Nicole"')).toBeVisible();
  await page.reload();
  await expect(page.getByLabel(/Display name/).first()).toHaveValue('Nicole');
  await page.goto('/#/today');
  await expect(page.getByRole('heading', { name: 'Hi, Nicole' })).toBeVisible();
});

test('settings changes wait for Save, and leaving asks first', async ({ page }) => {
  await fresh(page);
  await page.goto('/#/settings');
  await page.getByText('3 months').click();
  await expect(page.locator('.save-bar')).toBeVisible();
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('vamos:data')!).profiles.p1.plan.preset);
  expect(await stored()).toBe('1m');
  // Leaving is blocked when the learner cancels the prompt.
  page.once('dialog', (d) => d.dismiss());
  await page.locator('a[href="#/today"]:visible').last().click();
  await expect(page).toHaveURL(/#\/settings/);
  await page.getByRole('button', { name: 'Save plan' }).click();
  await expect(page.locator('.save-bar')).toHaveCount(0);
  expect(await stored()).toBe('3m');
  await page.goto('/#/today');
  await expect(page.locator('main h1')).toBeVisible();
});

test('header save button confirms saving', async ({ page }) => {
  await fresh(page);
  await page.getByRole('button', { name: /Save now/ }).click();
  await expect(page.getByRole('status').filter({ hasText: 'All progress saved on this device' })).toBeAttached();
});

test('practice test can be saved and resumed', async ({ page }) => {
  await fresh(page);
  await page.goto('/#/exam');
  await page.getByRole('button', { name: 'Start practice test' }).click();
  await page.locator('.choice').first().click();
  await page.getByRole('button', { name: 'Save and exit' }).click();
  await expect(page.getByRole('button', { name: 'Continue practice test' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Continue practice test' }).click();
  await expect(page.getByText('Question 2 of 35')).toBeVisible(); // resumes at the first unanswered question
  await page.getByRole('button', { name: 'Previous' }).click();
  await expect(page.locator('.choice.is-selected')).toHaveCount(1);
});
