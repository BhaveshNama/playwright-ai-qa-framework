import { expect, test } from '@playwright/test';

import { flakyTestDetectionAgent } from '../../intelligence/agents/flaky-test-detection.agent';
import type {
  HistoricalExecutionStatus,
  HistoricalTestExecution,
} from '../../intelligence/models/execution-history.model';
import type { FlakyTestAnalysis } from '../../intelligence/models/flaky-test-analysis.model';
import { testTags } from '../../config/test-tags';

function createExecution(
  sequence: number,
  project: string,
  status: HistoricalExecutionStatus,
): HistoricalTestExecution {
  return {
    runId: `run-${sequence}`,
    testId: `test-${project}`,
    title: 'Synthetic flaky-test scenario',
    project,
    status,
    durationMs: 1_000 + sequence,
    retry: 0,
    timestamp: new Date(Date.UTC(2026, 0, 1, 0, 0, sequence)).toISOString(),
  };
}

function createAnalysis(
  project: string,
  classification: 'INSUFFICIENT_HISTORY' | 'STABLE' | 'INTERMITTENT' | 'CONSISTENTLY_FAILING',
  confidence: 'high' | 'medium' | 'low' = 'low',
): FlakyTestAnalysis {
  return {
    testId: `test-${project}`,
    testTitle: 'Synthetic cross-browser scenario',
    project,
    classification,
    confidence,
    totalExecutions: 3,
    passedExecutions: classification === 'STABLE' ? 3 : classification === 'INTERMITTENT' ? 2 : 0,
    failedExecutions:
      classification === 'CONSISTENTLY_FAILING' ? 3 : classification === 'INTERMITTENT' ? 1 : 0,
    failureRate:
      classification === 'CONSISTENTLY_FAILING' ? 1 : classification === 'INTERMITTENT' ? 1 / 3 : 0,
    averageDurationMs: 1_000,
    recommendation: 'Synthetic recommendation',
    requiresHumanReview:
      classification === 'INTERMITTENT' || classification === 'CONSISTENTLY_FAILING',
  };
}

test.describe('AgenticQA flaky test detection', () => {
  test(
    'CFG-048 | flakiness intelligence | requires sufficient execution history',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const result = flakyTestDetectionAgent.analyze([
        createExecution(1, 'firefox', 'failed'),
        createExecution(2, 'firefox', 'passed'),
      ]);

      expect(result.classification).toBe('INSUFFICIENT_HISTORY');

      expect(result.confidence).toBe('low');
      expect(result.totalExecutions).toBe(2);
      expect(result.requiresHumanReview).toBe(false);
    },
  );

  test(
    'CFG-049 | flakiness intelligence | classifies repeated passes as stable',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const result = flakyTestDetectionAgent.analyze([
        createExecution(1, 'chromium', 'passed'),
        createExecution(2, 'chromium', 'passed'),
        createExecution(3, 'chromium', 'passed'),
      ]);

      expect(result.classification).toBe('STABLE');

      expect(result.passedExecutions).toBe(3);
      expect(result.failedExecutions).toBe(0);
      expect(result.failureRate).toBe(0);
    },
  );

  test(
    'CFG-050 | flakiness intelligence | detects intermittent outcomes',
    {
      tag: [testTags.integration, testTags.critical],
    },
    async () => {
      const result = flakyTestDetectionAgent.analyze([
        createExecution(1, 'firefox', 'failed'),
        createExecution(2, 'firefox', 'passed'),
        createExecution(3, 'firefox', 'passed'),
      ]);

      expect(result.classification).toBe('INTERMITTENT');

      expect(result.passedExecutions).toBe(2);
      expect(result.failedExecutions).toBe(1);

      expect(result.failureRate).toBeCloseTo(1 / 3);

      expect(result.requiresHumanReview).toBe(true);
    },
  );

  test(
    'CFG-051 | flakiness intelligence | detects consistently failing tests',
    {
      tag: [testTags.integration, testTags.negative, testTags.critical],
    },
    async () => {
      const result = flakyTestDetectionAgent.analyze([
        createExecution(1, 'firefox', 'failed'),
        createExecution(2, 'firefox', 'timedOut'),
        createExecution(3, 'firefox', 'interrupted'),
      ]);

      expect(result.classification).toBe('CONSISTENTLY_FAILING');

      expect(result.passedExecutions).toBe(0);
      expect(result.failedExecutions).toBe(3);
      expect(result.failureRate).toBe(1);

      expect(result.requiresHumanReview).toBe(true);
    },
  );

  test(
    'CFG-052 | flakiness intelligence | detects browser-specific intermittency',
    {
      tag: [testTags.integration, testTags.critical],
    },
    async () => {
      const result = flakyTestDetectionAgent.analyzeAcrossProjects([
        createAnalysis('chromium', 'STABLE'),
        createAnalysis('firefox', 'INTERMITTENT'),
        createAnalysis('webkit', 'STABLE'),
      ]);

      expect(result.classification).toBe('BROWSER_SPECIFIC_INTERMITTENT');

      expect(result.affectedProjects).toEqual(['firefox']);

      expect(result.stableProjects).toEqual(['chromium', 'webkit']);

      expect(result.requiresHumanReview).toBe(true);
    },
  );

  test(
    'CFG-053 | flakiness intelligence | classifies stable cross-browser evidence',
    {
      tag: [testTags.integration, testTags.positive],
    },
    async () => {
      const result = flakyTestDetectionAgent.analyzeAcrossProjects([
        createAnalysis('chromium', 'STABLE'),
        createAnalysis('firefox', 'STABLE'),
        createAnalysis('webkit', 'STABLE'),
      ]);

      expect(result.classification).toBe('CROSS_BROWSER_STABLE');

      expect(result.affectedProjects).toEqual([]);

      expect(result.stableProjects).toEqual(['chromium', 'firefox', 'webkit']);

      expect(result.requiresHumanReview).toBe(false);
    },
  );

  test(
    'CFG-054 | flakiness intelligence | blocks cross-browser conclusions with incomplete history',
    {
      tag: [testTags.integration, testTags.negative],
    },
    async () => {
      const result = flakyTestDetectionAgent.analyzeAcrossProjects([
        createAnalysis('chromium', 'STABLE'),
        createAnalysis('firefox', 'INSUFFICIENT_HISTORY'),
        createAnalysis('webkit', 'STABLE'),
      ]);

      expect(result.classification).toBe('INSUFFICIENT_HISTORY');

      expect(result.affectedProjects).toEqual(['firefox']);

      expect(result.confidence).toBe('low');

      expect(result.requiresHumanReview).toBe(false);
    },
  );

  test(
    'CFG-055 | flakiness intelligence | assigns medium confidence at five observations',
    {
      tag: [testTags.integration],
    },
    async () => {
      const executions = Array.from({ length: 5 }, (_, index) =>
        createExecution(index + 1, 'firefox', index === 0 ? 'failed' : 'passed'),
      );

      const result = flakyTestDetectionAgent.analyze(executions);

      expect(result.classification).toBe('INTERMITTENT');

      expect(result.confidence).toBe('medium');
    },
  );

  test(
    'CFG-056 | flakiness intelligence | assigns high confidence at ten observations',
    {
      tag: [testTags.integration, testTags.critical],
    },
    async () => {
      const executions = Array.from({ length: 10 }, (_, index) =>
        createExecution(index + 1, 'firefox', index === 0 ? 'failed' : 'passed'),
      );

      const result = flakyTestDetectionAgent.analyze(executions);

      expect(result.classification).toBe('INTERMITTENT');

      expect(result.confidence).toBe('high');
    },
  );
});
