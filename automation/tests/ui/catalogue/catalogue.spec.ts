import { expect, test } from '@playwright/test';

import { testTags } from '../../../config/test-tags';
import { CataloguePage } from '../../../pages/catalogue.page';

test.describe('NexusShop product catalogue', () => {
  test(
    'CAT-001 | catalogue | displays the seeded product catalogue',
    {
      tag: [testTags.ui, testTags.smoke, testTags.critical, testTags.positive],
    },
    async ({ page }) => {
      const cataloguePage = new CataloguePage(page);

      await cataloguePage.open();

      await expect(cataloguePage.heading).toBeVisible();
      await expect(cataloguePage.searchInput).toBeVisible();
      await expect(cataloguePage.productCatalogue).toBeVisible();

      await expect(cataloguePage.productByName('Nexus Laptop')).toContainText('Price: $1299.99');

      await expect(cataloguePage.productByName('Nexus Laptop')).toContainText('Status: Available');

      await expect(cataloguePage.productByName('QA Wireless Mouse')).toContainText('Price: $39.99');

      await expect(cataloguePage.productByName('Playwright Backpack')).toContainText(
        'Status: Unavailable',
      );
    },
  );

  test(
    'CAT-002 | catalogue | filters products by product name',
    {
      tag: [testTags.ui, testTags.regression, testTags.positive],
    },
    async ({ page }) => {
      const cataloguePage = new CataloguePage(page);

      await cataloguePage.open();

      await cataloguePage.searchFor('mouse');

      await expect(cataloguePage.productByName('QA Wireless Mouse')).toBeVisible();

      await expect(cataloguePage.productByName('Nexus Laptop')).toBeHidden();

      await expect(cataloguePage.productByName('Automation Keyboard')).toBeHidden();
    },
  );

  test(
    'CAT-003 | catalogue | shows feedback when search has no matches',
    {
      tag: [testTags.ui, testTags.regression, testTags.negative],
    },
    async ({ page }) => {
      const cataloguePage = new CataloguePage(page);

      await cataloguePage.open();

      await cataloguePage.searchFor('product-that-does-not-exist');

      await expect(cataloguePage.noProductsMessage).toBeVisible();

      await expect(cataloguePage.noProductsMessage).toHaveText('No products found.');
    },
  );
});
