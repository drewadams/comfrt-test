import SlideoutCart from "@/test-utils/components/slideout-cart";
import { BaseTest as base } from "../base";

interface PDPFixtures {
  cart: SlideoutCart;
}

export const CartTest = base.extend<PDPFixtures>({
  cart: async ({ page }, use) => {
    // Create an instance of the SlideoutCart component
    const cart = new SlideoutCart(page);
    await use(cart);
  },
});
