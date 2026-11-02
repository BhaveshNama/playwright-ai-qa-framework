import { test as base } from '@playwright/test';

interface CartUiFixtures {
  cartId: string;
  cartIsolation: void;
}

export const test = base.extend<CartUiFixtures>({
  cartId: async ({ browserName }, use, testInfo) => {
    const cartId = `ui-${browserName}-${testInfo.workerIndex}-${testInfo.testId}`;

    await use(cartId);
  },

  cartIsolation: [
    async ({ context, cartId }, use) => {
      await context.setExtraHTTPHeaders({
        'x-cart-id': cartId,
      });

      await use();
    },
    {
      auto: true,
    },
  ],
});

export { expect } from '@playwright/test';
