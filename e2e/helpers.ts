import { Page } from '@playwright/test';

// Seeding uses the app's own localStorage persistence format — the same
// shape saveToLocalStorage() writes — injected before page scripts run.

export type Seed = {
  coaches?: { name: string; id: string }[];
  players?: { name: string; id: string }[];
  scores?: { playerId: string; coachId: string; score: string }[];
  assignedPlayersToCoaches?: {
    playerName: string; playerId: string; coachName: string; coachId: string;
  }[];
  assignedPlayersToPlayers?: {
    playerOneName: string; playerOneId: string; playerTwoName: string; playerTwoId: string;
  }[];
};

export async function seed(page: Page, data: Seed): Promise<void> {
  await page.addInitScript((d: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(d)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, data as Record<string, unknown>);
  await page.goto('/');
}
