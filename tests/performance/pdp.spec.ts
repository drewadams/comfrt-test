import { expect, test } from "@playwright/test";

test("PDP should load within acceptable time limits", async ({ page }) => {
  // Ideally we integrate with Lighthouse in future, but the current version of it
  // Doesn't support mutliple workers
  const startTime = Date.now();

  await page.goto("/products/cloud-zip-hoodie?variant=41732312891436");
  await page.waitForSelector("h1", { timeout: 15000 });

  const loadTime = Date.now() - startTime;
  console.log(`PDP loaded in ${loadTime}ms`);

  // Validate reasonable load time (adjust threshold as needed)
  expect(loadTime).toBeLessThan(10000); // 10 seconds max
});
