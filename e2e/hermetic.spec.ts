import { test, expect } from '@playwright/test';

// The app must be fully self-contained: no CDN scripts, stylesheets, or
// remote images. External dependencies mean the app breaks offline (an
// App Store review condition), eval runs depend on third-party uptime,
// and one of the former CDNs (StackPath) is already shut down.

test('the app loads without any external network requests', async ({ page }) => {
  const allowedOrigin = new URL(
    process.env.LEAGUEPICKER_URL || 'http://localhost:8917',
  ).origin;
  const external: string[] = [];
  page.on('request', (req) => {
    if (new URL(req.url()).origin !== allowedOrigin) {
      external.push(req.url());
    }
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(external, `external requests: ${external.join(', ')}`).toEqual([]);
});
