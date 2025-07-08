import { type Page, test as base } from "@playwright/test";

interface BaseTestFixtures {
  page: Page;
}
export const BaseTest = base.extend<BaseTestFixtures>({
  page: async ({ page }, use) => {
    // Block heavy resources to reduce load time
    // Otherwise the tests will timeout
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (
        url.includes(".jpg") ||
        url.includes(".jpeg") ||
        url.includes(".png") ||
        url.includes(".gif") ||
        url.includes(".webp") ||
        url.includes("google-analytics") ||
        url.includes("facebook.net") ||
        url.includes("tiktok") ||
        url.includes("klaviyo") ||
        url.includes("gorgias") ||
        url.includes("alia") || // Block all Alia-related scripts
        url.includes("aliacdn") // Block Alia CDN
      ) {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Set localStorage entries to prevent Alia popup from appearing
    await page.addInitScript(() => {
      // Set multiple localStorage entries that suppress the Alia popup
      window.localStorage.setItem("alia-popup-ground", "{}");
      window.localStorage.setItem("alia-test", "test");
      window.localStorage.setItem("alia-dismissed", "true");
      window.localStorage.setItem("alia-popup-dismissed", "true");
      window.localStorage.setItem("mystery-offer-dismissed", "true");

      // Set a basic JWT token to simulate a returning user
      window.localStorage.setItem(
        "alia-jwt",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsYXN0VXNlcklEIjo5OTk5OTk5OTksImlhdCI6MTY3MDAwMDAwMH0.fake-signature-for-testing-purposes"
      );

      // Set cart data to simulate returning user
      // window.localStorage.setItem(
      //   "alia-cart",
      //   '{"token":"test-token","items":[],"total_price":0}'
      // );

      // Block any window.alia or Alia initialization
      (window as any).alia = { initialized: true, dismissed: true };

      // Prevent any popup functions from running
      window.addEventListener("load", () => {
        // Remove any Alia popup elements that might have been inserted
        const aliaElements = document.querySelectorAll(
          '[id*="alia"], [class*="alia"], [aria-label*="Alia"]'
        );
        aliaElements.forEach((el) => el.remove());
      });
    });

    await use(page);
  },
});
