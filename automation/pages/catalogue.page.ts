import type { Locator, Page } from '@playwright/test';

import { routes } from '../config/routes';
import { BasePage } from './base.page';

export class CataloguePage extends BasePage {
  protected readonly path = routes.catalogue;

  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly productCatalogue: Locator;
  readonly noProductsMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', {
      name: 'Products',
      level: 1,
    });

    this.searchInput = page.getByRole('searchbox', {
      name: 'Search products',
    });

    this.productCatalogue = page.getByRole('region', {
      name: 'Product catalogue',
    });

    this.noProductsMessage = page.getByRole('status');
  }

  productByName(productName: string): Locator {
    return this.page.getByRole('article', {
      name: productName,
    });
  }

  async searchFor(productName: string): Promise<void> {
    await this.searchInput.fill(productName);
  }

  async addProductToCart(productName: string): Promise<void> {
    await this.page
      .getByRole('button', {
        name: `Add ${productName} to cart`,
      })
      .click();
  }
}
