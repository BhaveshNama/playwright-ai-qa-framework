import { expect, test } from '@playwright/test';

import { testTags } from '../../../config/test-tags';
import { LoginPage } from '../../../pages/login.page';

test.describe('NexusShop authentication', () => {
  test(
    'AUTH-001 | authentication | signs in an active customer',
    {
      tag: [testTags.ui, testTags.smoke, testTags.critical, testTags.positive],
    },
    async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.open();

      await expect(loginPage.heading).toBeVisible();

      await loginPage.signIn('demo.customer@example.test', 'NexusShop123!');

      await expect(page).toHaveURL(/\/products$/);

      await expect(
        page.getByRole('heading', {
          name: 'Products',
          level: 1,
        }),
      ).toBeVisible();
    },
  );

  test(
    'AUTH-002 | authentication | rejects invalid credentials',
    {
      tag: [testTags.ui, testTags.regression, testTags.negative],
    },
    async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.open();

      await loginPage.signIn('demo.customer@example.test', 'WrongPassword123!');

      await expect(loginPage.authenticationMessage).toBeVisible();

      await expect(loginPage.authenticationMessage).toHaveText('Invalid email or password');

      await expect(page).toHaveURL(/\/login$/);
    },
  );

  test(
    'AUTH-003 | authentication | rejects an inactive customer',
    {
      tag: [testTags.ui, testTags.regression, testTags.negative],
    },
    async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.open();

      await loginPage.signIn('inactive.customer@example.test', 'NexusShop123!');

      await expect(loginPage.authenticationMessage).toBeVisible();

      await expect(loginPage.authenticationMessage).toHaveText('Account is inactive');

      await expect(page).toHaveURL(/\/login$/);
    },
  );
});
