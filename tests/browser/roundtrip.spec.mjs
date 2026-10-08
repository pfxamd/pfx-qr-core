import { test, expect } from '@playwright/test';
for (const format of ['png', 'webp']) {
  test(`${format}: render, inspect, decode`, async ({page}) => {
    await page.goto('/browser/');
    const output = await page.evaluate(async (f) => window.pfxTest(f), format);
    expect(output.mime).toBe(`image/${format}`);
    expect(output.size).toBeGreaterThan(100);
    expect(output.decoded).toBe(true);
  });
}
test('svg: export, parse, render, screenshot, decode', async ({page}) => {
  await page.goto('/browser/');
  const output = await page.evaluate(() => window.pfxPrepareSvg());
  expect(output.mime).toBe('image/svg+xml');
  expect(output.size).toBeGreaterThan(100);
  const screenshot = await page.locator('#qr-svg').screenshot();
  expect(await page.evaluate(bytes => window.pfxVerifyScreenshot(bytes), Array.from(screenshot))).toBe(true);
});
test('logo: PNG render and decode', async ({page}) => {
  await page.goto('/browser/');
  const output = await page.evaluate(() => window.pfxTest('png', true));
  expect(output.decoded).toBe(true);
});
