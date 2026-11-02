import { expect, test } from '@playwright/test';

import { cartService } from '../../../apps/nexus-shop/src/services/cart.service';
import { testTags } from '../../config/test-tags';

test.describe('NexusShop cart service', () => {
  test.beforeEach(() => {
    cartService.clear();
  });

  test(
    'CFG-021 | cart service | adds an available product',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const result = cartService.addProduct('PROD-002');

      expect(result).toEqual({
        success: true,
        cart: {
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
        },
      });
    },
  );

  test(
    'CFG-022 | cart service | increments quantity for an existing product',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      cartService.addProduct('PROD-002');
      const result = cartService.addProduct('PROD-002');

      expect(result).toEqual({
        success: true,
        cart: {
          items: [
            {
              product: expect.objectContaining({
                id: 'PROD-002',
              }),
              quantity: 2,
            },
          ],
          totalInCents: 7998,
        },
      });
    },
  );

  test(
    'CFG-023 | cart service | updates product quantity and total',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      cartService.addProduct('PROD-003');

      const result = cartService.updateQuantity('PROD-003', 3);

      expect(result).toEqual({
        success: true,
        cart: {
          items: [
            {
              product: expect.objectContaining({
                id: 'PROD-003',
                priceInCents: 7999,
              }),
              quantity: 3,
            },
          ],
          totalInCents: 23997,
        },
      });
    },
  );

  test(
    'CFG-024 | cart service | removes a product',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      cartService.addProduct('PROD-002');
      cartService.addProduct('PROD-003');

      const cart = cartService.removeProduct('PROD-002');

      expect(cart.items).toHaveLength(1);

      expect(cart.items[0]?.product.id).toBe('PROD-003');

      expect(cart.totalInCents).toBe(7999);
    },
  );

  test(
    'CFG-025 | cart service | rejects an unavailable product',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const result = cartService.addProduct('PROD-005');

      expect(result).toEqual({
        success: false,
        reason: 'PRODUCT_UNAVAILABLE',
      });

      expect(cartService.getCart()).toEqual({
        items: [],
        totalInCents: 0,
      });
    },
  );

  test(
    'CFG-026 | cart service | rejects an unknown product',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const result = cartService.addProduct('PROD-999');

      expect(result).toEqual({
        success: false,
        reason: 'PRODUCT_NOT_FOUND',
      });
    },
  );

  test(
    'CFG-027 | cart service | rejects an invalid quantity',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const result = cartService.addProduct('PROD-002', 0);

      expect(result).toEqual({
        success: false,
        reason: 'INVALID_QUANTITY',
      });
    },
  );

  test(
    'CFG-028 | cart service | clears all cart items',
    {
      tag: [testTags.integration],
    },
    async () => {
      cartService.addProduct('PROD-001');
      cartService.addProduct('PROD-002');

      cartService.clear();

      expect(cartService.getCart()).toEqual({
        items: [],
        totalInCents: 0,
      });
    },
  );
});
