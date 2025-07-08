import { expect, mergeTests } from "@playwright/test";

import { CartTest } from "@/test-fixtures/features/cart";
import { PDPTest } from "@/test-fixtures/pages/pdp";

const AddToCartTest = mergeTests(PDPTest, CartTest);

AddToCartTest.describe("PDP Add to Cart", () => {
  AddToCartTest(
    "should add product to cart with explicitly selected variants",
    async ({ page, PDPPage, cart }) => {
      // Verify the title and URL
      expect(await PDPPage.getTitle()).toContain("Cloud Zip Hoodie");
      expect(await PDPPage.getUrl()).toContain("cloud-zip-hoodie");

      // Add the product to the cart
      await PDPPage.selectRandomVariant();
      const { variantId, price } = await PDPPage.addToCart();

      await cart.checkForItemInCart({ variantId, price, quantity: 2 });

      // Verify the cart has been updated
    }
  );
});
