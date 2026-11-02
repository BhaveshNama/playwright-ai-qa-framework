import { expect, test } from '@playwright/test';

import { authenticationService } from '../../../apps/nexus-shop/src/services/authentication.service';
import { testTags } from '../../config/test-tags';

test.describe('NexusShop authentication service', () => {
  test(
    'CFG-017 | authentication service | authenticates an active customer',
    {
      tag: [testTags.integration, testTags.positive, testTags.critical],
    },
    async () => {
      const result = authenticationService.authenticate(
        'demo.customer@example.test',
        'NexusShop123!',
      );

      expect(result).toEqual({
        success: true,
        customer: {
          id: 'CUST-001',
          firstName: 'Demo',
          lastName: 'Customer',
          email: 'demo.customer@example.test',
          isActive: true,
        },
      });

      expect(result).not.toHaveProperty('customer.password');
    },
  );

  test(
    'CFG-018 | authentication service | rejects invalid credentials',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const result = authenticationService.authenticate(
        'demo.customer@example.test',
        'WrongPassword123!',
      );

      expect(result).toEqual({
        success: false,
        reason: 'INVALID_CREDENTIALS',
      });
    },
  );

  test(
    'CFG-019 | authentication service | rejects an inactive customer',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const result = authenticationService.authenticate(
        'inactive.customer@example.test',
        'NexusShop123!',
      );

      expect(result).toEqual({
        success: false,
        reason: 'INACTIVE_ACCOUNT',
      });
    },
  );

  test(
    'CFG-020 | authentication service | rejects an unknown customer',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const result = authenticationService.authenticate(
        'unknown.customer@example.test',
        'NexusShop123!',
      );

      expect(result).toEqual({
        success: false,
        reason: 'INVALID_CREDENTIALS',
      });
    },
  );
});
