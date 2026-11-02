import type { Customer } from '../models/customer.model';

/*
 * NexusShop uses deterministic synthetic customers for authentication tests.
 *
 * These records contain no production, client, or personal user information.
 * Deterministic credentials keep authentication scenarios repeatable across
 * local development and CI execution.
 */
export const customers: readonly Customer[] = [
  {
    id: 'CUST-001',
    firstName: 'Demo',
    lastName: 'Customer',
    email: 'demo.customer@example.test',
    password: 'NexusShop123!',
    isActive: true,
  },
  {
    id: 'CUST-002',
    firstName: 'Inactive',
    lastName: 'Customer',
    email: 'inactive.customer@example.test',
    password: 'NexusShop123!',
    isActive: false,
  },
];
