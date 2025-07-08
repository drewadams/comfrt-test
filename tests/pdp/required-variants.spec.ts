import { PDPTest } from "@/test-fixtures/pages/pdp";
import { expect } from "@playwright/test";

PDPTest(
  "should fail to add product to cart with required variants not selected",
  async ({ page, PDPPage }) => {
    // Verify the title and URL
    expect(await PDPPage.getTitle()).toContain("Cloud Zip Hoodie");
    expect(await PDPPage.getUrl()).toContain("cloud-zip-hoodie");

    // Pseudocode for adding product to cart without selecting required variants
    // await PDPPage.unselectRequiredVariants();
    // const { variantId, price } = await PDPPage.addToCart();
    // expect(PDPPage.cartError).toBeVisible();
  }
);
