import { expect, test } from '@playwright/test';

import { routes } from '../../config/routes';
import { testTags } from '../../config/test-tags';

test.describe('NexusShop application routes', () => {
  test(
    'CFG-009 | routes | exposes relative application paths',
    {
      tag: [testTags.integration],
    },
    async () => {
      for (const route of Object.values(routes)) {
        expect(route).toMatch(/^\//);
        expect(route).not.toMatch(/^https?:\/\//);
      }
    },
  );

  test(
    'CFG-010 | routes | keeps application routes unique',
    {
      tag: [testTags.integration],
    },
    async () => {
      const applicationRoutes = Object.values(routes);

      expect(new Set(applicationRoutes).size).toBe(applicationRoutes.length);
    },
  );
});
