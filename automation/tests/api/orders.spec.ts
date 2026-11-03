import { expect, test } from '../../fixtures/cart-api.fixture';

import { testTags } from '../../config/test-tags';

const shippingAddress = {
  fullName: 'Demo Customer',
  addressLine1: '101 Automation Avenue',
  city: 'Pune',
  state: 'Maharashtra',
  postalCode: '411001',
  country: 'India',
};

test.describe('NexusShop orders API', () => {
  test(
    'API-024 | orders API | creates a confirmed order',
    {
      tag: [testTags.api, testTags.smoke, testTags.critical, testTags.positive],
    },
    async ({ cartRequest }) => {
      const cartResponse = await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-002',
          quantity: 1,
        },
      });

      await expect(cartResponse).toBeOK();

      const response = await cartRequest.post('/api/orders', {
        data: shippingAddress,
      });

      expect(response.status()).toBe(201);

      const order = await response.json();

      expect(order).toEqual({
        id: expect.stringMatching(/^ORD-[A-Z0-9]+-0001$/),
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
        shippingAddress,
        status: 'CONFIRMED',
        createdAt: expect.any(String),
      });

      expect(Number.isNaN(Date.parse(order.createdAt))).toBe(false);
    },
  );

  test(
    'API-025 | orders API | lists orders for the current session',
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

      const createResponse = await cartRequest.post('/api/orders', {
        data: shippingAddress,
      });

      expect(createResponse.status()).toBe(201);

      const createdOrder = await createResponse.json();

      const response = await cartRequest.get('/api/orders');

      await expect(response).toBeOK();

      const orders = await response.json();

      expect(orders).toHaveLength(1);

      expect(orders[0]).toEqual(createdOrder);
    },
  );

  test(
    'API-026 | orders API | retrieves an order by identifier',
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

      const createResponse = await cartRequest.post('/api/orders', {
        data: shippingAddress,
      });

      expect(createResponse.status()).toBe(201);

      const createdOrder = await createResponse.json();

      const response = await cartRequest.get(`/api/orders/${createdOrder.id}`);

      await expect(response).toBeOK();

      expect(await response.json()).toEqual(createdOrder);
    },
  );

  test(
    'API-027 | orders API | returns not found for an unknown order',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ cartRequest }) => {
      const response = await cartRequest.get('/api/orders/ORD-UNKNOWN-9999');

      expect(response.status()).toBe(404);

      expect(await response.json()).toEqual({
        error: 'Order not found',
      });
    },
  );

  test(
    'API-028 | orders API | rejects order creation from an empty cart',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ cartRequest }) => {
      const response = await cartRequest.post('/api/orders', {
        data: shippingAddress,
      });

      expect(response.status()).toBe(409);

      expect(await response.json()).toEqual({
        error: 'Cannot create an order from an empty cart',
      });
    },
  );

  test(
    'API-029 | orders API | preserves the exact cart total',
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

      const response = await cartRequest.post('/api/orders', {
        data: shippingAddress,
      });

      expect(response.status()).toBe(201);

      const order = await response.json();

      expect(order.totalInCents).toBe(15997);

      expect(order.items).toEqual(
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
    },
  );

  test(
    'API-030 | orders API | isolates orders between cart sessions',
    {
      tag: [testTags.api, testTags.positive, testTags.critical],
    },
    async ({ cartRequest, playwright, baseURL }) => {
      await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-002',
          quantity: 1,
        },
      });

      const createResponse = await cartRequest.post('/api/orders', {
        data: shippingAddress,
      });

      expect(createResponse.status()).toBe(201);

      const isolatedRequest = await playwright.request.newContext({
        baseURL,
        extraHTTPHeaders: {
          'x-cart-id': 'api-orders-isolated-session',
        },
      });

      try {
        const response = await isolatedRequest.get('/api/orders');

        await expect(response).toBeOK();

        expect(await response.json()).toEqual([]);
      } finally {
        await isolatedRequest.dispose();
      }
    },
  );

  test(
    'API-031 | orders API | transitions a confirmed order to processing',
    {
      tag: [testTags.api, testTags.positive, testTags.critical],
    },
    async ({ cartRequest }) => {
      await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-002',
          quantity: 1,
        },
      });

      const createResponse = await cartRequest.post('/api/orders', {
        data: shippingAddress,
      });

      expect(createResponse.status()).toBe(201);

      const order = await createResponse.json();

      const response = await cartRequest.patch(`/api/orders/${order.id}/status`, {
        data: {
          status: 'PROCESSING',
        },
      });

      expect(response.status()).toBe(200);

      expect(await response.json()).toEqual(
        expect.objectContaining({
          id: order.id,
          status: 'PROCESSING',
        }),
      );
    },
  );

  test(
    'API-032 | orders API | completes the order lifecycle',
    {
      tag: [testTags.api, testTags.positive, testTags.critical],
    },
    async ({ cartRequest }) => {
      await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-002',
          quantity: 1,
        },
      });

      const createResponse = await cartRequest.post('/api/orders', {
        data: shippingAddress,
      });

      expect(createResponse.status()).toBe(201);

      const order = await createResponse.json();

      for (const status of ['PROCESSING', 'SHIPPED', 'DELIVERED']) {
        const response = await cartRequest.patch(`/api/orders/${order.id}/status`, {
          data: {
            status,
          },
        });

        expect(response.status()).toBe(200);

        expect((await response.json()).status).toBe(status);
      }

      const finalResponse = await cartRequest.get(`/api/orders/${order.id}`);

      await expect(finalResponse).toBeOK();

      expect((await finalResponse.json()).status).toBe('DELIVERED');
    },
  );

  test(
    'API-033 | orders API | cancels a confirmed order',
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

      const createResponse = await cartRequest.post('/api/orders', {
        data: shippingAddress,
      });

      const order = await createResponse.json();

      const response = await cartRequest.patch(`/api/orders/${order.id}/status`, {
        data: {
          status: 'CANCELLED',
        },
      });

      expect(response.status()).toBe(200);

      expect((await response.json()).status).toBe('CANCELLED');
    },
  );

  test(
    'API-034 | orders API | rejects an unsupported order status',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ cartRequest }) => {
      const response = await cartRequest.patch('/api/orders/ORD-UNKNOWN-0001/status', {
        data: {
          status: 'RETURNED',
        },
      });

      expect(response.status()).toBe(400);

      expect(await response.json()).toEqual({
        error: 'A valid order status is required',
      });
    },
  );

  test(
    'API-035 | orders API | returns not found when updating an unknown order',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ cartRequest }) => {
      const response = await cartRequest.patch('/api/orders/ORD-UNKNOWN-0001/status', {
        data: {
          status: 'PROCESSING',
        },
      });

      expect(response.status()).toBe(404);

      expect(await response.json()).toEqual({
        error: 'Order not found',
      });
    },
  );

  test(
    'API-036 | orders API | rejects an invalid backwards lifecycle transition',
    {
      tag: [testTags.api, testTags.negative, testTags.critical],
    },
    async ({ cartRequest }) => {
      await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-002',
          quantity: 1,
        },
      });

      const createResponse = await cartRequest.post('/api/orders', {
        data: shippingAddress,
      });

      const order = await createResponse.json();

      await cartRequest.patch(`/api/orders/${order.id}/status`, {
        data: {
          status: 'PROCESSING',
        },
      });

      const response = await cartRequest.patch(`/api/orders/${order.id}/status`, {
        data: {
          status: 'CONFIRMED',
        },
      });

      expect(response.status()).toBe(409);

      expect(await response.json()).toEqual({
        error: 'Invalid order status transition: PROCESSING -> CONFIRMED',
      });
    },
  );

  test(
    'API-037 | orders API | protects the delivered terminal state',
    {
      tag: [testTags.api, testTags.negative, testTags.critical],
    },
    async ({ cartRequest }) => {
      await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-002',
          quantity: 1,
        },
      });

      const createResponse = await cartRequest.post('/api/orders', {
        data: shippingAddress,
      });

      const order = await createResponse.json();

      for (const status of ['PROCESSING', 'SHIPPED', 'DELIVERED']) {
        const response = await cartRequest.patch(`/api/orders/${order.id}/status`, {
          data: {
            status,
          },
        });

        expect(response.status()).toBe(200);
      }

      const response = await cartRequest.patch(`/api/orders/${order.id}/status`, {
        data: {
          status: 'PROCESSING',
        },
      });

      expect(response.status()).toBe(409);

      expect(await response.json()).toEqual({
        error: 'Invalid order status transition: DELIVERED -> PROCESSING',
      });
    },
  );

  test(
    'API-038 | orders API | prevents lifecycle updates across sessions',
    {
      tag: [testTags.api, testTags.negative, testTags.critical],
    },
    async ({ cartRequest, playwright, baseURL }) => {
      await cartRequest.post('/api/cart/items', {
        data: {
          productId: 'PROD-002',
          quantity: 1,
        },
      });

      const createResponse = await cartRequest.post('/api/orders', {
        data: shippingAddress,
      });

      const order = await createResponse.json();

      const isolatedRequest = await playwright.request.newContext({
        baseURL,
        extraHTTPHeaders: {
          'x-cart-id': 'api-order-lifecycle-isolated',
        },
      });

      try {
        const response = await isolatedRequest.patch(`/api/orders/${order.id}/status`, {
          data: {
            status: 'PROCESSING',
          },
        });

        expect(response.status()).toBe(404);

        expect(await response.json()).toEqual({
          error: 'Order not found',
        });
      } finally {
        await isolatedRequest.dispose();
      }

      const ownerResponse = await cartRequest.get(`/api/orders/${order.id}`);

      expect((await ownerResponse.json()).status).toBe('CONFIRMED');
    },
  );
});
