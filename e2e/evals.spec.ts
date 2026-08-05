import { test, expect, Page } from '@playwright/test';
import { seed } from './helpers';

// Evals for the bugs identified in review. Each test states the CORRECT
// behavior, so it fails on the buggy code and passes once fixed.

// Parse the rendered team blocks under #naiveAssignments.
async function readTeams(page: Page) {
  return page.$$eval('#naiveAssignments .coach-team', (blocks) =>
    blocks.map((b) => {
      const rows = Array.from(b.querySelectorAll('tbody tr'));
      const labeled = (label: string): string => {
        const row = rows.find((r) => (r.textContent || '').includes(label));
        const cell = row?.querySelectorAll('td')[1];
        return cell?.textContent?.trim() ?? '';
      };
      return {
        name: b.querySelector('h4')?.textContent?.trim() ?? '',
        total: parseFloat(labeled('Total Score')),
        count: parseInt(labeled('Total Players'), 10),
        players: rows
          .filter((r) => !(r.textContent || '').includes('Total'))
          .map((r) => r.querySelector('td')?.textContent?.trim() ?? ''),
      };
    }),
  );
}

// ── C1: rows added after page load must be removable ────────────────────

test('C1a: a coach added in this session can be removed with its X button', async ({ page }) => {
  await page.goto('/');
  await page.click('#navCoaches');
  await page.fill('#coachName', 'Coach Fresh');
  await page.click('#addCoachForm button[type=submit]');
  const row = page.locator('#coachesTable tbody tr', { hasText: 'Coach Fresh' });
  await expect(row).toHaveCount(1);
  await row.locator('.remove-coach-btn').click();
  await expect(row).toHaveCount(0);
});

test('C1b: a player added in this session can be removed with its X button', async ({ page }) => {
  await page.goto('/');
  await page.click('#navPlayers');
  await page.fill('#playerName', 'Fresh Player');
  await page.click('#addPlayerForm button[type=submit]');
  const row = page.locator('#playersTable tbody tr', { hasText: 'Fresh Player' });
  await expect(row).toHaveCount(1);
  await row.locator('.remove-player-btn').click();
  await expect(row).toHaveCount(0);
});

// ── C2: sibling pair where one is manually assigned must not crash ──────

test('C2: draft survives a sibling pair whose member is manually assigned, keeps pair together', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await seed(page, {
    coaches: [{ name: 'CoachA', id: 'c1' }, { name: 'CoachB', id: 'c2' }],
    players: [
      { name: 'P1', id: 'p1' }, { name: 'P2', id: 'p2' }, { name: 'P3', id: 'p3' },
    ],
    scores: [
      { playerId: 'p1', coachId: 'c1', score: '3' },
      { playerId: 'p2', coachId: 'c1', score: '3' },
      { playerId: 'p3', coachId: 'c1', score: '3' },
    ],
    assignedPlayersToCoaches: [
      { playerName: 'P1', playerId: 'p1', coachName: 'CoachA', coachId: 'c1' },
    ],
    assignedPlayersToPlayers: [
      { playerOneName: 'P1', playerOneId: 'p1', playerTwoName: 'P2', playerTwoId: 'p2' },
    ],
  });

  await page.click('#navAssignments');
  await page.click('#assignTeamsNaive');

  await expect(page.locator('#naiveAssignments .coach-team')).toHaveCount(2);
  expect(errors, 'draft must not throw').toEqual([]);

  const teams = await readTeams(page);
  const coachA = teams.find((t) => t.name === 'CoachA');
  expect(coachA, 'CoachA team rendered').toBeTruthy();
  expect(coachA!.players, 'manually assigned sibling stays with CoachA').toContain('P1');
  expect(coachA!.players, 'paired sibling follows to the same coach').toContain('P2');
});

// ── C3: draft with zero coaches must not hang the page ──────────────────

test('C3: draft with zero coaches shows guidance instead of freezing', async ({ page }) => {
  test.setTimeout(30_000);

  await seed(page, {
    players: [{ name: 'Solo', id: 'p1' }],
  });

  await page.click('#navAssignments');
  await Promise.race([
    page.click('#assignTeamsNaive', { noWaitAfter: true }),
    new Promise((resolve) => setTimeout(resolve, 3_000)),
  ]);

  const alive = await Promise.race([
    page.evaluate(() => true).catch(() => false),
    new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);
  expect(alive, 'page must stay responsive after drafting with no coaches').toBe(true);
  await expect(page.locator('#naiveAssignments')).toContainText(/coach/i);
});

// ── C4: manual assignment of a high scorer must not skew balance ────────

test('C4: teams stay balanced when the top scorer is manually pre-assigned', async ({ page }) => {
  await seed(page, {
    coaches: [{ name: 'CoachA', id: 'c1' }, { name: 'CoachB', id: 'c2' }],
    players: [
      { name: 'P5', id: 'p5' }, { name: 'P4', id: 'p4' },
      { name: 'P3', id: 'p3' }, { name: 'P2', id: 'p2' },
    ],
    scores: [
      { playerId: 'p5', coachId: 'c1', score: '5' },
      { playerId: 'p4', coachId: 'c1', score: '4' },
      { playerId: 'p3', coachId: 'c1', score: '3' },
      { playerId: 'p2', coachId: 'c1', score: '2' },
    ],
    assignedPlayersToCoaches: [
      { playerName: 'P5', playerId: 'p5', coachName: 'CoachA', coachId: 'c1' },
    ],
  });

  await page.click('#navAssignments');
  await page.click('#assignTeamsNaive');
  await expect(page.locator('#naiveAssignments .coach-team')).toHaveCount(2);

  const teams = await readTeams(page);
  const coachA = teams.find((t) => t.name === 'CoachA')!;
  expect(coachA.players, 'manual assignment respected').toContain('P5');

  const totals = teams.map((t) => t.total);
  const counts = teams.map((t) => t.count);
  expect(Math.abs(totals[0] - totals[1]), `score totals ${totals.join(' vs ')} must be balanced`).toBeLessThanOrEqual(1);
  expect(Math.abs(counts[0] - counts[1]), `team sizes ${counts.join(' vs ')} must be balanced`).toBeLessThanOrEqual(1);
});

// ── C5: sibling placement must account for manual assignments ───────────

test('C5: sibling pair lands on the emptier team when the other team has manual assignments', async ({ page }) => {
  // Pin Math.random so the buggy "random coach among those tied at zero
  // players" path deterministically picks CoachA (the already-loaded team).
  await page.addInitScript(() => { Math.random = () => 0; });

  await seed(page, {
    coaches: [{ name: 'CoachA', id: 'c1' }, { name: 'CoachB', id: 'c2' }],
    players: [
      { name: 'X1', id: 'x1' }, { name: 'X2', id: 'x2' },
      { name: 'S1', id: 's1' }, { name: 'S2', id: 's2' },
    ],
    scores: [
      { playerId: 'x1', coachId: 'c1', score: '3' },
      { playerId: 'x2', coachId: 'c1', score: '3' },
      { playerId: 's1', coachId: 'c1', score: '3' },
      { playerId: 's2', coachId: 'c1', score: '3' },
    ],
    assignedPlayersToCoaches: [
      { playerName: 'X1', playerId: 'x1', coachName: 'CoachA', coachId: 'c1' },
      { playerName: 'X2', playerId: 'x2', coachName: 'CoachA', coachId: 'c1' },
    ],
    assignedPlayersToPlayers: [
      { playerOneName: 'S1', playerOneId: 's1', playerTwoName: 'S2', playerTwoId: 's2' },
    ],
  });

  await page.click('#navAssignments');
  await page.click('#assignTeamsNaive');
  await expect(page.locator('#naiveAssignments .coach-team')).toHaveCount(2);

  const teams = await readTeams(page);
  const counts = teams.map((t) => t.count);
  expect(Math.abs(counts[0] - counts[1]), `team sizes ${counts.join(' vs ')} must be balanced`).toBeLessThanOrEqual(1);

  const together = teams.some((t) => t.players.includes('S1') && t.players.includes('S2'));
  expect(together, 'sibling pair stays together').toBe(true);
});

// ── C6: names with spaces must survive the assignment round-trip ────────

test('C6: a player name with spaces survives manual assignment and reload', async ({ page }) => {
  await seed(page, {
    coaches: [{ name: 'Coach1', id: 'c1' }],
    players: [{ name: 'Ann Smith', id: 'p1' }],
  });

  await page.click('#navAssignments');
  await page.selectOption('#playerSelect', 'p1');
  await page.selectOption('#coachSelect', 'c1');
  await page.click('#assignPlayerToCoach');

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('assignedPlayersToCoaches') || '[]'),
  );
  expect(stored[0]?.playerName, 'persisted name must not be truncated').toBe('Ann Smith');

  await page.reload();
  await page.click('#navAssignments');
  await expect(page.locator('#playersToCoachesTable tbody tr').first()).toContainText('Ann Smith');
});

// ── C7: names must be rendered as text, not markup ──────────────────────

test('C7: a player name containing markup is displayed literally, not executed', async ({ page }) => {
  const payload = '<img src=x onerror="window.__xss_fired=1">';
  await seed(page, {
    players: [{ name: payload, id: 'p1' }],
  });

  await page.click('#navPlayers');
  await page.waitForTimeout(500);

  const fired = await page.evaluate(() => (window as unknown as { __xss_fired?: number }).__xss_fired);
  expect(fired, 'markup in a name must not execute').toBeUndefined();
  await expect(page.locator('#playersTable tbody tr').first()).toContainText('<img');
});

// ── C8: players with no scores must not produce NaN totals ──────────────

test('C8: drafting a player with no scores keeps team totals numeric', async ({ page }) => {
  await seed(page, {
    coaches: [{ name: 'CoachA', id: 'c1' }],
    players: [{ name: 'Scored', id: 'p1' }, { name: 'Unscored', id: 'p2' }],
    scores: [{ playerId: 'p1', coachId: 'c1', score: '4' }],
  });

  await page.click('#navAssignments');
  await page.click('#assignTeamsNaive');
  await expect(page.locator('#naiveAssignments .coach-team')).toHaveCount(1);

  await expect(page.locator('#naiveAssignments')).not.toContainText('NaN');
  const teams = await readTeams(page);
  expect(teams[0].players, 'unscored player still drafted').toContain('Unscored');
  expect(Number.isFinite(teams[0].total), 'total score must be a number').toBe(true);
});
