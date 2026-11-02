import { expect, test } from '@playwright/test';

import { testTags } from '../../config/test-tags';

test.describe('NexusShop authentication API', () => {
  test(
    'API-006 | authentication API | authenticates an active customer',
    {
      tag: [testTags.api, testTags.smoke, testTags.critical, testTags.positive],
    },
    async ({ request }) => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'demo.customer@example.test',
          password: 'NexusShop123!',
        },
      });

      await expect(response).toBeOK();
      expect(response.status()).toBe(200);

      const body = await response.json();

      expect(body).toEqual({
        customer: {
          id: 'CUST-001',
          firstName: 'Demo',
          lastName: 'Customer',
          email: 'demo.customer@example.test',
          isActive: true,
        },
      });

      expect(body).not.toHaveProperty('customer.password');
    },
  );

  test(
    'API-007 | authentication API | rejects invalid credentials',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ request }) => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'demo.customer@example.test',
          password: 'WrongPassword123!',
        },
      });

      expect(response.status()).toBe(401);

      expect(await response.json()).toEqual({
        error: 'Invalid email or password',
      });
    },
  );

  test(
    'API-008 | authentication API | rejects an inactive customer',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ request }) => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'inactive.customer@example.test',
          password: 'NexusShop123!',
        },
      });

      expect(response.status()).toBe(403);

      expect(await response.json()).toEqual({
        error: 'Account is inactive',
      });
    },
  );

  test(
    'API-009 | authentication API | requires an email address',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ request }) => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: '',
          password: 'NexusShop123!',
        },
      });

      expect(response.status()).toBe(400);

      expect(await response.json()).toEqual({
        error: 'Email and password are required',
      });
    },
  );

  test(
    'API-010 | authentication API | requires a password',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ request }) => {
      const response = await request.post('/api/auth/login', {
        data: {
          email: 'demo.customer@example.test',
          password: '',
        },
      });

      expect(response.status()).toBe(400);

      expect(await response.json()).toEqual({
        error: 'Email and password are required',
      });
    },
  );
});
