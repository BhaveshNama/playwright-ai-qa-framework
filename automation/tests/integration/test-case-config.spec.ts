import { expect, test } from '@playwright/test';

import { createTestCaseId, testAreas } from '../../config/test-case.config';
import { testTags } from '../../config/test-tags';

test.describe('AgenticQA Nexus test-case configuration', () => {
  test(
    'CFG-003 | test identifiers | creates a normalized test identifier',
    {
      tag: [testTags.integration],
    },
    async () => {
      const testCaseId = createTestCaseId(testAreas.authentication, 1);

      expect(testCaseId).toBe('AUTH-001');
    },
  );

  test(
    'CFG-004 | test identifiers | rejects a non-positive sequence',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      expect(() => createTestCaseId(testAreas.checkout, 0)).toThrow(
        'Test-case sequence must be a positive integer.',
      );
    },
  );
});
