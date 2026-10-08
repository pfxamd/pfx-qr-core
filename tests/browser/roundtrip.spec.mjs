import { test, expect } from '@playwright/test';
for (const format of ['png', 'svg', 'webp']) {
  test(`${format}: render, inspect, decode`, async ({page}) => {
    await page.goto('/browser/');
    const output = await page.evaluate(async (f) => window.pfxTest(f), format);
    expect(output.mime).toBe(`image/${format === 'svg' ? 'svg+xml' : format}`);
    expect(output.size).toBeGreaterThan(100);
    expect(output.decoded).toBe(true);
  });
}
test('logo: PNG render and decode', async ({page}) => {
  await page.goto('/browser/');
  const output = await page.evaluate(() => window.pfxTest('png', true));
  expect(output.decoded).toBe(true);
});
