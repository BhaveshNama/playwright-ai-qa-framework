import { expect, test } from '@playwright/test';

import { createAiProvider } from '../../intelligence/ai/ai-provider.factory';
import { disabledAiProvider } from '../../intelligence/ai/providers/disabled-ai.provider';
import type { QaOrchestrationResult } from '../../intelligence/models/qa-orchestration.model';
import { testTags } from '../../config/test-tags';

function createOrchestrationResult(): QaOrchestrationResult {
  return {
    testId: 'synthetic-test-id',
    testTitle: 'CART-003 | cart | removes a product from the cart',
    project: 'firefox',

    decision: 'INVESTIGATE_BROWSER_SPECIFIC',
    priority: 'high',
    confidence: 'low',

    summary: 'Synthetic browser-specific orchestration result.',

    rationale: [
      'Failure layer: ui',
      'Failure category: assertion',
      'Historical classification: INTERMITTENT',
      'Cross-browser classification: BROWSER_SPECIFIC_INTERMITTENT',
    ],

    recommendedActions: [
      'Inspect browser-specific timing and event handling.',
      'Compare the failure against stable browser executions.',
      'Review captured diagnostic evidence.',
    ],

    signals: {
      failureCategory: 'assertion',
      failureLayer: 'ui',
      historicalClassification: 'INTERMITTENT',
      crossBrowserClassification: 'BROWSER_SPECIFIC_INTERMITTENT',
    },

    guardrails: {
      autonomousCodeModificationAllowed: false,
      autonomousRetryConfigurationAllowed: false,
      autonomousTimeoutModificationAllowed: false,
      humanApprovalRequired: true,
    },

    requiresHumanReview: true,
  };
}

test.describe('AgenticQA AI provider', () => {
  test(
    'CFG-065 | AI provider | defaults an undefined provider to disabled',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const provider = createAiProvider(undefined);

      expect(provider.name).toBe('disabled');
      expect(provider.enabled).toBe(false);
    },
  );

  test(
    'CFG-066 | AI provider | resolves the disabled provider explicitly',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const provider = createAiProvider('disabled');

      expect(provider).toBe(disabledAiProvider);

      expect(provider.name).toBe('disabled');
      expect(provider.enabled).toBe(false);
    },
  );

  test(
    'CFG-067 | AI provider | preserves deterministic recommendations while disabled',
    {
      tag: [testTags.integration, testTags.critical],
    },
    async () => {
      const orchestration = createOrchestrationResult();

      const response = await disabledAiProvider.analyze({
        orchestration,
        evidence: [
          'Firefox intermittent execution',
          'Chromium stable execution',
          'WebKit stable execution',
        ],
      });

      expect(response.provider).toBe('disabled');

      expect(response.enabled).toBe(false);

      expect(response.summary).toContain('AI analysis is disabled');

      expect(response.hypotheses).toEqual([]);

      expect(response.recommendedInvestigations).toEqual(orchestration.recommendedActions);

      expect(response.confidence).toBe(orchestration.confidence);
    },
  );

  test(
    'CFG-068 | AI provider | requires human review while AI analysis is disabled',
    {
      tag: [testTags.integration, testTags.critical],
    },
    async () => {
      const response = await disabledAiProvider.analyze({
        orchestration: createOrchestrationResult(),
        evidence: [],
      });

      expect(response.requiresHumanReview).toBe(true);
    },
  );

  test(
    'CFG-069 | AI provider | rejects an unsupported provider',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      expect(() => createAiProvider('unsupported-provider')).toThrow(
        'Unsupported AI provider: unsupported-provider',
      );
    },
  );

  test(
    'CFG-070 | AI provider | rejects OpenAI until implementation exists',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      expect(() => createAiProvider('openai')).toThrow('OpenAI provider is not implemented yet.');
    },
  );

  test(
    'CFG-071 | AI provider | rejects Azure OpenAI until implementation exists',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      expect(() => createAiProvider('azure-openai')).toThrow(
        'Azure OpenAI provider is not implemented yet.',
      );
    },
  );

  test(
    'CFG-072 | AI provider | rejects Anthropic until implementation exists',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      expect(() => createAiProvider('anthropic')).toThrow(
        'Anthropic provider is not implemented yet.',
      );
    },
  );
});
