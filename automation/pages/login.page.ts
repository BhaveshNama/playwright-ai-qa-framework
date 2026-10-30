import type { Locator, Page } from '@playwright/test';

import { routes } from '../config/routes';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  protected readonly path = routes.login;

  /*
   * These locators express the intended accessible UI contract.
   * NexusShop should expose user-facing labels and button names matching
   * these concepts when the application is implemented.
   */
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;

  constructor(page: Page) {
    super(page);

    this.emailInput = page.getByLabel('Email address');
    this.passwordInput = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', {
      name: 'Sign in',
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
