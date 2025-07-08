import { Locator, Page } from "@playwright/test";
import { VariantGroup, VariantOption } from "../types/products";

import BasePage from "./base";

export default class PDPPage extends BasePage {
  private _cachedVariants: VariantGroup[] | null = null;
  private _variantsCacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5000; // 5 seconds cache

  constructor(page: Page) {
    super(page);
  }

  /* Locators */
  get productTitle() {
    return this.page.locator(
      "#product_hero_title-default-product-hero-title_2_rc > h1"
    );
  }

  get addToCartButton() {
    const buttonWrapper = this.page.locator(
      "#product_hero_add_to_cart_button-default-product-hero-add-to-cart-button_6_rc"
    );
    // Get the first visible and enabled button (avoid pre-order button)
    return buttonWrapper
      .locator("button")
      .filter({ hasText: "Add to cart" })
      .first();
  }

  get variantWrapper() {
    return this.page.locator(
      "#product_hero_options-default-product-hero-options_4_rc"
    );
  }

  get cartDrawer() {
    return this.page.locator(".cart-drawer, #CartDrawer");
  }

  get cartCount() {
    return this.page.locator(".cart-count, .cart-link .count");
  }

  /**
   * Get variants with caching for performance
   * Cache is invalidated after variant selections or page changes
   */
  async getVariants(forceRefresh = false) {
    const now = Date.now();
    const cacheExpired = now - this._variantsCacheTimestamp > this.CACHE_TTL;

    if (!this._cachedVariants || forceRefresh || cacheExpired) {
      this._cachedVariants = await this.extractVariants();
      this._variantsCacheTimestamp = now;
    }

    return this._cachedVariants;
  }

  /**
   * Invalidate cache when DOM changes (after variant selection)
   */
  private invalidateVariantsCache() {
    this._cachedVariants = null;
    this._variantsCacheTimestamp = 0;
  }

  /**
   * Core variant extraction method
   */
  private async extractVariants(
    fieldsets?: Locator[]
  ): Promise<VariantGroup[]> {
    fieldsets =
      fieldsets || (await this.variantWrapper.locator("fieldset").all());
    const variantGroups: VariantGroup[] = [];

    for (const fieldset of fieldsets) {
      try {
        const fieldsetLabel = await fieldset
          .locator("legend")
          .first()
          .textContent();

        if (!fieldsetLabel) {
          console.warn("No fieldset label found, skipping...");
          continue;
        }

        console.log(`Processing fieldset with label: "${fieldsetLabel}"`);

        // "Cloud Zip Hoodie Color Core Colors: Midnight" -> "color"
        // "Cloud Zip Hoodie Color Limited Edition:" -> "color"
        // "Cloud Zip Hoodie Size Size: S Size Guide" -> "size"
        let type = "";
        if (fieldsetLabel.toLowerCase().includes("color")) {
          type = "color";
        } else if (fieldsetLabel.toLowerCase().includes("size")) {
          type = "size";
        } else {
          // Fallback: extract type from label structure
          // Try to get the last word (likely the option type), e.g., "Size", "Color"
          const match = fieldsetLabel.match(/(\w+)(\s*:?(\s*size guide)?)?$/i);
          type = match
            ? match[1].toLowerCase()
            : fieldsetLabel.trim().toLowerCase();
        }

        const inputs = await fieldset.locator("input[type='radio']").all();
        const options: VariantOption[] = [];

        for (const input of inputs) {
          try {
            const value = (await input.getAttribute("value")) || "";
            const inputId = await input.getAttribute("id");

            let label = "";
            if (inputId) {
              const labelElement = await fieldset.locator(
                `label[for="${inputId}"]`
              );
              const labelCount = await labelElement.count();
              if (labelCount > 0) {
                label = (await labelElement.first().textContent()) || "";
              }
            }

            const isSelected = await input.isChecked();
            const isAvailable = await input.isEnabled();

            options.push({
              name: label?.trim() || value,
              value,
              isSelected,
              isAvailable,
              inputId: inputId || "",
            });
          } catch (inputError) {
            console.warn(`Failed to process variant option: ${inputError}`);
          }
        }

        if (options.length > 0) {
          // Check if we already have this type (multiple color fieldsets)
          const existingGroup = variantGroups.find((g) => g.type === type);
          if (existingGroup) {
            // Merge options into existing group
            existingGroup.options.push(...options);
            console.log(
              `Merged ${options.length} options into existing "${type}" group`
            );
          } else {
            variantGroups.push({ type, options });
            console.log(
              `Created new "${type}" group with ${options.length} options`
            );
          }
        }
      } catch (fieldsetError) {
        console.warn(`Failed to process fieldset: ${fieldsetError}`);
      }
    }

    console.log(
      `Extracted ${variantGroups.length} variant groups:`,
      variantGroups.map((g) => `${g.type} (${g.options.length} options)`)
    );

    return variantGroups;
  }

  async selectVariant(variantType: string, variantInputId: string) {
    // Clear any popups that might interfere

    const variantGroups = await this.getVariants();
    const group = variantGroups.find(
      (g) => g.type.toLowerCase() === variantType.toLowerCase()
    );

    if (!group) {
      throw new Error(`Variant group not found: ${variantType}`);
    }

    const option = group.options.find((o) => o.inputId === variantInputId);
    if (!option) {
      throw new Error(`Variant ID not found: ${variantInputId}`);
    }

    if (!option.isAvailable) {
      throw new Error(`Variant option "${variantInputId}" is not available`);
    }

    if (option.isSelected) {
      console.log(`Variant "${variantInputId}" is already selected`);
      return;
    }

    await this.variantWrapper
      .locator(`label[for="${variantInputId}"]`)
      .first()
      .click();

    // Invalidate cache after selection since DOM state changed
    this.invalidateVariantsCache();

    // Wait for Shopify price/availability updates
    await this.page.waitForTimeout(1000);
  }

  /**
   * Selects random variant with better error handling
   */
  async selectRandomVariant(variants?: VariantGroup[]) {
    const variantGroups = variants || (await this.getVariants());

    if (variantGroups.length === 0) {
      throw new Error("No variant groups found");
    }

    // Filter to only available options
    const availableGroups = variantGroups.filter((g) =>
      g.options.some((o) => o.isAvailable)
    );

    if (availableGroups.length === 0) {
      throw new Error("No available variant options found");
    }

    const randomGroup =
      availableGroups[Math.floor(Math.random() * availableGroups.length)];
    const availableOptions = randomGroup.options.filter((o) => o.isAvailable);
    const randomOption =
      availableOptions[Math.floor(Math.random() * availableOptions.length)];

    console.log(
      `Selecting random variant: ${randomGroup.type} - ${randomOption.value}`
    );

    await this.selectVariant(randomGroup.type, randomOption.inputId);
    if (!(await this.isAddToCartEnabled())) {
      await this.selectRandomVariant(); // Retry if add to cart is not enabled
    }
    return { randomGroup, randomOption };
  }

  /**
   * Get currently selected variants with fresh data
   */
  async getSelectedVariantOptions(): Promise<VariantGroup[]> {
    await this.page.waitForTimeout(1500); // Ensure DOM is stable
    // Always get fresh data for selection state
    const variantGroups = await this.getVariants(true);
    const selectedVariants: VariantGroup[] = [];

    for (const group of variantGroups) {
      const selectedOptions = group.options.filter(
        (option) => option.isSelected
      );

      if (selectedOptions.length > 0) {
        selectedVariants.push({ type: group.type, options: selectedOptions });
      }
    }

    return selectedVariants;
  }

  /**
   * Verifies that the variant selected via selectRandomVariant matches what is in getSelectedVariantOptions.
   * Throws an error if there is a mismatch.
   */
  private async verifyRandomVariantSelection(
    randomGroup: VariantGroup,
    randomOption: VariantOption
  ) {
    await this.page.reload();

    // Wait for the page to stabilize after reload
    await this.page.waitForTimeout(2000);
    const selectedVariants = await this.getSelectedVariantOptions();

    const selectedGroup = selectedVariants.find(
      (g) => g.type.toLowerCase() === randomGroup.type.toLowerCase()
    );
    console.log(
      `Verifying selection for group "${randomGroup.type}":`,
      selectedGroup
    );
    if (!selectedGroup) {
      console.error("Available groups:", selectedVariants);
      throw new Error(
        `Selected variant group "${randomGroup.type}" not found in selected variants`
      );
    }

    const selectedOption = selectedGroup.options.find(
      (o) => o.inputId === randomOption.inputId
    );
    if (!selectedOption) {
      throw new Error(
        `Selected variant option "${randomOption.inputId}" not found in selected group "${randomGroup.type}"`
      );
    }

    // Optionally, check name/value match as well
    if (
      selectedOption.name !== randomOption.name ||
      selectedOption.value !== randomOption.value
    ) {
      throw new Error(
        `Selected variant option does not match: expected "${randomOption.name}" (${randomOption.value}), got "${selectedOption.name}" (${selectedOption.value})`
      );
    }
  }

  async goto() {
    const res = await this.page.goto(
      "/products/cloud-zip-hoodie?variant=41732312891436",
      {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      }
    );

    // Pre-cache variants after page load
    await this.getVariants();

    return res;
  }

  async getPrice() {
    const priceWrapper = this.page.locator(
      "#product_hero_price-default-product-hero-price_3_rc"
    );
    const price = priceWrapper.locator("span:not([class])").first();
    return await price.textContent();
  }

  async addToCart() {
    // Clear any popups that might interfere

    if (!(await this.isAddToCartEnabled())) {
      throw new Error("Add to cart button is not enabled");
    }

    await this.addToCartButton.click();

    // Invalidate cache since page state changed
    this.invalidateVariantsCache();

    return {
      variantId: new URL(this.page.url()).searchParams.get("variant") || "",
      price: await this.getPrice(),
      name: await this.getProductTitle(),
    };
  }

  async isAddToCartEnabled() {
    return await this.addToCartButton.isVisible();
  }

  async getProductTitle() {
    await this.productTitle.waitFor({ state: "visible" });
    return (await this.productTitle.textContent()) || "";
  }

  /* Bundles */
  /* Locators */
  get bundleItems() {
    return this.page
      .locator("#product_hero_bundle-default-product-bundle_7_rc")
      .locator("div", { has: this.page.locator("div:has(a[href])") });
  }

  get bundleAddToCartButton() {
    return this.page
      .locator(
        "#product_hero_add_to_cart_button-default-product-hero-add-to-cart-button_6_rc"
      )
      .locator("button", { hasText: "Add bundle to cart" });
  }

  async selectRandomBundleVariants() {
    for (const item of await this.bundleItems.all()) {
      await this.extractVariants(await item.locator("fieldset").all()).then(
        (variants) => {
          if (variants.length === 0) {
            console.warn("No variants found for bundle item");
            return;
          }
          const randomGroup =
            variants[Math.floor(Math.random() * variants.length)];
          const availableOptions = randomGroup.options.filter(
            (o) => o.isAvailable
          );
          if (availableOptions.length === 0) {
            console.warn("No available options for bundle item");
            return;
          }
          const randomOption =
            availableOptions[
              Math.floor(Math.random() * availableOptions.length)
            ];
          this.selectVariant(randomGroup.type, randomOption.inputId);
        }
      );
    }
  }

  async addBundleToCart() {
    // Need to get all selected variants first, just going to do pseudocode here
    // await this.selectRandomBundleVariants();
    // await this.verifyRandomVariantSelection(randomGroup, randomOption);
    // Click the bundle add to cart button
    if (!(await this.bundleAddToCartButton.isVisible())) {
      throw new Error("Bundle add to cart button is not visible");
    }
    await this.bundleAddToCartButton.click();
  }
}
