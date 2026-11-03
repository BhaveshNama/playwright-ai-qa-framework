import { expect, test } from '@playwright/test';

import type { CheckoutSummary } from '../../../apps/nexus-shop/src/models/checkout.model';
import { orderService } from '../../../apps/nexus-shop/src/services/order.service';
import { productService } from '../../../apps/nexus-shop/src/services/product.service';
import { testTags } from '../../config/test-tags';

const shippingAddress = {
  fullName: 'Demo Customer',
  addressLine1: '101 Automation Avenue',
  city: 'Pune',
  state: 'Maharashtra',
  postalCode: '411001',
  country: 'India',
};

function createCheckoutSummary(): CheckoutSummary {
  const product = productService.getById('PROD-002');

  if (!product) {
    throw new Error('Expected PROD-002 to exist');
  }

  return {
    items: [
      {
        product,
        quantity: 2,
      },
    ],
    totalInCents: 7998,
    shippingAddress,
  };
}

test.describe('NexusShop order service', () => {
  test(
    'CFG-035 | order service | creates a confirmed order',
    {
      tag: [testTags.integration, testTags.positive, testTags.critical],
    },
    async () => {
      const sessionId = 'order-create-session';

      orderService.clear(sessionId);

      const order = orderService.createOrder(sessionId, createCheckoutSummary());

      expect(order).toEqual({
        id: 'ORD-REATESESSION-0001',
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
        shippingAddress,
        status: 'CONFIRMED',
        createdAt: expect.any(String),
      });

      expect(Number.isNaN(Date.parse(order.createdAt))).toBe(false);

      orderService.clear(sessionId);
    },
  );

  test(
    'CFG-036 | order service | increments the order sequence',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const sessionId = 'order-sequence-session';

      orderService.clear(sessionId);

      const firstOrder = orderService.createOrder(sessionId, createCheckoutSummary());

      const secondOrder = orderService.createOrder(sessionId, createCheckoutSummary());

      expect(firstOrder.id).toBe('ORD-UENCESESSION-0001');

      expect(secondOrder.id).toBe('ORD-UENCESESSION-0002');

      orderService.clear(sessionId);
    },
  );

  test(
    'CFG-037 | order service | retrieves an order by identifier',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const sessionId = 'order-retrieval-session';

      orderService.clear(sessionId);

      const createdOrder = orderService.createOrder(sessionId, createCheckoutSummary());

      const retrievedOrder = orderService.getOrder(sessionId, createdOrder.id);

      expect(retrievedOrder).toEqual(createdOrder);

      orderService.clear(sessionId);
    },
  );

  test(
    'CFG-038 | order service | protects stored order snapshots',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const sessionId = 'order-snapshot-session';

      orderService.clear(sessionId);

      const createdOrder = orderService.createOrder(sessionId, createCheckoutSummary());

      createdOrder.items[0].quantity = 99;
      createdOrder.shippingAddress.city = 'Changed City';

      const storedOrder = orderService.getOrder(sessionId, createdOrder.id);

      expect(storedOrder?.items[0].quantity).toBe(2);

      expect(storedOrder?.shippingAddress.city).toBe('Pune');

      orderService.clear(sessionId);
    },
  );

  test(
    'CFG-039 | order service | keeps orders isolated between sessions',
    {
      tag: [testTags.integration, testTags.positive, testTags.critical],
    },
    async () => {
      const firstSessionId = 'order-session-a';
      const secondSessionId = 'order-session-b';

      orderService.clear(firstSessionId);
      orderService.clear(secondSessionId);

      const firstOrder = orderService.createOrder(firstSessionId, createCheckoutSummary());

      expect(orderService.getOrders(firstSessionId)).toHaveLength(1);

      expect(orderService.getOrders(secondSessionId)).toEqual([]);

      expect(orderService.getOrder(secondSessionId, firstOrder.id)).toBeUndefined();

      orderService.clear(firstSessionId);
      orderService.clear(secondSessionId);
    },
  );

  test(
    'CFG-040 | order lifecycle | transitions confirmed order to processing',
    {
      tag: [testTags.integration, testTags.positive, testTags.critical],
    },
    async () => {
      const sessionId = 'order-processing-session';

      orderService.clear(sessionId);

      const order = orderService.createOrder(sessionId, createCheckoutSummary());

      const updatedOrder = orderService.updateStatus(sessionId, order.id, 'PROCESSING');

      expect(updatedOrder?.status).toBe('PROCESSING');

      expect(orderService.getOrder(sessionId, order.id)?.status).toBe('PROCESSING');

      orderService.clear(sessionId);
    },
  );

  test(
    'CFG-041 | order lifecycle | transitions processing order to shipped',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const sessionId = 'order-shipped-session';

      orderService.clear(sessionId);

      const order = orderService.createOrder(sessionId, createCheckoutSummary());

      orderService.updateStatus(sessionId, order.id, 'PROCESSING');

      const updatedOrder = orderService.updateStatus(sessionId, order.id, 'SHIPPED');

      expect(updatedOrder?.status).toBe('SHIPPED');

      orderService.clear(sessionId);
    },
  );

  test(
    'CFG-042 | order lifecycle | transitions shipped order to delivered',
    {
      tag: [testTags.integration, testTags.positive, testTags.critical],
    },
    async () => {
      const sessionId = 'order-delivered-session';

      orderService.clear(sessionId);

      const order = orderService.createOrder(sessionId, createCheckoutSummary());

      orderService.updateStatus(sessionId, order.id, 'PROCESSING');

      orderService.updateStatus(sessionId, order.id, 'SHIPPED');

      const deliveredOrder = orderService.updateStatus(sessionId, order.id, 'DELIVERED');

      expect(deliveredOrder?.status).toBe('DELIVERED');

      orderService.clear(sessionId);
    },
  );

  test(
    'CFG-043 | order lifecycle | cancels a confirmed order',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const sessionId = 'order-cancel-session';

      orderService.clear(sessionId);

      const order = orderService.createOrder(sessionId, createCheckoutSummary());

      const cancelledOrder = orderService.updateStatus(sessionId, order.id, 'CANCELLED');

      expect(cancelledOrder?.status).toBe('CANCELLED');

      orderService.clear(sessionId);
    },
  );

  test(
    'CFG-044 | order lifecycle | rejects an invalid backwards transition',
    {
      tag: [testTags.integration, testTags.negative, testTags.critical],
    },
    async () => {
      const sessionId = 'order-invalid-session';

      orderService.clear(sessionId);

      const order = orderService.createOrder(sessionId, createCheckoutSummary());

      orderService.updateStatus(sessionId, order.id, 'PROCESSING');

      expect(() => orderService.updateStatus(sessionId, order.id, 'CONFIRMED')).toThrow(
        'Invalid order status transition: PROCESSING -> CONFIRMED',
      );

      expect(orderService.getOrder(sessionId, order.id)?.status).toBe('PROCESSING');

      orderService.clear(sessionId);
    },
  );

  test(
    'CFG-045 | order lifecycle | treats delivered orders as terminal',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const sessionId = 'order-terminal-delivered-session';

      orderService.clear(sessionId);

      const order = orderService.createOrder(sessionId, createCheckoutSummary());

      orderService.updateStatus(sessionId, order.id, 'PROCESSING');

      orderService.updateStatus(sessionId, order.id, 'SHIPPED');

      orderService.updateStatus(sessionId, order.id, 'DELIVERED');

      expect(() => orderService.updateStatus(sessionId, order.id, 'PROCESSING')).toThrow(
        'Invalid order status transition: DELIVERED -> PROCESSING',
      );

      orderService.clear(sessionId);
    },
  );

  test(
    'CFG-046 | order lifecycle | treats cancelled orders as terminal',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const sessionId = 'order-terminal-cancelled-session';

      orderService.clear(sessionId);

      const order = orderService.createOrder(sessionId, createCheckoutSummary());

      orderService.updateStatus(sessionId, order.id, 'CANCELLED');

      expect(() => orderService.updateStatus(sessionId, order.id, 'PROCESSING')).toThrow(
        'Invalid order status transition: CANCELLED -> PROCESSING',
      );

      orderService.clear(sessionId);
    },
  );

  test(
    'CFG-047 | order lifecycle | prevents status updates across sessions',
    {
      tag: [testTags.integration, testTags.negative, testTags.critical],
    },
    async () => {
      const ownerSessionId = 'order-owner-session';

      const otherSessionId = 'order-other-session';

      orderService.clear(ownerSessionId);
      orderService.clear(otherSessionId);

      const order = orderService.createOrder(ownerSessionId, createCheckoutSummary());

      const result = orderService.updateStatus(otherSessionId, order.id, 'PROCESSING');

      expect(result).toBeUndefined();

      expect(orderService.getOrder(ownerSessionId, order.id)?.status).toBe('CONFIRMED');

      orderService.clear(ownerSessionId);
      orderService.clear(otherSessionId);
    },
  );
});
