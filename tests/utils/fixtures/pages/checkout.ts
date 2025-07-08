import CheckoutPage from "../../pages/checkout";
import { BaseTest as base } from "../base";

interface CheckoutFixtures {
  checkoutPage: CheckoutPage;
}

export const CheckoutTest = base.extend<CheckoutFixtures>({
  checkoutPage: async ({ page }, use) => {
    // Create an instance of the CheckoutPage class
    const checkoutPage = new CheckoutPage(page);
    await use(checkoutPage);
  },
});
