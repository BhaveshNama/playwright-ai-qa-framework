import { expect, test } from '@playwright/test';

import type { HealthResponse } from '../../../apps/nexus-shop/src/models/health.model';
import { testTags } from '../../config/test-tags';

test.describe('NexusShop health API', () => {
  test(
    'API-001 | health API | returns healthy service status',
    {
      tag: [testTags.api, testTags.smoke, testTags.critical],
    },
    async ({ request }) => {
      const response = await request.get('/health');

      await expect(response).toBeOK();

      expect(response.status()).toBe(200);

      expect(response.headers()['content-type']).toContain('application/json');

      const body = (await response.json()) as HealthResponse;

      expect(body).toEqual({
        status: 'ok',
        service: 'nexus-shop',
      });
    },
  );

  test(
    'API-002 | health API | returns not found for an unknown route',
    {
      tag: [testTags.api, testTags.negative],
    },
    async ({ request }) => {
      const response = await request.get('/unknown-route');

      expect(response.status()).toBe(404);

      expect(response.ok()).toBe(false);
    },
  );
});
