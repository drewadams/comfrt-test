import { expect, mergeTests } from "@playwright/test";

import { ADATest } from "@/test-fixtures/accessibility";
import { PDPTest } from "@/test-fixtures/pages/pdp";

const PDPADATest = mergeTests(PDPTest, ADATest);

PDPADATest("pdp", async ({ PDPPage, runAxe, dateStr, deviceType }) => {
  expect(PDPPage.page).toHaveURL(/products\/cloud-zip-hoodie/);
  const axeOutput = await runAxe({
    page: PDPPage.page,
    options: {
      createHtmlReport: true,
      outputDir: `./axe-report/pdp/${dateStr}/${deviceType}`,
      reportFileName: `pdp-${deviceType}-report.html`,
    },
  });
  expect(axeOutput.violations).toEqual([]);
});
