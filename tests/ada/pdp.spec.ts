import { expect, mergeTests } from "@playwright/test";

import { ADATest } from "../utils/fixtures/accessibility";
import { PDPTest } from "../utils/fixtures/pages/pdp";

const PDPADATest = mergeTests(PDPTest, ADATest);

PDPADATest("pdp", async ({ page, runAxe, isMobile }) => {
  expect(page).toHaveURL(/products\/cloud-zip-hoodie/);
  await runAxe({
    page,
    options: {
      createHtmlReport: true,
      reportFileName: `pdp-${isMobile ? "mobile" : "desktop"}-report.html`,
    },
  });
});
