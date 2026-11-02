import { expect, test } from '../../fixtures/cart-api.fixture';

import { testTags } from '../../config/test-tags';

const validAddress = {
  fullName: 'Demo Customer',
  addressLine1: '101 Automation Avenue',
  city: 'Pune',
  state: 'Maharashtra',
  postalCode: '411001',
  country: 'India',
};

test.describe('NexusShop checkout API', () => {
  test(
    'API-020 | checkout API | prepares checkout for a populated cart',
    {
      tag: [testTags.api, testTags.smoke, testTags.critical, testTags.positive],
    },
    async ({ cartRequest }) => {
      await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-002',
          quantity: 1,
        },
      });

      const response = await cartRequest.post('/api/checkout', {
        data: validAddress,
      });

      await expect(response).toBeOK();

      expect(await response.json()).toEqual({
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
      });
    },
  );

  test(
    'API-021 | checkout API | rejects an empty cart',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ cartRequest }) => {
      const response = await cartRequest.post('/api/checkout', {
        data: validAddress,
      });

      expect(response.status()).toBe(409);

      expect(await response.json()).toEqual({
        error: 'Cannot checkout an empty cart',
      });
    },
  );

  test(
    'API-022 | checkout API | requires a complete shipping address',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ cartRequest }) => {
      await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-002',
          quantity: 1,
        },
      });

      const response = await cartRequest.post('/api/checkout', {
        data: {
          ...validAddress,
          postalCode: '',
        },
      });

      expect(response.status()).toBe(400);

      expect(await response.json()).toEqual({
        error: 'A complete shipping address is required',
      });
    },
  );

  test(
    'API-023 | checkout API | preserves the exact cart total',
    {
      tag: [testTags.api, testTags.positive, testTags.critical],
    },
    async ({ cartRequest }) => {
      await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-002',
          quantity: 2,
        },
      });

      await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-003',
          quantity: 1,
        },
      });

      const response = await cartRequest.post('/api/checkout', {
        data: validAddress,
      });

      await expect(response).toBeOK();

      const body = await response.json();

      expect(body.totalInCents).toBe(15997);

      expect(body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            product: expect.objectContaining({
              id: 'PROD-002',
            }),
            quantity: 2,
          }),
          expect.objectContaining({
            product: expect.objectContaining({
              id: 'PROD-003',
            }),
            quantity: 1,
          }),
        ]),
      );

      expect(body.shippingAddress).toEqual(validAddress);
    },
  );
});
