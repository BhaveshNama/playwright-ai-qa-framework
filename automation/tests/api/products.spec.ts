import { expect, test } from '@playwright/test';

import type { Product } from '../../../apps/nexus-shop/src/models/product.model';
import { testTags } from '../../config/test-tags';

test.describe('NexusShop products API', () => {
  test(
    'API-003 | products API | returns the complete product catalogue',
    {
      tag: [testTags.api, testTags.smoke, testTags.positive],
    },
    async ({ request }) => {
      const response = await request.get('/api/products');

      await expect(response).toBeOK();

      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('application/json');

      const products = (await response.json()) as Product[];

      expect(products).toHaveLength(5);

      expect(products).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'PROD-001',
            name: 'Nexus Laptop',
            priceInCents: 129999,
            isAvailable: true,
          }),
          expect.objectContaining({
            id: 'PROD-005',
            name: 'Playwright Backpack',
            priceInCents: 4999,
            isAvailable: false,
          }),
        ]),
      );
    },
  );

  test(
    'API-004 | products API | returns a product by identifier',
    {
      tag: [testTags.api, testTags.positive],
    },
    async ({ request }) => {
      const response = await request.get('/api/products/PROD-002');

      await expect(response).toBeOK();

      expect(response.status()).toBe(200);

      const product = (await response.json()) as Product;

      expect(product).toEqual({
        id: 'PROD-002',
        name: 'QA Wireless Mouse',
        description: 'Wireless mouse designed for everyday productivity.',
        priceInCents: 3999,
        category: 'Accessories',
        isAvailable: true,
      });
    },
  );

  test(
    'API-005 | products API | returns not found for an unknown product',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ request }) => {
      const response = await request.get('/api/products/PROD-999');

      expect(response.status()).toBe(404);
      expect(response.ok()).toBe(false);

      expect(await response.json()).toEqual({
        error: 'Product not found',
      });
    },
  );
});
