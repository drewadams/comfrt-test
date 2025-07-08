import { Page } from "playwright/types/test";

export default class BasePage {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string) {
    const res = await this.page.goto(url, { waitUntil: "load" });
    return res;
  }

  async clearAliaPopup() {
    // Choosing to fully remove the Alia popup
    // instead of just hiding it, to ensure it doesn't interfere with tests.
    // This is a workaround for the Alia popup that appears on the page.
    try {
      // Wait a bit for popup to potentially appear
      await this.page.waitForTimeout(1000);

      const aliaWrapper = this.page.getByLabel("Alia popup");
      if (await aliaWrapper.isVisible()) {
        await aliaWrapper.evaluate((el) => el.remove());
        console.log("Alia popup removed");
      }

      // Wait a bit after removal to ensure DOM is stable
      await this.page.waitForTimeout(500);
    } catch (error) {
      console.log("Could not clear Alia popup, continuing anyway:", error);
    }
  }

  async waitForLoad(
    loadState: "load" | "domcontentloaded" | "networkidle" = "load"
  ) {
    await this.page.waitForLoadState(loadState, {
      timeout: 20000,
    });
  }

  async getTitle() {
    return this.page.title();
  }

  async getUrl() {
    return this.page.url();
  }

  async screenshot(name: string) {
    const path = `./tests/screenshots/${name}.png`;

    await this.page.screenshot({
      path,
      fullPage: true,
    });
    console.log(`Screenshot saved to ${path}`);

    return path;
  }
}
