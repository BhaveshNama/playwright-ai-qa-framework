import { test as base, type APIRequestContext } from '@playwright/test';

interface CartApiFixtures {
  cartRequest: APIRequestContext;
}

export const test = base.extend<CartApiFixtures>({
  cartRequest: async ({ playwright, baseURL }, use, testInfo) => {
    const cartId = `api-${testInfo.workerIndex}-${testInfo.testId}`;

    const context = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: {
        'x-cart-id': cartId,
      },
    });

    await context.delete('/api/cart');

    await use(context);

    await context.delete('/api/cart');
    await context.dispose();
  },
});

export { expect } from '@playwright/test';
