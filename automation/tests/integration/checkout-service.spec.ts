import { expect, test } from '@playwright/test';

import type { CheckoutAddress } from '../../../apps/nexus-shop/src/models/checkout.model';
import { cartService } from '../../../apps/nexus-shop/src/services/cart.service';
import { checkoutService } from '../../../apps/nexus-shop/src/services/checkout.service';
import { testTags } from '../../config/test-tags';

const validAddress: CheckoutAddress = {
  fullName: 'Demo Customer',
  addressLine1: '101 Automation Avenue',
  city: 'Pune',
  state: 'Maharashtra',
  postalCode: '411001',
  country: 'India',
};

test.describe('NexusShop checkout service', () => {
  test(
    'CFG-030 | checkout service | prepares checkout for a populated cart',
    {
      tag: [testTags.integration, testTags.positive, testTags.critical],
    },
    async () => {
      const cartId = 'checkout-populated-cart';

      cartService.clear(cartId);

      cartService.addProduct('PROD-002', 1, cartId);

      const result = checkoutService.prepareCheckout(cartId, validAddress);

      expect(result).toEqual({
        success: true,
        summary: {
          items: [
            {
              product: expect.objectContaining({
                id: 'PROD-002',
                name: 'QA Wireless Mouse',
                priceInCents: 3999,
              }),
              quantity: 1,
            },
          ],
          totalInCents: 3999,
          shippingAddress: validAddress,
        },
      });

      cartService.clear(cartId);
    },
  );

  test(
    'CFG-031 | checkout service | rejects an empty cart',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const cartId = 'checkout-empty-cart';

      cartService.clear(cartId);

      const result = checkoutService.prepareCheckout(cartId, validAddress);

      expect(result).toEqual({
        success: false,
        reason: 'EMPTY_CART',
      });
    },
  );

  test(
    'CFG-032 | checkout service | rejects an incomplete address',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const cartId = 'checkout-invalid-address';

      cartService.clear(cartId);

      cartService.addProduct('PROD-002', 1, cartId);

      const result = checkoutService.prepareCheckout(cartId, {
        ...validAddress,
        postalCode: '',
      });

      expect(result).toEqual({
        success: false,
        reason: 'INVALID_ADDRESS',
      });

      cartService.clear(cartId);
    },
  );

  test(
    'CFG-033 | checkout service | preserves the exact cart total',
    {
      tag: [testTags.integration, testTags.positive, testTags.critical],
    },
    async () => {
      const cartId = 'checkout-total-cart';

      cartService.clear(cartId);

      cartService.addProduct('PROD-002', 2, cartId);

      cartService.addProduct('PROD-003', 1, cartId);

      const result = checkoutService.prepareCheckout(cartId, validAddress);

      expect(result).toEqual({
        success: true,
        summary: {
          items: expect.arrayContaining([
            expect.objectContaining({
              quantity: 2,
              product: expect.objectContaining({
                id: 'PROD-002',
              }),
            }),
            expect.objectContaining({
              quantity: 1,
              product: expect.objectContaining({
                id: 'PROD-003',
              }),
            }),
          ]),
          totalInCents: 15997,
          shippingAddress: validAddress,
        },
      });

      cartService.clear(cartId);
    },
  );

  test(
    'CFG-034 | checkout service | keeps checkout carts isolated',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const firstCartId = 'checkout-isolation-a';
      const secondCartId = 'checkout-isolation-b';

      cartService.clear(firstCartId);
      cartService.clear(secondCartId);

      cartService.addProduct('PROD-002', 1, firstCartId);

      const firstResult = checkoutService.prepareCheckout(firstCartId, validAddress);

      const secondResult = checkoutService.prepareCheckout(secondCartId, validAddress);

      expect(firstResult).toEqual(
        expect.objectContaining({
          success: true,
        }),
      );

      expect(secondResult).toEqual({
        success: false,
        reason: 'EMPTY_CART',
      });

      cartService.clear(firstCartId);
      cartService.clear(secondCartId);
    },
  );
});
