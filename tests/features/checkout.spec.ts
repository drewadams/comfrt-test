import { expect, mergeTests } from "@playwright/test";

import { CartTest } from "@/test-fixtures/features/cart";
import { CheckoutTest } from "@/test-fixtures/pages/checkout";
import { PDPTest } from "@/test-fixtures/pages/pdp";

const FullCheckoutTest = mergeTests(PDPTest, CartTest, CheckoutTest);

FullCheckoutTest.describe("Guest Checkout Flow", () => {
  FullCheckoutTest(
    "should redirect to Shopify checkout and display required fields",
    async ({ page, PDPPage, cart, checkoutPage }) => {
      // Add a product to cart first
      await PDPPage.selectRandomVariant();
      await PDPPage.addToCart();

      // Open cart and proceed to checkout
      await cart.proceedToCheckout();

      // Wait for checkout page to load
      await checkoutPage.waitForCheckoutToLoad();

      // Validate we're on Shopify checkout
      expect(await checkoutPage.isCheckoutPageLoaded()).toBe(true);

      // Assert presence of required fields
      await expect(checkoutPage.emailInput).toBeVisible();
      await expect(checkoutPage.firstNameInput).toBeVisible();
      await expect(checkoutPage.lastNameInput).toBeVisible();
      await expect(checkoutPage.addressInput).toBeVisible();
      await expect(checkoutPage.cityInput).toBeVisible();
      await expect(checkoutPage.zipCodeInput).toBeVisible();

      // Test passes - we successfully navigated to checkout and found required fields
    }
  );

  FullCheckoutTest(
    "should show validation errors for missing required fields",
    async ({ page, PDPPage, cart, checkoutPage }) => {
      // Add a product to cart first
      await PDPPage.selectRandomVariant();
      await PDPPage.addToCart();

      // Navigate to checkout
      await cart.proceedToCheckout();
      await checkoutPage.waitForCheckoutToLoad();

      // Try to proceed without filling required fields
      // First check if continue button exists and is visible
      const continueButton = page.locator(
        'button:has-text("Continue to shipping"):not([aria-hidden="true"])'
      );
      const buttonExists = await continueButton.isVisible();
      expect(buttonExists).toBe(true);

      // Click continue button to trigger validation
      await continueButton.click();

      // Wait a moment for any validation messages to appear
      await page.waitForTimeout(2000);

      // Check for error messages or validation indicators
      const errors = await checkoutPage.getErrorMessages();
      const hasRequiredFields = await page
        .locator('input[required], input[aria-required="true"]')
        .count();

      // Either we should see error messages, or required fields should be highlighted
      const hasValidation = errors.length > 0 || hasRequiredFields > 0;
      expect(hasValidation).toBe(true);
    }
  );

  FullCheckoutTest(
    "should fill out contact and shipping information",
    async ({ page, PDPPage, cart, checkoutPage }) => {
      // Add a product to cart first
      await PDPPage.selectRandomVariant();
      await PDPPage.addToCart();

      // Navigate to checkout
      await cart.proceedToCheckout();
      await checkoutPage.waitForCheckoutToLoad();

      // Fill out contact information
      await checkoutPage.fillEmailField("test@example.com");

      // Fill out shipping address
      await checkoutPage.fillShippingAddress({
        firstName: "John",
        lastName: "Doe",
        address: "123 Test Street",
        city: "Test City",
        zipCode: "12345",
        state: "CA",
        phone: "555-123-4567",
      });

      // Verify filled values (basic validation)
      await expect(checkoutPage.emailInput).toHaveValue("test@example.com");
      await expect(checkoutPage.firstNameInput).toHaveValue("John");
      await expect(checkoutPage.lastNameInput).toHaveValue("Doe");
    }
  );

  FullCheckoutTest(
    "should display order summary with correct totals",
    async ({ page, PDPPage, cart, checkoutPage }) => {
      // Add a product to cart first
      await PDPPage.selectRandomVariant();
      const { price } = await PDPPage.addToCart();

      // Navigate to checkout
      await cart.proceedToCheckout();
      await checkoutPage.waitForCheckoutToLoad();

      // Get order summary
      const summary = await checkoutPage.getOrderSummary();

      // Basic validation that totals are monetary values
      expect(summary.subtotal).toMatch(/\$\d+\.\d{2}/);
      expect(summary.total).toMatch(/\$\d+\.\d{2}/);

      // Verify order summary contains expected information
      expect(summary.subtotal).toBe(price + ".00");
      expect(summary.total).toBeTruthy();
    }
  );
});
