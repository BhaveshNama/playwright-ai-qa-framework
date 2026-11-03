import type { Locator, Page } from '@playwright/test';

import { routes } from '../config/routes';
import { BasePage } from './base.page';

export class OrdersPage extends BasePage {
  protected readonly path = routes.orders;

  readonly heading: Locator;
  readonly orderDetails: Locator;
  readonly orderIdentifier: Locator;
  readonly orderStatus: Locator;
  readonly orderTotal: Locator;
  readonly shippingRecipient: Locator;
  readonly continueShoppingLink: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', {
      name: 'Order confirmation',
      level: 1,
    });

    this.orderDetails = page.getByRole('region', {
      name: 'Order details',
    });

    this.orderIdentifier = page.getByLabel('Order identifier');

    this.orderStatus = page.getByLabel('Order status');

    this.orderTotal = page.getByLabel('Order total');

    this.shippingRecipient = page.getByLabel('Shipping recipient');

    this.continueShoppingLink = page.getByRole('link', {
      name: 'Continue shopping',
    });
  }
}
