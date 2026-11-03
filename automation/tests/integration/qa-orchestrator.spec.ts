import { expect, test } from '@playwright/test';

import { testTags } from '../../config/test-tags';
import type { FailureAnalysis } from '../../intelligence/models/failure-analysis.model';
import type {
  CrossBrowserFlakinessAnalysis,
  FlakyTestAnalysis,
} from '../../intelligence/models/flaky-test-analysis.model';
import { qaOrchestrator } from '../../intelligence/orchestrators/qa.orchestrator';

function createFailureAnalysis(overrides: Partial<FailureAnalysis> = {}): FailureAnalysis {
  return {
    testId: 'synthetic-test-id',
    testTitle: 'CART-003 | cart | removes a product from the cart',
    layer: 'ui',
    category: 'assertion',
    confidence: 'high',
    summary: 'Synthetic failure analysis for orchestrator testing.',
    probableCause: 'The observed UI state did not reach the expected condition.',
    recommendations: ['Inspect the captured execution evidence.'],
    evidence: ['Project: firefox', 'Expected: 0', 'Received: 1'],
    requiresHumanReview: true,
    ...overrides,
  };
}

function createHistoricalAnalysis(overrides: Partial<FlakyTestAnalysis> = {}): FlakyTestAnalysis {
  return {
    testId: 'synthetic-test-id',
    testTitle: 'CART-003 | cart | removes a product from the cart',
    project: 'firefox',
    classification: 'INTERMITTENT',
    confidence: 'low',
    totalExecutions: 3,
    passedExecutions: 2,
    failedExecutions: 1,
    failureRate: 1 / 3,
    averageDurationMs: 8_948,
    recommendation: 'Investigate timing and browser-specific behavior.',
    requiresHumanReview: true,
    ...overrides,
  };
}

function createCrossBrowserAnalysis(
  overrides: Partial<CrossBrowserFlakinessAnalysis> = {},
): CrossBrowserFlakinessAnalysis {
  return {
    testTitle: 'CART-003 | cart | removes a product from the cart',
    classification: 'BROWSER_SPECIFIC_INTERMITTENT',
    affectedProjects: ['firefox'],
    stableProjects: ['chromium', 'webkit'],
    confidence: 'low',
    recommendation: 'Investigate browser-specific behavior.',
    requiresHumanReview: true,
    ...overrides,
  };
}

test.describe('AgenticQA QA orchestrator', () => {
  test(
    'CFG-057 | QA orchestrator | investigates browser-specific intermittency',
    {
      tag: [testTags.integration, testTags.critical],
    },
    async () => {
      const result = qaOrchestrator.orchestrate({
        failureAnalysis: createFailureAnalysis(),
        historicalAnalysis: createHistoricalAnalysis(),
        crossBrowserAnalysis: createCrossBrowserAnalysis(),
      });

      expect(result.decision).toBe('INVESTIGATE_BROWSER_SPECIFIC');

      expect(result.priority).toBe('high');
      expect(result.confidence).toBe('low');

      expect(result.signals.failureLayer).toBe('ui');

      expect(result.signals.failureCategory).toBe('assertion');

      expect(result.signals.historicalClassification).toBe('INTERMITTENT');

      expect(result.signals.crossBrowserClassification).toBe('BROWSER_SPECIFIC_INTERMITTENT');

      expect(result.requiresHumanReview).toBe(true);
    },
  );

  test(
    'CFG-058 | QA orchestrator | collects more evidence when history is insufficient',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const result = qaOrchestrator.orchestrate({
        failureAnalysis: createFailureAnalysis(),
        historicalAnalysis: createHistoricalAnalysis({
          classification: 'INSUFFICIENT_HISTORY',
          totalExecutions: 1,
          passedExecutions: 0,
          failedExecutions: 1,
          failureRate: 1,
        }),
      });

      expect(result.decision).toBe('COLLECT_MORE_EVIDENCE');

      expect(result.priority).toBe('low');
      expect(result.confidence).toBe('low');

      expect(result.requiresHumanReview).toBe(true);
    },
  );

  test(
    'CFG-059 | QA orchestrator | investigates intermittent automation behavior',
    {
      tag: [testTags.integration, testTags.critical],
    },
    async () => {
      const result = qaOrchestrator.orchestrate({
        failureAnalysis: createFailureAnalysis(),
        historicalAnalysis: createHistoricalAnalysis({
          classification: 'INTERMITTENT',
        }),
      });

      expect(result.decision).toBe('INVESTIGATE_AUTOMATION');

      expect(result.priority).toBe('medium');
      expect(result.confidence).toBe('low');

      expect(result.requiresHumanReview).toBe(true);
    },
  );

  test(
    'CFG-060 | QA orchestrator | investigates consistently failing API behavior as a product issue',
    {
      tag: [testTags.integration, testTags.negative, testTags.critical],
    },
    async () => {
      const result = qaOrchestrator.orchestrate({
        failureAnalysis: createFailureAnalysis({
          testTitle: 'API-999 | orders API | synthetic deterministic failure',
          layer: 'api',
          category: 'assertion',
        }),
        historicalAnalysis: createHistoricalAnalysis({
          testTitle: 'API-999 | orders API | synthetic deterministic failure',
          project: 'api',
          classification: 'CONSISTENTLY_FAILING',
          confidence: 'medium',
          totalExecutions: 5,
          passedExecutions: 0,
          failedExecutions: 5,
          failureRate: 1,
        }),
      });

      expect(result.decision).toBe('INVESTIGATE_PRODUCT');

      expect(result.priority).toBe('critical');
      expect(result.confidence).toBe('medium');

      expect(result.requiresHumanReview).toBe(true);
    },
  );

  test(
    'CFG-061 | QA orchestrator | requires human review for consistently failing UI behavior',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const result = qaOrchestrator.orchestrate({
        failureAnalysis: createFailureAnalysis({
          layer: 'ui',
        }),
        historicalAnalysis: createHistoricalAnalysis({
          classification: 'CONSISTENTLY_FAILING',
          passedExecutions: 0,
          failedExecutions: 3,
          failureRate: 1,
        }),
      });

      expect(result.decision).toBe('HUMAN_REVIEW');

      expect(result.priority).toBe('high');

      expect(result.requiresHumanReview).toBe(true);
    },
  );

  test(
    'CFG-062 | QA orchestrator | requires human review for unknown failures',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const result = qaOrchestrator.orchestrate({
        failureAnalysis: createFailureAnalysis({
          layer: 'unknown',
          category: 'unknown',
          confidence: 'low',
        }),
      });

      expect(result.decision).toBe('HUMAN_REVIEW');

      expect(result.priority).toBe('high');
      expect(result.confidence).toBe('low');

      expect(result.requiresHumanReview).toBe(true);
    },
  );

  test(
    'CFG-063 | QA orchestrator | monitors stable evidence without escalation',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const result = qaOrchestrator.orchestrate({
        failureAnalysis: createFailureAnalysis(),
        historicalAnalysis: createHistoricalAnalysis({
          classification: 'STABLE',
          confidence: 'medium',
          totalExecutions: 5,
          passedExecutions: 5,
          failedExecutions: 0,
          failureRate: 0,
          requiresHumanReview: false,
        }),
        crossBrowserAnalysis: createCrossBrowserAnalysis({
          classification: 'CROSS_BROWSER_STABLE',
          affectedProjects: [],
          stableProjects: ['chromium', 'firefox', 'webkit'],
          confidence: 'medium',
          requiresHumanReview: false,
        }),
      });

      expect(result.decision).toBe('MONITOR');

      expect(result.priority).toBe('low');
      expect(result.confidence).toBe('medium');

      expect(result.requiresHumanReview).toBe(false);

      expect(result.guardrails.humanApprovalRequired).toBe(false);
    },
  );

  test(
    'CFG-064 | QA orchestrator | enforces bounded autonomy guardrails',
    {
      tag: [testTags.integration, testTags.critical],
    },
    async () => {
      const result = qaOrchestrator.orchestrate({
        failureAnalysis: createFailureAnalysis(),
        historicalAnalysis: createHistoricalAnalysis(),
        crossBrowserAnalysis: createCrossBrowserAnalysis(),
      });

      expect(result.guardrails.autonomousCodeModificationAllowed).toBe(false);

      expect(result.guardrails.autonomousRetryConfigurationAllowed).toBe(false);

      expect(result.guardrails.autonomousTimeoutModificationAllowed).toBe(false);

      expect(result.guardrails.humanApprovalRequired).toBe(true);

      expect(result.requiresHumanReview).toBe(true);
    },
  );
});
