import type { Locator, Page } from '@playwright/test';

import { routes } from '../config/routes';
import { BasePage } from './base.page';

export class CataloguePage extends BasePage {
  protected readonly path = routes.catalogue;

  readonly heading: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', {
      name: 'Products',
    });

    this.searchInput = page.getByRole('searchbox', {
      name: 'Search products',
    });
  }

  productByName(productName: string): Locator {
    return this.page.getByRole('article').filter({ hasText: productName });
  }
}
