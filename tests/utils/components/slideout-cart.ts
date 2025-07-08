import { type Page } from "@playwright/test";
import BasePage from "../pages/base";

export default class SlideoutCart extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /* Locators */
  get openCartButton() {
    return this.page.locator("#cart-icon-bubble");
  }

  get closeCartButton() {
    return this.cartDrawer.locator("label[for='close-drawer']");
  }

  get cartDrawer() {
    return this.page.locator("#cart > div.cartContent");
  }

  get cartItems() {
    return this.cartDrawer.locator("div[id*='cart_items-']");
  }

  get checkoutButton() {
    // The checkout button is not inside the cart drawer but in a separate area
    return this.page.locator('button:has-text("Checkout")').first();
  }

  /**
   * Opens the cart drawer if it is not already open.
   */
  async open() {
    if (await this.cartDrawer.isVisible()) {
      return; // Cart is already open
    }
    await this.openCartButton.click();
    await this.cartDrawer.waitFor({ state: "visible" });
  }

  /**
   * Closes the cart drawer.
   */
  async close() {
    if (!(await this.cartDrawer.isVisible())) {
      return; // Cart is already closed
    }
    await this.closeCartButton.click();
    // await this.cartDrawer.waitFor({ state: "hidden" });
    // The cart drawer doesn't actually hide, it just becomes invisible.
  }

  /**
   * Checks if the cart drawer is currently open.
   */
  async isOpen() {
    return await this.cartDrawer.isVisible();
  }

  /**
   * Gets the count of items in the cart.
   */
  async getCartCount() {
    return await this.cartItems.count();
  }

  async removeItem(variantId: string) {
    await this.open();
    const item = this.cartItems.locator(`> div[id="${variantId}"]`);
    if (!(await item.isVisible())) {
      await this.open();
      if (!(await item.isVisible())) {
        throw new Error(`Item with variant ID ${variantId} not found in cart.`);
      }
    }
    const removeButton = item.locator("button[type='submit']", {
      hasText: "Remove",
    });
    if (await removeButton.isVisible()) {
      await removeButton.click();
    } else {
      throw new Error(
        `Remove button for item with variant ID ${variantId} not found.`
      );
    }
  }

  async getCartItemDetails(variantId: string) {
    const item = this.cartItems.locator(`> div[id="${variantId}"]`);
    if (!(await item.isVisible())) {
      await this.open();
      if (!(await item.isVisible())) {
        throw new Error(`Item with variant ID ${variantId} not found in cart.`);
      }
    }
    const quantity = await item
      .locator("input[readonly]")
      .getAttribute("value");
    const itemPrice = await item
      .locator("p", { hasText: "$" })
      .first()
      .textContent();
    return {
      quantity,
      itemPrice,
    };
  }

  async changeItemQuantity({
    variantId,
    quantity,
  }: {
    variantId: string;
    quantity: number;
  }) {
    await this.open();
    const item = this.cartItems.locator(`> div[id="${variantId}"]`);
    if (!(await item.isVisible())) {
      await this.open();
      if (!(await item.isVisible())) {
        throw new Error(`Item with variant ID ${variantId} not found in cart.`);
      }
    }
    const input = item.locator("input[readonly]");
    const currentQuantity = parseInt(
      (await input.getAttribute("value")) || "0"
    );
    const increaseButton = item.getByText("+");
    const decreaseButton = item.getByText("-");

    if (currentQuantity === quantity) {
      return; // No change needed
    }

    const difference = quantity - currentQuantity;
    if (difference > 0) {
      for (let i = 0; i < difference; i++) {
        await increaseButton.click();
      }
    } else {
      for (let i = 0; i < Math.abs(difference); i++) {
        await decreaseButton.click();
      }
      await this.page.waitForTimeout(1000); // Allow for the UI to update
    }

    // Unfortunately, nothing readable on the page updates unless we reload.
    await this.page.reload({ waitUntil: "load" });
    await this.openCartButton.click(); // Technically the cart is still open,

    const updatedQuantity = parseInt(
      (await input.getAttribute("value")) || "0"
    );
    if (updatedQuantity !== quantity) {
      throw new Error(
        `Failed to update quantity for variant ${variantId}. Expected ${quantity}, but got ${updatedQuantity}.`
      );
    }
    console.log(`Updated quantity for variant ${variantId} to ${quantity}.`);
  }

  async getAllCartItems() {
    if (!(await this.cartDrawer.isVisible())) {
      await this.openCartButton.click();
      await this.cartDrawer.waitFor({ state: "visible" });
    }
    return await this.cartItems.all();
  }

  async checkForItemInCart({
    variantId,
    price,
    quantity,
  }: {
    variantId: string;
    price: string;
    quantity: number;
  }) {
    const items = await this.getAllCartItems();
    for (const item of items) {
      const id = await item.locator("> div").getAttribute("id");
      const itemPrice = await item
        .locator("p", { hasText: "$" })
        .first()
        .textContent();
      const itemQuantity = await item
        .locator("input[readonly]")
        .getAttribute("value");

      if (
        id === variantId &&
        itemPrice?.includes(price) &&
        parseInt(itemQuantity || "0") === quantity
      ) {
        return true;
      }
    }
    return false;
  }

  async proceedToCheckout() {
    await this.open();
    await this.checkoutButton.click();
    // Wait for navigation to checkout page with a more lenient approach
    try {
      await this.page.waitForLoadState("load", { timeout: 15000 });
    } catch {
      // If load state times out, just wait a bit for the page to settle
      await this.page.waitForTimeout(3000);
    }
  }
}
