import type { Locator, Page } from '@playwright/test';

import { routes } from '../config/routes';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  protected readonly path = routes.cart;

  readonly heading: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', {
      name: 'Shopping cart',
    });

    this.checkoutButton = page.getByRole('button', {
      name: 'Checkout',
    });
  }

  cartItem(productName: string): Locator {
    return this.page.getByRole('article').filter({ hasText: productName });
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
