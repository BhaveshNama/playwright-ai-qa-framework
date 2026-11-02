import { expect, test } from '@playwright/test';

import { testTags } from '../../../config/test-tags';
import { CartPage } from '../../../pages/cart.page';
import { CataloguePage } from '../../../pages/catalogue.page';

test.describe('NexusShop shopping cart', () => {
  test.describe.configure({
    mode: 'serial',
  });

  test.beforeEach(async ({ request }) => {
    const response = await request.delete('/api/cart');

    expect(response.status()).toBe(204);
  });

  test(
    'CART-001 | cart | adds an available product from the catalogue',
    {
      tag: [testTags.ui, testTags.smoke, testTags.critical, testTags.positive],
    },
    async ({ page }) => {
      const cataloguePage = new CataloguePage(page);
      const cartPage = new CartPage(page);

      await cataloguePage.open();

      await cataloguePage.addProductToCart('QA Wireless Mouse');

      await expect(page).toHaveURL(/\/cart$/);

      await expect(cartPage.heading).toBeVisible();

      const cartItem = cartPage.cartItem('QA Wireless Mouse');

      await expect(cartItem).toBeVisible();

      await expect(cartItem).toContainText('Unit price: $39.99');

      await expect(cartPage.quantityInput('QA Wireless Mouse')).toHaveValue('1');

      await expect(cartItem).toContainText('Line total: $39.99');

      await expect(cartPage.cartTotal).toHaveText('Total: $39.99');

      await expect(cartPage.checkoutButton).toBeEnabled();
    },
  );
});
