import type { Locator, Page } from '@playwright/test';

import { routes } from '../config/routes';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  protected readonly path = routes.cart;

  readonly heading: Locator;
  readonly cartItems: Locator;
  readonly cartTotal: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', {
      name: 'Shopping cart',
      level: 1,
    });

    this.cartItems = page.getByRole('region', {
      name: 'Cart items',
    });

    this.cartTotal = page.getByLabel('Cart total');

    this.checkoutButton = page.getByRole('button', {
      name: 'Checkout',
    });
  }

  cartItem(productName: string): Locator {
    return this.page.getByRole('article', {
      name: productName,
    });
  }

  quantityInput(productName: string): Locator {
    return this.cartItem(productName).getByLabel('Quantity');
  }

  removeButton(productName: string): Locator {
    return this.page.getByRole('button', {
      name: `Remove ${productName}`,
    });
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }

  async updateQuantity(productName: string, quantity: number): Promise<void> {
    const input = this.quantityInput(productName);

    await input.fill(String(quantity));
    await input.press('Tab');
  }

  async removeProduct(productName: string): Promise<void> {
    await this.removeButton(productName).click();
  }
}
