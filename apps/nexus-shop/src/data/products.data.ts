import type { Product } from '../models/product.model';

/*
 * Product data is deterministic because catalogue, cart, and checkout
 * scenarios need predictable product identifiers, prices, and availability.
 *
 * This data is synthetic and contains no production or client information.
 */
export const products: readonly Product[] = [
  {
    id: 'PROD-001',
    name: 'Nexus Laptop',
    description: 'Portable laptop for development and testing.',
    priceInCents: 129999,
    category: 'Computers',
    isAvailable: true,
  },
  {
    id: 'PROD-002',
    name: 'QA Wireless Mouse',
    description: 'Wireless mouse designed for everyday productivity.',
    priceInCents: 3999,
    category: 'Accessories',
    isAvailable: true,
  },
  {
    id: 'PROD-003',
    name: 'Automation Keyboard',
    description: 'Mechanical keyboard for development work.',
    priceInCents: 7999,
    category: 'Accessories',
    isAvailable: true,
  },
  {
    id: 'PROD-004',
    name: 'Test Engineer Headset',
    description: 'USB headset for meetings and test sessions.',
    priceInCents: 5999,
    category: 'Accessories',
    isAvailable: true,
  },
  {
    id: 'PROD-005',
    name: 'Playwright Backpack',
    description: 'Synthetic catalogue item used for automation scenarios.',
    priceInCents: 4999,
    category: 'Lifestyle',
    isAvailable: false,
  },
];
