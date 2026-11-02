import type { Locator, Page } from '@playwright/test';

import { routes } from '../config/routes';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  protected readonly path = routes.login;

  readonly heading: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly authenticationMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.heading = page.getByRole('heading', {
      name: 'Sign in',
      level: 1,
    });

    this.emailInput = page.getByLabel('Email address');

    this.passwordInput = page.getByLabel('Password');

    this.signInButton = page.getByRole('button', {
      name: 'Sign in',
    });

    this.authenticationMessage = page.getByRole('alert');
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }
}
