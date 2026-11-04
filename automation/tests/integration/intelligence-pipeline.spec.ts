import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { testTags } from '../../config/test-tags';
import { aiAnalysisService } from '../../intelligence/services/ai-analysis.service';
import { executionHistoryService } from '../../intelligence/services/execution-history.service';
import { failureAnalysisService } from '../../intelligence/services/failure-analysis.service';
import { qaOrchestrationService } from '../../intelligence/services/qa-orchestration.service';
import { flakinessAnalysisService } from '../../intelligence/services/flakiness-analysis.service';
import { executionReportArchiveService } from '../../intelligence/services/execution-report-archive.service';

function createTempDirectory(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agenticqa-'));
}

function writeJson(file: string, data: unknown): void {
  fs.mkdirSync(path.dirname(file), {
    recursive: true,
  });

  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function createExecutionReport(status: 'passed' | 'failed' = 'passed') {
  return {
    schemaVersion: '1.0',
    generatedAt: '2026-11-03T12:00:00.000Z',
    totalTests: 1,
    results: [
      {
        testId: 'pipeline-test-id',
        title: 'CFG-PIPELINE | intelligence | synthetic scenario',
        titlePath: [
          '',
          'framework',
          'synthetic.spec.ts',
          'Synthetic intelligence pipeline',
          'CFG-PIPELINE | intelligence | synthetic scenario',
        ],
        file: 'synthetic.spec.ts',
        project: 'framework',
        tags: ['@integration'],
        status,
        expectedStatus: 'passed',
        durationMs: 100,
        retry: 0,
        workerIndex: 0,
        errorMessage:
          status === 'failed'
            ? 'Error: expect(locator).toHaveCount(expected) failed\nExpected: 0\nReceived: 1'
            : undefined,
        errorStack: status === 'failed' ? 'Error: synthetic assertion failure' : undefined,
        attachments: [],
        timestamp: '2026-11-03T12:00:00.000Z',
      },
    ],
  };
}

test(
  'CFG-073 | intelligence pipeline | ingests a new execution run',
  {
    tag: [testTags.integration, testTags.positive],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const sourceFile = path.join(directory, 'test-results.json');

      const historyFile = path.join(directory, 'execution-history.json');

      writeJson(sourceFile, createExecutionReport());

      const result = executionHistoryService.update(sourceFile, historyFile, {
        runType: 'framework',
        source: 'local',
        scope: 'framework',
      });

      expect(result.alreadyIngested).toBe(false);

      expect(result.addedExecutions).toBe(1);
      expect(result.totalExecutions).toBe(1);

      expect(fs.existsSync(historyFile)).toBe(true);

      expect(result.runContext).toEqual({
        runType: 'framework',
        source: 'local',
        scope: 'framework',
      });

      const history = JSON.parse(fs.readFileSync(historyFile, 'utf8')) as {
        runs?: Array<{
          runId: string;
          runType: string;
          source: string;
          scope: string;
          generatedAt: string;
          executionCount: number;
        }>;
        executions: Array<{
          runId: string;
          runType?: string;
          runSource?: string;
          runScope?: string;
        }>;
      };

      expect(history.runs).toHaveLength(1);

      expect(history.runs?.[0]).toMatchObject({
        runId: result.runId,
        runType: 'framework',
        source: 'local',
        scope: 'framework',
        executionCount: 1,
      });

      expect(history.executions).toHaveLength(1);

      expect(history.executions[0]).toMatchObject({
        runId: result.runId,
        runType: 'framework',
        runSource: 'local',
        runScope: 'framework',
      });
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-074 | intelligence pipeline | prevents duplicate execution ingestion',
  {
    tag: [testTags.integration, testTags.critical],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const sourceFile = path.join(directory, 'test-results.json');

      const historyFile = path.join(directory, 'execution-history.json');

      const runContext = {
        runType: 'framework',
        source: 'local',
        scope: 'framework',
      } as const;

      writeJson(sourceFile, createExecutionReport());

      const firstResult = executionHistoryService.update(sourceFile, historyFile, runContext);

      const duplicateResult = executionHistoryService.update(sourceFile, historyFile, runContext);

      expect(firstResult.alreadyIngested).toBe(false);

      expect(firstResult.addedExecutions).toBe(1);

      expect(duplicateResult.alreadyIngested).toBe(true);

      expect(duplicateResult.addedExecutions).toBe(0);

      expect(duplicateResult.totalExecutions).toBe(1);

      expect(duplicateResult.runContext).toEqual(runContext);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-075 | intelligence pipeline | handles an execution with zero failures',
  {
    tag: [testTags.integration, testTags.positive],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const sourceFile = path.join(directory, 'test-results.json');

      const outputFile = path.join(directory, 'failure-analysis.json');

      writeJson(sourceFile, createExecutionReport('passed'));

      const result = failureAnalysisService.analyze(sourceFile, outputFile);

      expect(result.report.totalFailures).toBe(0);

      expect(result.report.analyses).toEqual([]);

      expect(fs.existsSync(outputFile)).toBe(true);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-076 | intelligence pipeline | generates failure intelligence from a failed execution',
  {
    tag: [testTags.integration, testTags.critical],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const sourceFile = path.join(directory, 'test-results.json');

      const outputFile = path.join(directory, 'failure-analysis.json');

      writeJson(sourceFile, createExecutionReport('failed'));

      const result = failureAnalysisService.analyze(sourceFile, outputFile);

      expect(result.report.totalFailures).toBe(1);

      expect(result.report.analyses).toHaveLength(1);

      expect(result.report.analyses[0].category).toBe('assertion');

      expect(result.report.analyses[0].requiresHumanReview).toBe(true);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-077 | intelligence pipeline | rejects an unsupported execution schema',
  {
    tag: [testTags.integration, testTags.negative],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const sourceFile = path.join(directory, 'test-results.json');

      const historyFile = path.join(directory, 'execution-history.json');

      writeJson(sourceFile, {
        schemaVersion: '999.0',
        generatedAt: '2026-11-03T12:00:00.000Z',
        totalTests: 0,
        results: [],
      });

      expect(() =>
        executionHistoryService.update(sourceFile, historyFile, {
          runType: 'framework',
          source: 'local',
          scope: 'framework',
        }),
      ).toThrow('Unsupported Nexus intelligence schema: 999.0');
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-078 | intelligence pipeline | preserves a deterministic orchestration decision',
  {
    tag: [testTags.integration, testTags.critical],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const failureFile = path.join(directory, 'failure-analysis.json');

      const flakinessFile = path.join(directory, 'flaky-test-analysis.json');

      const orchestrationFile = path.join(directory, 'qa-orchestration.json');

      writeJson(failureFile, {
        schemaVersion: '1.0',
        generatedAt: '2026-11-03T12:00:00.000Z',
        sourceReport: 'test-results.json',
        totalFailures: 1,
        analyses: [
          {
            testId: 'cart-003',
            testTitle: 'CART-003 | cart | removes a product from the cart',
            layer: 'ui',
            category: 'assertion',
            confidence: 'high',
            summary: 'Synthetic failure.',
            probableCause: 'Synthetic assertion mismatch.',
            recommendations: [],
            evidence: ['Project: firefox'],
            requiresHumanReview: true,
          },
        ],
      });

      writeJson(flakinessFile, {
        schemaVersion: '1.0',
        generatedAt: '2026-11-03T12:00:00.000Z',
        sourceHistory: 'execution-history.json',
        totalGroups: 3,
        classifications: {
          STABLE: 2,
          INTERMITTENT: 1,
        },
        analyses: [
          {
            testId: 'cart-003',
            testTitle: 'CART-003 | cart | removes a product from the cart',
            project: 'firefox',
            classification: 'INTERMITTENT',
            confidence: 'low',
            totalExecutions: 3,
            passedExecutions: 2,
            failedExecutions: 1,
            failureRate: 1 / 3,
            averageDurationMs: 1000,
            recommendation: 'Investigate Firefox.',
            requiresHumanReview: true,
          },
        ],
        crossBrowserAnalyses: [
          {
            testTitle: 'CART-003 | cart | removes a product from the cart',
            classification: 'BROWSER_SPECIFIC_INTERMITTENT',
            affectedProjects: ['firefox'],
            stableProjects: ['chromium', 'webkit'],
            confidence: 'low',
            recommendation: 'Investigate browser-specific behavior.',
            requiresHumanReview: true,
          },
        ],
      });

      const result = qaOrchestrationService.orchestrate(
        failureFile,
        flakinessFile,
        orchestrationFile,
      );

      expect(result.report.totalDecisions).toBe(1);

      expect(result.report.results[0].decision).toBe('INVESTIGATE_BROWSER_SPECIFIC');

      expect(result.report.results[0].requiresHumanReview).toBe(true);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-079 | intelligence pipeline | keeps disabled AI advisory and human reviewed',
  {
    tag: [testTags.integration, testTags.critical],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const orchestrationFile = path.join(directory, 'qa-orchestration.json');

      const outputFile = path.join(directory, 'ai-analysis.json');

      writeJson(orchestrationFile, {
        schemaVersion: '1.0',
        generatedAt: '2026-11-03T12:00:00.000Z',
        sourceFailureAnalysis: 'failure-analysis.json',
        sourceFlakinessAnalysis: 'flaky-test-analysis.json',
        totalDecisions: 1,
        decisionTotals: {
          INVESTIGATE_BROWSER_SPECIFIC: 1,
        },
        results: [
          {
            testId: 'cart-003',
            testTitle: 'CART-003 | cart | removes a product from the cart',
            project: 'firefox',
            decision: 'INVESTIGATE_BROWSER_SPECIFIC',
            priority: 'high',
            confidence: 'low',
            summary: 'Synthetic decision.',
            rationale: ['Browser-specific evidence.'],
            recommendedActions: ['Inspect Firefox behavior.'],
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
          },
        ],
      });

      const result = await aiAnalysisService.analyze(orchestrationFile, outputFile, 'disabled');

      expect(result.report.provider).toBe('disabled');

      expect(result.report.enabled).toBe(false);

      expect(result.report.totalAnalyses).toBe(1);

      const analysis = result.report.analyses[0];

      expect(analysis.status).toBe('DISABLED');

      expect(analysis.hypotheses).toEqual([]);

      expect(analysis.guardrails.advisoryOnly).toBe(true);

      expect(analysis.guardrails.autonomousCodeModificationAllowed).toBe(false);

      expect(analysis.guardrails.autonomousRetryModificationAllowed).toBe(false);

      expect(analysis.guardrails.autonomousTimeoutModificationAllowed).toBe(false);

      expect(analysis.guardrails.humanApprovalRequired).toBe(true);

      expect(analysis.requiresHumanReview).toBe(true);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-080 | intelligence pipeline | reports a useful error when source evidence is missing',
  {
    tag: [testTags.integration, testTags.negative],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const missingFile = path.join(directory, 'missing-test-results.json');

      const outputFile = path.join(directory, 'failure-analysis.json');

      expect(() => failureAnalysisService.analyze(missingFile, outputFile)).toThrow(
        `Nexus intelligence report not found: ${missingFile}`,
      );
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-081 | intelligence pipeline | includes targeted browser evidence in flakiness analysis',
  {
    tag: [testTags.integration, testTags.critical],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const historyFile = path.join(directory, 'execution-history.json');

      const outputFile = path.join(directory, 'flaky-test-analysis.json');

      writeJson(historyFile, {
        schemaVersion: '1.0',
        updatedAt: '2026-11-04T06:00:00.000Z',
        ingestedRunIds: ['targeted-firefox-001', 'targeted-firefox-002', 'targeted-firefox-003'],
        runs: [],
        executions: [
          {
            runId: 'targeted-firefox-001',
            testId: 'cart-003',
            title: 'CART-003 | cart | removes a product from the cart',
            project: 'firefox',
            status: 'passed',
            durationMs: 1000,
            retry: 0,
            timestamp: '2026-11-04T05:00:00.000Z',
            runType: 'targeted',
            runSource: 'local',
            runScope: 'firefox',
          },
          {
            runId: 'targeted-firefox-002',
            testId: 'cart-003',
            title: 'CART-003 | cart | removes a product from the cart',
            project: 'firefox',
            status: 'failed',
            durationMs: 1100,
            retry: 0,
            timestamp: '2026-11-04T05:10:00.000Z',
            runType: 'targeted',
            runSource: 'local',
            runScope: 'firefox',
          },
          {
            runId: 'targeted-firefox-003',
            testId: 'cart-003',
            title: 'CART-003 | cart | removes a product from the cart',
            project: 'firefox',
            status: 'passed',
            durationMs: 900,
            retry: 0,
            timestamp: '2026-11-04T05:20:00.000Z',
            runType: 'targeted',
            runSource: 'local',
            runScope: 'firefox',
          },
        ],
      });

      const result = flakinessAnalysisService.analyze(historyFile, outputFile);

      expect(result.report.totalHistoricalExecutions).toBe(3);

      expect(result.report.eligibleExecutions).toBe(3);

      expect(result.report.excludedExecutions).toBe(0);

      expect(result.report.analyses).toHaveLength(1);

      expect(result.report.analyses[0].project).toBe('firefox');

      expect(result.report.analyses[0].classification).toBe('INTERMITTENT');
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-082 | intelligence pipeline | excludes framework and API evidence from browser flakiness',
  {
    tag: [testTags.integration, testTags.critical],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const historyFile = path.join(directory, 'execution-history.json');

      const outputFile = path.join(directory, 'flaky-test-analysis.json');

      writeJson(historyFile, {
        schemaVersion: '1.0',
        updatedAt: '2026-11-04T06:00:00.000Z',
        ingestedRunIds: ['framework-001', 'api-001', 'browser-001'],
        runs: [],
        executions: [
          {
            runId: 'framework-001',
            testId: 'cfg-001',
            title: 'CFG-001 | configuration | synthetic framework test',
            project: 'framework',
            status: 'failed',
            durationMs: 100,
            retry: 0,
            timestamp: '2026-11-04T05:00:00.000Z',
            runType: 'framework',
            runSource: 'local',
            runScope: 'framework',
          },
          {
            runId: 'api-001',
            testId: 'api-001',
            title: 'API-001 | health API | synthetic API test',
            project: 'api',
            status: 'failed',
            durationMs: 100,
            retry: 0,
            timestamp: '2026-11-04T05:10:00.000Z',
            runType: 'api',
            runSource: 'local',
            runScope: 'api',
          },
          {
            runId: 'browser-001',
            testId: 'cart-001',
            title: 'CART-001 | cart | adds an available product from the catalogue',
            project: 'firefox',
            status: 'passed',
            durationMs: 1000,
            retry: 0,
            timestamp: '2026-11-04T05:20:00.000Z',
            runType: 'targeted',
            runSource: 'local',
            runScope: 'firefox',
          },
        ],
      });

      const result = flakinessAnalysisService.analyze(historyFile, outputFile);

      expect(result.report.totalHistoricalExecutions).toBe(3);

      expect(result.report.eligibleExecutions).toBe(1);

      expect(result.report.excludedExecutions).toBe(2);

      expect(result.report.analyses).toHaveLength(1);

      expect(result.report.analyses[0].project).toBe('firefox');

      expect(result.report.analyses.some((analysis) => analysis.project === 'framework')).toBe(
        false,
      );

      expect(result.report.analyses.some((analysis) => analysis.project === 'api')).toBe(false);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-083 | intelligence pipeline | archives execution evidence using the reporter run identifier',
  {
    tag: [testTags.integration, testTags.critical],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const sourceFile = path.join(directory, 'test-results.json');

      const archiveRoot = path.join(directory, 'runs');

      writeJson(sourceFile, createExecutionReport());

      const result = executionReportArchiveService.archive(sourceFile, archiveRoot);

      expect(result.alreadyArchived).toBe(false);

      expect(result.runId).toBe('2026-11-03T12:00:00.000Z');

      expect(fs.existsSync(result.archivedReportFile)).toBe(true);

      const archivedReport = JSON.parse(fs.readFileSync(result.archivedReportFile, 'utf8')) as {
        generatedAt: string;
        totalTests: number;
      };

      expect(archivedReport.generatedAt).toBe(result.runId);

      expect(archivedReport.totalTests).toBe(1);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-084 | intelligence pipeline | does not overwrite previously archived execution evidence',
  {
    tag: [testTags.integration, testTags.critical],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const sourceFile = path.join(directory, 'test-results.json');

      const archiveRoot = path.join(directory, 'runs');

      writeJson(sourceFile, createExecutionReport());

      const firstResult = executionReportArchiveService.archive(sourceFile, archiveRoot);

      const originalArchive = fs.readFileSync(firstResult.archivedReportFile, 'utf8');

      writeJson(sourceFile, {
        ...createExecutionReport(),
        totalTests: 999,
      });

      const secondResult = executionReportArchiveService.archive(sourceFile, archiveRoot);

      expect(secondResult.alreadyArchived).toBe(true);

      expect(secondResult.runId).toBe(firstResult.runId);

      expect(fs.readFileSync(secondResult.archivedReportFile, 'utf8')).toBe(originalArchive);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);
