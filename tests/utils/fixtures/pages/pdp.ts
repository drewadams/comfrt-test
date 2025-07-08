import { Page, test as base } from "@playwright/test";

interface PDPFixtures {
  page: Page;
  PDPPage: any;
}

export const PDPTest = base.extend<PDPFixtures>({
  page: async ({ page }, use) => {
    // Navigate to the PDP URL
    await page.goto("/products/cloud-zip-hoodie?variant=41732312891436");
    await use(page);
  },
});
