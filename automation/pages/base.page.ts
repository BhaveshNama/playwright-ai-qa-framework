import type { Page } from '@playwright/test';

/*
 * BasePage stores only behavior that genuinely applies to all application
 * pages. It intentionally does not wrap Playwright click(), fill(), or wait
 * methods because those wrappers would add no project-specific value.
 */
export abstract class BasePage {
  protected constructor(protected readonly page: Page) {}

  /*
   * Every page object defines its application-relative route.
   * Environment-specific host information remains in Playwright configuration.
   */
  protected abstract readonly path: string;

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  get currentUrl(): string {
    return this.page.url();
  }
}
