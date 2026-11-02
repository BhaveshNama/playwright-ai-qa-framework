import { expect, test } from '@playwright/test';

import { productService } from '../../../apps/nexus-shop/src/services/product.service';
import { testTags } from '../../config/test-tags';

test.describe('NexusShop product service', () => {
  test(
    'CFG-013 | product service | returns the seeded product catalogue',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const products = productService.getAll();

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
    'CFG-014 | product service | finds a product by identifier',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const product = productService.getById('PROD-002');

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
    'CFG-015 | product service | returns undefined for unknown identifier',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const product = productService.getById('PROD-999');

      expect(product).toBeUndefined();
    },
  );

  test(
    'CFG-016 | product service | returns a separate catalogue array',
    {
      tag: [testTags.integration],
    },
    async () => {
      const firstResult = productService.getAll();
      const secondResult = productService.getAll();

      expect(firstResult).not.toBe(secondResult);
      expect(firstResult).toEqual(secondResult);
    },
  );
});
