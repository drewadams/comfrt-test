# Comfrt Test Automation

## Overview

Comprehensive E2E test automation suite for Comfrt's Shopify store, covering core purchase flows with error handling and accessibility validation.

**Note:** I limited my time on this to ~6 hours. There is still quite a bit I'd like to have gotten to.

## Installation

```bash
git clone <repo>
cd repo
npm i
```

## Run Tests

```bash
npm test
```

Additional npm scripts for targeted testing are available in `package.json`.

## Test Coverage

### ✅ Core Requirements

- **Add to Cart (PDP)** - `tests/pdp/add-to-cart.spec.ts`
  - Advanced variant selection with caching optimization
  - POM: `utils/pages/pdp.ts`
- **Side Cart Verification** - `tests/features/slideout-cart.spec.ts`
  - Quantity management and cart state validation
  - Component-based architecture for reusability
- **Guest Checkout Flow** - `tests/checkout/checkout.spec.ts`
  - Shopify checkout integration - ends prior to payment
  - Easily able to stub in future
  - POM: `utils/pages/checkout.ts`
- **Negative Case Testing** - `tests/pdp/required-variants.spec.ts`
  - Pseudocode due to inability to find a pdp that followed the requirements

### 🎯 Bonus Features

- **Accessibility Testing** - Integrated axe-core validation
  - Reports: `./axe-report/<page>/<date>/<device-type>/`
  - Run: `npm run tests:accessibility`
- **CI/CD Integration** - GitHub Actions workflow included
- **Bundle Testing** - Architecture established for future enhancement

## Architecture Decisions

### **Playwright Selection**

- Modern async/await handling equivalent to Cypress
- Superior TypeScript integration
- Built-in debugging and trace capabilities
- Cross-browser testing ready
- AI ready with MCP tooling

### **Performance Optimizations**

- Strategic resource blocking for faster test execution
- Intelligent wait strategies optimized for Shopify's architecture
- Variant caching to reduce DOM queries

### **Resilient Selector Strategy**

- Multi-level fallback selectors for dynamic content
- Adaptive locators that handle Shopify's DOM variations
- Third-party overlay management (Alia popup handling)

## Known Considerations

### **Shopify-Specific Challenges & Solutions**

- **Dynamic DOM**: Implemented adaptive selectors with caching
- **AJAX Cart Updates**: Added wait strategies
- **Third-party Integrations**: Blocked requests to specific third-parties to increase test viability
- **Variant Complexity**: Created sophisticated variant selection logic

### **Environment Optimizations**

- Resource blocking configured for test environment performance
- Timeout strategies adjusted for network variability
- Retry logic implemented for CI stability

## Future Enhancements

- Cross-browser testing (Firefox/Safari configurations ready)
- Mobile viewport testing expansion
- Performance monitoring integration
- Enhanced bundle testing implementation

## Test Reports

- HTML reports: `playwright-report/`
- Accessibility reports: `axe-report/`
- CI artifacts: Automatically uploaded on test completion
