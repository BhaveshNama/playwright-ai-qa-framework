import { expect, test } from '@playwright/test';

import { environment } from '../../config/environment.config';

test.describe('AgenticQA Nexus environment configuration', () => {
  test(
    'CFG-001 | configuration | exposes validated application URLs',
    {
      tag: ['@integration', '@critical'],
    },
    async () => {
      /*
       * This test verifies the framework configuration boundary without
       * depending on the availability of an external web application.
       */
      expect(environment.web.baseUrl).toBeTruthy();
      expect(environment.api.baseUrl).toBeTruthy();

      expect(() => new URL(environment.web.baseUrl)).not.toThrow();
      expect(() => new URL(environment.api.baseUrl)).not.toThrow();
    },
  );

  test(
    'CFG-002 | configuration | exposes an approved execution environment',
    {
      tag: ['@integration'],
    },
    async () => {
      const supportedEnvironments = ['local', 'dev', 'qa'];

      expect(supportedEnvironments).toContain(environment.name);
    },
  );
});
