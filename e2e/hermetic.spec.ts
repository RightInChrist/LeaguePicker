import { test, expect } from '@playwright/test';

// The app must be fully self-contained: no CDN scripts, stylesheets, or
// remote images. External dependencies mean the app breaks offline (an
// App Store review condition), eval runs depend on third-party uptime,
// and one of the former CDNs (StackPath) is already shut down.

// Injected by Cloudflare at the edge (Web Analytics RUM beacon) when the
// suite runs against a deployed domain — not part of the app bundle, and
// absent when the files are served anywhere else (local, Capacitor).
const EDGE_INJECTED_ORIGINS = ['https://static.cloudflareinsights.com'];

test('the app loads without any external network requests', async ({ page }) => {
  const allowedOrigin = new URL(
    process.env.LEAGUEPICKER_URL || 'http://localhost:8917',
  ).origin;
  const external: string[] = [];
  page.on('request', (req) => {
    const origin = new URL(req.url()).origin;
    if (origin !== allowedOrigin && !EDGE_INJECTED_ORIGINS.includes(origin)) {
      external.push(req.url());
    }
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(external, `external requests: ${external.join(', ')}`).toEqual([]);
});
