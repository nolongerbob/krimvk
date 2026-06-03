import { test, expect } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001';

test.describe('public smoke', () => {
  test('health returns ok', async ({ request }) => {
    const res = await request.get(`${baseURL}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  test('home page loads', async ({ page }) => {
    const res = await page.goto(`${baseURL}/`);
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('news page loads', async ({ page }) => {
    const res = await page.goto(`${baseURL}/news`);
    expect(res?.status()).toBeLessThan(500);
    await expect(page.locator('body')).toBeVisible();
  });
});
