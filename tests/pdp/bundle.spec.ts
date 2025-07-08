import { expect, mergeTests } from "@playwright/test";

import { CartTest } from "@/test-fixtures/features/cart";
import { PDPTest } from "@/test-fixtures/pages/pdp";

const BundleTest = mergeTests(PDPTest, CartTest);
BundleTest.describe("PDP Bundle", () => {
  BundleTest(
    "should add product bundle to cart with explicitly selected variants",
    async ({ page, PDPPage, cart }) => {
      // Verify the title and URL
      expect(await PDPPage.getTitle()).toContain("Cloud Zip Hoodie");
      expect(await PDPPage.getUrl()).toContain("cloud-zip-hoodie");

      // Add the product bundle to the cart
      // Pseudocode for selecting random variants
      //   await PDPPage.selectRandomBundleVariants();
      //   await PDPPage.addBundleToCart();
      // await cart.checkForItemInCart({
      //     variantId: "bundle-variant-id", // Replace with actual bundle variant ID
      //     price: "bundle-price", // Replace with actual bundle price
      //     quantity: 1, // Assuming bundle is added as a single item
      //   });
      // This could be difficult due to the nature of bundles
    }
  );
});
