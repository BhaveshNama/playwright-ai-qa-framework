import { expect, test } from '../../../fixtures/cart-ui.fixture';

import { testTags } from '../../../config/test-tags';
import { CartPage } from '../../../pages/cart.page';
import { CataloguePage } from '../../../pages/catalogue.page';
import { CheckoutPage } from '../../../pages/checkout.page';

test.describe('NexusShop checkout', () => {
  test(
    'CHECKOUT-001 | checkout | validates shipping details for a populated cart',
    {
      tag: [testTags.ui, testTags.smoke, testTags.critical, testTags.positive],
    },
    async ({ page }) => {
      const cataloguePage = new CataloguePage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await cataloguePage.open();

      await cataloguePage.addProductToCart('QA Wireless Mouse');

      await expect(page).toHaveURL(/\/cart$/);

      await cartPage.proceedToCheckout();

      await expect(page).toHaveURL(/\/checkout$/);

      await expect(checkoutPage.heading).toBeVisible();

      await expect(checkoutPage.orderSummary).toBeVisible();

      await expect(checkoutPage.checkoutTotal).toHaveText('Total: $39.99');

      await checkoutPage.fillShippingAddress({
        fullName: 'Demo Customer',
        addressLine1: '101 Automation Avenue',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411001',
        country: 'India',
      });

      await checkoutPage.placeOrder();

      await expect(checkoutPage.checkoutMessage).toHaveText('Checkout details are valid.');
    },
  );

  test(
    'CHECKOUT-002 | checkout | prevents checkout with an empty cart',
    {
      tag: [testTags.ui, testTags.regression, testTags.negative],
    },
    async ({ page }) => {
      const checkoutPage = new CheckoutPage(page);

      await checkoutPage.open();

      await expect(checkoutPage.heading).toBeVisible();

      await expect(page.getByRole('alert')).toHaveText('Your cart is empty.');

      await expect(
        page.getByRole('link', {
          name: 'Continue shopping',
        }),
      ).toBeVisible();

      await expect(checkoutPage.placeOrderButton).toHaveCount(0);
    },
  );

  test(
    'CHECKOUT-003 | checkout | requires complete shipping details',
    {
      tag: [testTags.ui, testTags.regression, testTags.negative],
    },
    async ({ page }) => {
      const cataloguePage = new CataloguePage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await cataloguePage.open();

      await cataloguePage.addProductToCart('QA Wireless Mouse');

      await expect(page).toHaveURL(/\/cart$/);

      await cartPage.proceedToCheckout();

      await expect(page).toHaveURL(/\/checkout$/);

      await checkoutPage.fullNameInput.fill('Demo Customer');

      await checkoutPage.addressLine1Input.fill('101 Automation Avenue');

      await checkoutPage.cityInput.fill('Pune');

      await checkoutPage.stateInput.fill('Maharashtra');

      // Postal code intentionally remains empty.
      await checkoutPage.countryInput.fill('India');

      await checkoutPage.placeOrder();

      await expect(checkoutPage.postalCodeInput).toBeFocused();

      await expect(checkoutPage.postalCodeInput).toHaveValue('');

      await expect(checkoutPage.checkoutMessage).toHaveText('');

      await expect(page).toHaveURL(/\/checkout$/);
    },
  );

  test(
    'CHECKOUT-004 | checkout | preserves the exact multi-product cart total',
    {
      tag: [testTags.ui, testTags.regression, testTags.positive, testTags.critical],
    },
    async ({ page }) => {
      const cataloguePage = new CataloguePage(page);
      const cartPage = new CartPage(page);
      const checkoutPage = new CheckoutPage(page);

      await cataloguePage.open();

      await cataloguePage.addProductToCart('QA Wireless Mouse');

      await expect(page).toHaveURL(/\/cart$/);

      await cartPage.updateQuantity('QA Wireless Mouse', 2);

      await expect(cartPage.cartTotal).toHaveText('Total: $79.98');

      await cataloguePage.open();

      await cataloguePage.addProductToCart('Automation Keyboard');

      await expect(page).toHaveURL(/\/cart$/);

      await expect(cartPage.cartTotal).toHaveText('Total: $159.97');

      await cartPage.proceedToCheckout();

      await expect(page).toHaveURL(/\/checkout$/);

      await expect(checkoutPage.heading).toBeVisible();

      await expect(checkoutPage.checkoutTotal).toHaveText('Total: $159.97');
    },
  );
});
