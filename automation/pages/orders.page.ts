import type { Locator, Page } from '@playwright/test';

import { routes } from '../config/routes';
import { BasePage } from './base.page';

export class CheckoutPage extends BasePage {
  protected readonly path = routes.checkout;

  readonly heading: Locator;
  readonly placeOrderButton: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', {
      name: 'Checkout',
    });

    this.placeOrderButton = page.getByRole('button', {
      name: 'Place order',
    });
  }

  async placeOrder(): Promise<void> {
    await this.placeOrderButton.click();
  }
}
