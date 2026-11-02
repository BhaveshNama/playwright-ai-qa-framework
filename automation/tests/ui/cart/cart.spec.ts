import { expect, test } from '../../../fixtures/cart-ui.fixture';

import { testTags } from '../../../config/test-tags';
import { CartPage } from '../../../pages/cart.page';
import { CataloguePage } from '../../../pages/catalogue.page';

test.describe('NexusShop shopping cart', () => {
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

  test(
    'CART-002 | cart | updates product quantity and total',
    {
      tag: [testTags.ui, testTags.regression, testTags.positive],
    },
    async ({ page }) => {
      const cataloguePage = new CataloguePage(page);
      const cartPage = new CartPage(page);

      await cataloguePage.open();

      await cataloguePage.addProductToCart('QA Wireless Mouse');

      await expect(page).toHaveURL(/\/cart$/);

      await cartPage.updateQuantity('QA Wireless Mouse', 3);

      await expect(cartPage.quantityInput('QA Wireless Mouse')).toHaveValue('3');

      const cartItem = cartPage.cartItem('QA Wireless Mouse');

      await expect(cartItem).toContainText('Line total: $119.97');

      await expect(cartPage.cartTotal).toHaveText('Total: $119.97');
    },
  );

  test(
    'CART-003 | cart | removes a product from the cart',
    {
      tag: [testTags.ui, testTags.regression, testTags.positive],
    },
    async ({ page }) => {
      const cataloguePage = new CataloguePage(page);
      const cartPage = new CartPage(page);

      await cataloguePage.open();

      await cataloguePage.addProductToCart('QA Wireless Mouse');

      await expect(page).toHaveURL(/\/cart$/);

      await expect(cartPage.cartItem('QA Wireless Mouse')).toBeVisible();

      await cartPage.removeProduct('QA Wireless Mouse');

      await expect(cartPage.cartItem('QA Wireless Mouse')).toHaveCount(0);

      await expect(cartPage.cartItems).toContainText('Your cart is empty.');

      await expect(cartPage.cartTotal).toHaveText('Total: $0.00');

      await expect(cartPage.checkoutButton).toBeDisabled();
    },
  );

  test(
    'CART-004 | cart | calculates the total for multiple products',
    {
      tag: [testTags.ui, testTags.regression, testTags.positive, testTags.critical],
    },
    async ({ page }) => {
      const cataloguePage = new CataloguePage(page);
      const cartPage = new CartPage(page);

      await cataloguePage.open();

      await cataloguePage.addProductToCart('QA Wireless Mouse');

      await expect(page).toHaveURL(/\/cart$/);

      await cataloguePage.open();

      await cataloguePage.addProductToCart('Automation Keyboard');

      await expect(page).toHaveURL(/\/cart$/);

      const mouse = cartPage.cartItem('QA Wireless Mouse');

      const keyboard = cartPage.cartItem('Automation Keyboard');

      await expect(mouse).toBeVisible();
      await expect(keyboard).toBeVisible();

      await expect(mouse).toContainText('Unit price: $39.99');

      await expect(keyboard).toContainText('Unit price: $79.99');

      await expect(cartPage.quantityInput('QA Wireless Mouse')).toHaveValue('1');

      await expect(cartPage.quantityInput('Automation Keyboard')).toHaveValue('1');

      await expect(mouse).toContainText('Line total: $39.99');

      await expect(keyboard).toContainText('Line total: $79.99');

      await expect(cartPage.cartTotal).toHaveText('Total: $119.98');

      await expect(cartPage.checkoutButton).toBeEnabled();
    },
  );

  test(
    'CART-005 | cart | displays the empty cart state',
    {
      tag: [testTags.ui, testTags.regression, testTags.positive],
    },
    async ({ page }) => {
      const cartPage = new CartPage(page);

      await cartPage.open();

      await expect(cartPage.heading).toBeVisible();

      await expect(cartPage.cartItems).toContainText('Your cart is empty.');

      await expect(cartPage.cartTotal).toHaveText('Total: $0.00');

      await expect(cartPage.checkoutButton).toBeDisabled();
    },
  );
});
