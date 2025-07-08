import PDPPage from "@/test-utils/pages/pdp";
import { BaseTest as base } from "../base";

interface PDPFixtures {
  PDPPage: PDPPage;
}

export const PDPTest = base.extend<PDPFixtures>({
  PDPPage: async ({ page }, use) => {
    // Create an instance of the PDPPage class
    const pdpPage = new PDPPage(page);
    await pdpPage.goto();
    await use(pdpPage);
  },
});
