import { expect, test } from '../../fixtures/cart-api.fixture';

import { testTags } from '../../config/test-tags';

test.describe('NexusShop cart API', () => {
  test(
    'API-011 | cart API | returns an empty cart',
    {
      tag: [testTags.api, testTags.positive],
    },
    async ({ cartRequest }) => {
      const response = await cartRequest.get('/api/cart');

      await expect(response).toBeOK();

      expect(await response.json()).toEqual({
        items: [],
        totalInCents: 0,
      });
    },
  );

  test(
    'API-012 | cart API | adds an available product',
    {
      tag: [testTags.api, testTags.smoke, testTags.positive],
    },
    async ({ cartRequest }) => {
      const response = await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-002',
          quantity: 2,
        },
      });

      expect(response.status()).toBe(201);

      expect(await response.json()).toEqual({
        items: [
          {
            product: expect.objectContaining({
              id: 'PROD-002',
              name: 'QA Wireless Mouse',
              priceInCents: 3999,
            }),
            quantity: 2,
          },
        ],
        totalInCents: 7998,
      });
    },
  );

  test(
    'API-013 | cart API | updates item quantity and total',
    {
      tag: [testTags.api, testTags.positive],
    },
    async ({ cartRequest }) => {
      await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-003',
          quantity: 1,
        },
      });

      const response = await cartRequest.patch('/api/cart/items/PROD-003', {
        data: {
          quantity: 3,
        },
      });

      await expect(response).toBeOK();

      expect(await response.json()).toEqual({
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
      });
    },
  );

  test(
    'API-014 | cart API | removes an item',
    {
      tag: [testTags.api, testTags.positive],
    },
    async ({ cartRequest }) => {
      await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-002',
          quantity: 1,
        },
      });

      const response = await cartRequest.delete('/api/cart/items/PROD-002');

      await expect(response).toBeOK();

      expect(await response.json()).toEqual({
        items: [],
        totalInCents: 0,
      });
    },
  );

  test(
    'API-015 | cart API | rejects an unavailable product',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ cartRequest }) => {
      const response = await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-005',
          quantity: 1,
        },
      });

      expect(response.status()).toBe(409);

      expect(await response.json()).toEqual({
        error: 'Product is unavailable',
      });
    },
  );

  test(
    'API-016 | cart API | rejects an unknown product',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ cartRequest }) => {
      const response = await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-999',
          quantity: 1,
        },
      });

      expect(response.status()).toBe(404);

      expect(await response.json()).toEqual({
        error: 'Product not found',
      });
    },
  );

  test(
    'API-017 | cart API | rejects an invalid quantity',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ cartRequest }) => {
      const response = await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-002',
          quantity: 0,
        },
      });

      expect(response.status()).toBe(400);

      expect(await response.json()).toEqual({
        error: 'Valid productId and quantity are required',
      });
    },
  );

  test(
    'API-018 | cart API | clears the cart',
    {
      tag: [testTags.api, testTags.positive],
    },
    async ({ cartRequest }) => {
      await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-001',
          quantity: 1,
        },
      });

      const clearResponse = await cartRequest.delete('/api/cart');

      expect(clearResponse.status()).toBe(204);

      const cartResponse = await cartRequest.get('/api/cart');

      expect(await cartResponse.json()).toEqual({
        items: [],
        totalInCents: 0,
      });
    },
  );

  test(
    'API-019 | cart API | isolates independent cart identifiers',
    {
      tag: [testTags.api, testTags.positive, testTags.critical],
    },
    async ({ cartRequest }) => {
      const firstCartHeaders = {
        'x-cart-id': 'api-cart-a',
      };

      const secondCartHeaders = {
        'x-cart-id': 'api-cart-b',
      };

      await cartRequest.delete('/api/cart', {
        headers: firstCartHeaders,
      });

      await cartRequest.delete('/api/cart', {
        headers: secondCartHeaders,
      });

      await cartRequest.post('/api/cart/items', {
        headers: firstCartHeaders,
        data: {
          productId: 'PROD-002',
          quantity: 1,
        },
      });

      await cartRequest.post('/api/cart/items', {
        headers: secondCartHeaders,
        data: {
          productId: 'PROD-003',
          quantity: 2,
        },
      });

      const firstCartResponse = await cartRequest.get('/api/cart', {
        headers: firstCartHeaders,
      });

      const secondCartResponse = await cartRequest.get('/api/cart', {
        headers: secondCartHeaders,
      });

      expect(await firstCartResponse.json()).toEqual({
        items: [
          {
            product: expect.objectContaining({
              id: 'PROD-002',
            }),
            quantity: 1,
          },
        ],
        totalInCents: 3999,
      });

      expect(await secondCartResponse.json()).toEqual({
        items: [
          {
            product: expect.objectContaining({
              id: 'PROD-003',
            }),
            quantity: 2,
          },
        ],
        totalInCents: 15998,
      });

      await cartRequest.delete('/api/cart', {
        headers: firstCartHeaders,
      });

      const secondCartAfterClear = await cartRequest.get('/api/cart', {
        headers: secondCartHeaders,
      });

      expect(await secondCartAfterClear.json()).toEqual({
        items: [
          {
            product: expect.objectContaining({
              id: 'PROD-003',
            }),
            quantity: 2,
          },
        ],
        totalInCents: 15998,
      });

      await cartRequest.delete('/api/cart', {
        headers: secondCartHeaders,
      });
    },
  );
});
