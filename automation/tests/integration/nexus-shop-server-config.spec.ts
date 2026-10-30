import { expect, test } from '@playwright/test';

import { serverConfig } from '../../../apps/nexus-shop/src/config/server.config';
import { testTags } from '../../config/test-tags';

test.describe('NexusShop server configuration', () => {
  test(
    'CFG-011 | server configuration | exposes a valid local port',
    {
      tag: [testTags.integration],
    },
    async () => {
      expect(serverConfig.port).toBeGreaterThan(0);
      expect(serverConfig.port).toBeLessThanOrEqual(65535);
    },
  );

  test(
    'CFG-012 | server configuration | exposes a configured host',
    {
      tag: [testTags.integration],
    },
    async () => {
      expect(serverConfig.host).toBeTruthy();
    },
  );
});
