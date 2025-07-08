import { Page, test as base } from "@playwright/test";

import { AxeBuilder } from "@axe-core/playwright";
import { AxeResults as AxeResultsType } from "axe-core";
import { createHtmlReport } from "axe-html-reporter";

interface AxeOptions {
  page: Page;
  options?: {
    createHtmlReport?: boolean;
    reportFileName?: string;
    outputDir?: string;
    customSummary?: string;
  };
}

interface ADATestFixtures {
  axeBuilder: AxeBuilder;
  runAxe: (options: AxeOptions) => Promise<{
    results: AxeResultsType;
    violations: any[];
    reportPath?: string;
    hasViolations: boolean;
  }>;
}

/**
 * This fixture sets up an AxeBuilder instance for accessibility testing.
 * It can be used in tests to run accessibility checks.
 */
export const ADATest = base.extend<ADATestFixtures>({
  axeBuilder: async ({ page }, use) => {
    await use(new AxeBuilder({ page }));
  },
  runAxe: async ({ axeBuilder, isMobile }, use) => {
    await use(async (options: AxeOptions) => {
      const { page, options: axeOptions } = options;

      try {
        const results = await axeBuilder.analyze();
        const hasViolations = results.violations.length > 0;
        if (hasViolations) {
          console.error(
            `Found ${results.violations.length} accessibility violations`
          );
        } else {
          console.log("✅ No accessibility violations found");
        }

        // Generate HTML report
        let reportPath: string | undefined;

        // Create the report (if there are violations and report generation is enabled)
        if (hasViolations && axeOptions?.createHtmlReport) {
          const platform = isMobile ? "mobile" : "desktop";
          const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
          const outputDir =
            axeOptions?.outputDir ||
            `./axe-report/${await page.title()}/${dateStr}/${platform}`;
          const reportFileName =
            axeOptions?.reportFileName || `pdp-${platform}-report.html`;
          reportPath = `${outputDir}/${reportFileName}`;

          createHtmlReport({
            results,
            options: {
              outputDir,
              reportFileName,
              projectKey: "Comfrt",
              customSummary:
                axeOptions?.customSummary ||
                `Axe report for ${page.url()} on ${platform} platform`,
            },
          });

          if (!reportPath) {
            throw new Error("Failed to generate accessibility report.");
          }

          console.log(`Accessibility report generated: ${reportPath}`);
        }

        return {
          results,
          reportPath,
          hasViolations,
          violations: results.violations,
        };
      } catch (error) {
        console.error("Error running Axe accessibility check: ", error);
        throw error;
      }
    });
  },
});
