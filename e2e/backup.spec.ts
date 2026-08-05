import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { seed } from './helpers';

// Backup/restore: export writes all five localStorage keys as one JSON
// blob (textarea + file download); import validates a pasted/loaded
// blob, requires a two-step confirm, replaces everything, and reloads.

const FULL_BACKUP = {
  app: 'leaguepicker',
  version: 1,
  coaches: [{ name: 'Imported Coach', id: 'c9' }],
  players: [{ name: 'Imported Player', id: 'p9' }],
  scores: [{ playerId: 'p9', coachId: 'c9', score: '4' }],
  assignedPlayersToCoaches: [],
  assignedPlayersToPlayers: [],
};

test('B1: export fills the textarea and downloads a faithful backup', async ({ page }) => {
  await seed(page, {
    coaches: [{ name: 'CoachA', id: 'c1' }],
    players: [{ name: 'Ann Smith', id: 'p1' }],
    scores: [{ playerId: 'p1', coachId: 'c1', score: '5' }],
  });

  const downloadPromise = page.waitForEvent('download');
  await page.click('#exportData');
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^leaguepicker-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const content = JSON.parse(fs.readFileSync((await download.path())!, 'utf8'));
  expect(content.coaches).toEqual([{ name: 'CoachA', id: 'c1' }]);
  expect(content.players).toEqual([{ name: 'Ann Smith', id: 'p1' }]);
  expect(content.scores).toEqual([{ playerId: 'p1', coachId: 'c1', score: '5' }]);

  const textarea = JSON.parse(await page.inputValue('#backupText'));
  expect(textarea.players[0].name).toBe('Ann Smith');
});

test('B2: import replaces all data after two-step confirm and survives reload', async ({ page }) => {
  await page.goto('/');
  await page.fill('#backupText', JSON.stringify(FULL_BACKUP));
  await page.click('#importData');

  const confirm = page.locator('#importDataConfirm');
  await expect(confirm, 'import requires an explicit confirm step').toBeVisible();
  await confirm.click();

  await page.waitForLoadState('load');
  await page.click('#navCoaches');
  await expect(page.locator('#coachesTable')).toContainText('Imported Coach');
  await page.click('#navPlayers');
  await expect(page.locator('#playersTable')).toContainText('Imported Player');
  await expect(page.locator('#playersTable')).toContainText('4.00');
});

test('B3: invalid JSON is rejected with a message and data is untouched', async ({ page }) => {
  await seed(page, { coaches: [{ name: 'Coach Safe', id: 'c1' }] });

  await page.fill('#backupText', 'not json at all');
  await page.click('#importData');

  await expect(page.locator('#backupStatus')).toContainText('Import failed');
  await expect(page.locator('#importDataConfirm')).toBeHidden();
  await page.click('#navCoaches');
  await expect(page.locator('#coachesTable')).toContainText('Coach Safe');
});

test('B4: structurally wrong backup is rejected', async ({ page }) => {
  await page.goto('/');
  await page.fill('#backupText', JSON.stringify({ coaches: 'nope' }));
  await page.click('#importData');

  await expect(page.locator('#backupStatus')).toContainText('Import failed');
  await expect(page.locator('#importDataConfirm')).toBeHidden();
});
