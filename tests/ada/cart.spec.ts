import { expect, mergeTests } from "@playwright/test";

import { ADATest } from "@/test-fixtures/accessibility";
import { CartTest } from "@/test-fixtures/features/cart";

const CartADATest = mergeTests(CartTest, ADATest);

CartADATest("cart", async ({ page, runAxe, isMobile, dateStr }) => {
  await page.goto("/cart");
  expect(page).toHaveURL(/cart/);
  const axeOutput = await runAxe({
    page,
    options: {
      createHtmlReport: true,
      outputDir: `./axe-report/cart/${dateStr}/${
        isMobile ? "mobile" : "desktop"
      }`,
      reportFileName: `cart-${isMobile ? "mobile" : "desktop"}-report.html`,
    },
  });
  expect(axeOutput.violations).toEqual([]);
});
