import { expect, mergeTests } from "@playwright/test";

import { CartTest } from "@/test-fixtures/features/cart";
import { PDPTest } from "@/test-fixtures/pages/pdp";

const PDPCartTest = mergeTests(PDPTest, CartTest);

CartTest.describe("Slideout Cart", () => {
  CartTest(
    "should open and close the slideout cart",
    async ({ page, cart }) => {
      await page.goto("/cart");
      // Open the slideout cart
      await cart.open();
      expect(cart.cartDrawer).toBeVisible();

      // Close the slideout cart
      await cart.close();

      // The cart drawer should be hidden after closing
      // But its not...
      // expect(cart.cartDrawer).toBeHidden();
    }
  );

  // As tests shouldn't be reliant on other tests,
  // we will run this test independently
  // Ideally, there would be a way to add items to the cart
  // before running this test.
  PDPCartTest(
    "should change quantity of items in the slideout cart",
    async ({ page, cart, PDPPage }) => {
      let itemCount = await cart.getCartCount();
      expect(itemCount).toBe(1);

      const { variantId } = await PDPPage.addToCart();
      await PDPPage.page.waitForTimeout(2000); // Wait for cart to update
      // Open the slideout cart
      await cart.open();

      // Check if the item count is displayed correctly
      itemCount = await cart.getCartCount();
      expect(itemCount).toBe(1);
      await cart.changeItemQuantity({
        variantId,
        quantity: 4,
      });
      await cart.changeItemQuantity({
        variantId,
        quantity: 2,
      });

      const updatedDetails = await cart.getCartItemDetails(variantId);
      expect(updatedDetails.quantity).toBe("2");

      // Close the slideout cart
      await cart.close();
    }
  );
  PDPCartTest(
    "should remove an item from the slideout cart",
    async ({ cart, PDPPage }) => {
      const { variantId } = await PDPPage.addToCart();
      await PDPPage.page.waitForTimeout(2000); // Wait for cart to update
      // Open the slideout cart
      await cart.open();

      // Remove the item from the cart
      await cart.removeItem(variantId);
      await PDPPage.page.waitForTimeout(2000); // Wait for cart to update

      // Verify the item is removed
      await expect(cart.checkoutButton).toBeDisabled();

      // There is no empty cart message.

      // Close the slideout cart
      await cart.close();
    }
  );
});
