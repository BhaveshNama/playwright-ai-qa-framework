import type { Locator, Page } from '@playwright/test';

/*
 * NavigationComponent models reusable navigation behavior.
 *
 * Locators will be added only after the NexusShop UI contract exists.
 * This prevents the framework from inventing selectors before the application
 * defines accessible names or stable test identifiers.
 */
export class NavigationComponent {
  constructor(
    private readonly page: Page,
    private readonly root: Locator,
  ) {}

  get container(): Locator {
    return this.root;
  }

  get currentUrl(): string {
    return this.page.url();
  }
}
