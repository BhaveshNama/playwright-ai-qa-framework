import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { testTags } from '../../config/test-tags';
import { aiAnalysisService } from '../../intelligence/services/ai-analysis.service';
import { environmentCorrelationService } from '../../intelligence/services/environment-correlation.service';
import { executionHistoryService } from '../../intelligence/services/execution-history.service';
import { executionReportArchiveService } from '../../intelligence/services/execution-report-archive.service';
import { failureAnalysisService } from '../../intelligence/services/failure-analysis.service';
import { flakinessAnalysisService } from '../../intelligence/services/flakiness-analysis.service';
import { intelligenceSummaryService } from '../../intelligence/services/intelligence-summary.service';
import { qaOrchestrationService } from '../../intelligence/services/qa-orchestration.service';
import { reliabilityTrendService } from '../../intelligence/services/reliability-trend.service';

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

interface SummaryFixtureOptions {
  failed?: number;
  timedOut?: number;
  interrupted?: number;
  intermittentTests?: number;
  consistentlyFailingTests?: number;
  orchestrationResults?: unknown[];
}

function createSummaryFixture(directory: string, options: SummaryFixtureOptions = {}) {
  const executionFile = path.join(directory, 'test-results.json');

  const flakinessFile = path.join(directory, 'flaky-test-analysis.json');

  const reliabilityTrendFile = path.join(directory, 'reliability-trend.json');

  const environmentCorrelationFile = path.join(directory, 'environment-correlation.json');

  const orchestrationFile = path.join(directory, 'qa-orchestration.json');

  const aiFile = path.join(directory, 'ai-analysis.json');

  const jsonFile = path.join(directory, 'intelligence-summary.json');

  const markdownFile = path.join(directory, 'intelligence-summary.md');

  const failed = options.failed ?? 0;
  const timedOut = options.timedOut ?? 0;
  const interrupted = options.interrupted ?? 0;

  const totalTests = 3;

  const passed = totalTests - failed - timedOut - interrupted;

  const intermittentTests = options.intermittentTests ?? 0;

  const consistentlyFailingTests = options.consistentlyFailingTests ?? 0;

  const orchestrationResults = options.orchestrationResults ?? [];

  writeJson(executionFile, {
    schemaVersion: '1.0',
    generatedAt: '2026-11-04T10:00:00.000Z',
    totalTests,
    totals: {
      passed,
      failed,
      skipped: 0,
      timedOut,
      interrupted,
    },
    results: [],
  });

  writeJson(flakinessFile, {
    schemaVersion: '1.0',
    generatedAt: '2026-11-04T10:00:00.000Z',
    sourceHistory: 'execution-history.json',
    totalHistoricalExecutions: 10,
    eligibleExecutions: 9,
    excludedExecutions: 1,
    totalGroups: 3,
    classifications: {
      STABLE: 3 - intermittentTests - consistentlyFailingTests,
      INTERMITTENT: intermittentTests,
      CONSISTENTLY_FAILING: consistentlyFailingTests,
    },
    analyses: [],
    crossBrowserAnalyses: [],
  });

  writeJson(reliabilityTrendFile, {
    schemaVersion: '1.0',
    generatedAt: '2026-11-04T10:00:00.000Z',
    sourceHistory: 'execution-history.json',
    recentWindowSize: 5,
    totalGroups: 3,
    improving: 0,
    stable: 3,
    degrading: 0,
    insufficientHistory: 0,
    analyses: [],
  });

  writeJson(environmentCorrelationFile, {
    schemaVersion: '1.0',
    generatedAt: '2026-11-04T10:00:00.000Z',
    sourceHistory: 'execution-history.json',
    totalGroups: 0,
    localEnvironmentSensitive: 0,
    ciEnvironmentSensitive: 0,
    consistent: 0,
    insufficientHistory: 0,
    analyses: [],
  });

  writeJson(orchestrationFile, {
    schemaVersion: '1.0',
    generatedAt: '2026-11-04T10:00:00.000Z',
    sourceFailureAnalysis: 'failure-analysis.json',
    sourceFlakinessAnalysis: 'flaky-test-analysis.json',
    totalDecisions: orchestrationResults.length,
    decisionTotals: {},
    results: orchestrationResults,
  });

  writeJson(aiFile, {
    schemaVersion: '1.0',
    generatedAt: '2026-11-04T10:00:00.000Z',
    sourceOrchestration: 'qa-orchestration.json',
    provider: 'disabled',
    enabled: false,
    totalAnalyses: 0,
    analyses: [],
  });

  return {
    executionFile,
    flakinessFile,
    reliabilityTrendFile,
    environmentCorrelationFile,
    orchestrationFile,
    aiFile,
    jsonFile,
    markdownFile,
  };
}

function createHistoricalExecution(
  sequence: number,
  status: 'passed' | 'failed' | 'timedOut',
  durationMs: number,
) {
  return {
    runId: `trend-run-${sequence}`,
    testId: 'auth-002',
    title: 'AUTH-002 | authentication | rejects invalid credentials',
    project: 'firefox',
    status,
    durationMs,
    retry: 0,
    timestamp: new Date(Date.UTC(2026, 10, 4, 10, sequence)).toISOString(),
    runType: 'full-regression',
    runSource: 'local',
    runScope: 'mixed',
  };
}

function createEnvironmentExecution(
  sequence: number,
  source: 'local' | 'ci',
  status: 'passed' | 'failed' | 'timedOut',
  durationMs: number,
) {
  return {
    runId: `environment-${source}-${sequence}`,
    testId: 'auth-002',
    title: 'AUTH-002 | authentication | rejects invalid credentials',
    project: 'firefox',
    status,
    durationMs,
    retry: 0,
    timestamp: new Date(Date.UTC(2026, 10, 4, 12, sequence)).toISOString(),
    runType: 'full-regression',
    runSource: source,
    runScope: 'mixed',
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

test(
  'CFG-085 | intelligence summary | reports GREEN for a clean execution',
  {
    tag: [testTags.integration, testTags.critical, testTags.positive],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const files = createSummaryFixture(directory);

      const result = intelligenceSummaryService.generate(
        files.executionFile,
        files.flakinessFile,
        files.reliabilityTrendFile,
        files.environmentCorrelationFile,
        files.orchestrationFile,
        files.aiFile,
        files.jsonFile,
        files.markdownFile,
        {
          runId: '2026-11-04T10:00:00.000Z',
          runType: 'full-regression',
          source: 'local',
          scope: 'mixed',
        },
      );

      expect(result.summary.qualitySignal).toBe('GREEN');

      expect(result.summary.execution).toMatchObject({
        totalTests: 3,
        passed: 3,
        failed: 0,
        timedOut: 0,
        interrupted: 0,
      });

      expect(result.summary.trends).toEqual({
        recentWindowSize: 5,
        totalGroups: 3,
        improving: 0,
        stable: 3,
        degrading: 0,
        insufficientHistory: 0,
      });

      expect(result.summary.ai).toMatchObject({
        provider: 'disabled',
        enabled: false,
        autonomousChangesAllowed: false,
      });

      expect(fs.existsSync(files.jsonFile)).toBe(true);

      expect(fs.existsSync(files.markdownFile)).toBe(true);

      const markdown = fs.readFileSync(files.markdownFile, 'utf8');

      expect(markdown).toContain('## Reliability Trends');

      expect(markdown).toContain('- Recent window size: 5');

      expect(markdown).toContain('- Stable: 3');

      expect(markdown).toContain('**GREEN**');
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-086 | intelligence summary | reports RED for a failed execution',
  {
    tag: [testTags.integration, testTags.critical, testTags.negative],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const files = createSummaryFixture(directory, {
        failed: 1,
      });

      const result = intelligenceSummaryService.generate(
        files.executionFile,
        files.flakinessFile,
        files.reliabilityTrendFile,
        files.environmentCorrelationFile,
        files.orchestrationFile,
        files.aiFile,
        files.jsonFile,
        files.markdownFile,
        {
          runId: '2026-11-04T10:00:00.000Z',
          runType: 'full-regression',
          source: 'ci',
          scope: 'mixed',
        },
      );

      expect(result.summary.qualitySignal).toBe('RED');

      expect(result.summary.execution.failed).toBe(1);

      expect(result.summary.execution.passed).toBe(2);

      expect(result.summary.trends.stable).toBe(3);

      expect(fs.readFileSync(files.markdownFile, 'utf8')).toContain('**RED**');
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-087 | intelligence summary | reports AMBER for intermittent evidence',
  {
    tag: [testTags.integration, testTags.critical],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const files = createSummaryFixture(directory, {
        intermittentTests: 1,
      });

      const result = intelligenceSummaryService.generate(
        files.executionFile,
        files.flakinessFile,
        files.reliabilityTrendFile,
        files.environmentCorrelationFile,
        files.orchestrationFile,
        files.aiFile,
        files.jsonFile,
        files.markdownFile,
        {
          runId: '2026-11-04T10:00:00.000Z',
          runType: 'targeted',
          source: 'local',
          scope: 'firefox',
        },
      );

      expect(result.summary.qualitySignal).toBe('AMBER');

      expect(result.summary.reliability.intermittentTests).toBe(1);

      expect(result.summary.execution.failed).toBe(0);

      expect(result.summary.trends).toMatchObject({
        recentWindowSize: 5,
        totalGroups: 3,
        degrading: 0,
      });

      expect(fs.readFileSync(files.markdownFile, 'utf8')).toContain('**AMBER**');
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-088 | reliability trend | requires historical baseline before classifying a trend',
  {
    tag: [testTags.integration, testTags.negative],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const historyFile = path.join(directory, 'execution-history.json');

      const outputFile = path.join(directory, 'reliability-trend.json');

      const executions = [
        createHistoricalExecution(1, 'passed', 5000),
        createHistoricalExecution(2, 'passed', 6000),
        createHistoricalExecution(3, 'timedOut', 30000),
        createHistoricalExecution(4, 'passed', 7000),
      ];

      writeJson(historyFile, {
        schemaVersion: '1.0',
        updatedAt: '2026-11-04T10:30:00.000Z',
        ingestedRunIds: executions.map((execution) => execution.runId),
        runs: [],
        executions,
      });

      const result = reliabilityTrendService.analyze(historyFile, outputFile);

      expect(result.report.totalGroups).toBe(1);
      expect(result.report.insufficientHistory).toBe(1);

      expect(result.report.analyses[0].direction).toBe('INSUFFICIENT_HISTORY');

      expect(result.report.analyses[0].recent.executions).toBe(4);

      expect(result.report.analyses[0].recent.timedOut).toBe(1);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-089 | reliability trend | detects degrading reliability',
  {
    tag: [testTags.integration, testTags.critical],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const historyFile = path.join(directory, 'execution-history.json');

      const outputFile = path.join(directory, 'reliability-trend.json');

      const executions = [
        createHistoricalExecution(1, 'passed', 5000),
        createHistoricalExecution(2, 'passed', 5000),
        createHistoricalExecution(3, 'passed', 7000),
        createHistoricalExecution(4, 'failed', 7000),
        createHistoricalExecution(5, 'passed', 7000),
        createHistoricalExecution(6, 'timedOut', 30000),
        createHistoricalExecution(7, 'passed', 7000),
      ];

      writeJson(historyFile, {
        schemaVersion: '1.0',
        updatedAt: '2026-11-04T11:00:00.000Z',
        ingestedRunIds: executions.map((execution) => execution.runId),
        runs: [],
        executions,
      });

      const result = reliabilityTrendService.analyze(historyFile, outputFile);

      const analysis = result.report.analyses[0];

      expect(analysis.historical.executions).toBe(2);
      expect(analysis.recent.executions).toBe(5);
      expect(analysis.historical.failureRate).toBe(0);
      expect(analysis.recent.failureRate).toBeCloseTo(0.4);
      expect(analysis.direction).toBe('DEGRADING');

      expect(result.report.degrading).toBe(1);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-090 | reliability trend | detects improving reliability',
  {
    tag: [testTags.integration, testTags.positive],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const historyFile = path.join(directory, 'execution-history.json');

      const outputFile = path.join(directory, 'reliability-trend.json');

      const executions = [
        createHistoricalExecution(1, 'failed', 12000),
        createHistoricalExecution(2, 'timedOut', 30000),
        createHistoricalExecution(3, 'passed', 7000),
        createHistoricalExecution(4, 'passed', 7000),
        createHistoricalExecution(5, 'passed', 7000),
        createHistoricalExecution(6, 'passed', 7000),
        createHistoricalExecution(7, 'passed', 7000),
      ];

      writeJson(historyFile, {
        schemaVersion: '1.0',
        updatedAt: '2026-11-04T11:00:00.000Z',
        ingestedRunIds: executions.map((execution) => execution.runId),
        runs: [],
        executions,
      });

      const result = reliabilityTrendService.analyze(historyFile, outputFile);

      const analysis = result.report.analyses[0];

      expect(analysis.historical.failureRate).toBe(1);
      expect(analysis.recent.failureRate).toBe(0);
      expect(analysis.direction).toBe('IMPROVING');

      expect(result.report.improving).toBe(1);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-091 | reliability trend | keeps stable reliability within thresholds',
  {
    tag: [testTags.integration, testTags.positive],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const historyFile = path.join(directory, 'execution-history.json');

      const outputFile = path.join(directory, 'reliability-trend.json');

      const executions = [
        createHistoricalExecution(1, 'passed', 10000),
        createHistoricalExecution(2, 'passed', 10000),
        createHistoricalExecution(3, 'passed', 11000),
        createHistoricalExecution(4, 'passed', 11000),
        createHistoricalExecution(5, 'passed', 11000),
        createHistoricalExecution(6, 'passed', 11000),
        createHistoricalExecution(7, 'passed', 11000),
      ];

      writeJson(historyFile, {
        schemaVersion: '1.0',
        updatedAt: '2026-11-04T11:00:00.000Z',
        ingestedRunIds: executions.map((execution) => execution.runId),
        runs: [],
        executions,
      });

      const result = reliabilityTrendService.analyze(historyFile, outputFile);

      const analysis = result.report.analyses[0];

      expect(analysis.failureRateChange).toBe(0);

      expect(analysis.durationChangePercent).toBeCloseTo(10);

      expect(analysis.direction).toBe('STABLE');
      expect(result.report.stable).toBe(1);

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
  'CFG-092 | environment correlation | requires sufficient local and CI history',
  {
    tag: [testTags.integration, testTags.negative],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const historyFile = path.join(directory, 'execution-history.json');

      const outputFile = path.join(directory, 'environment-correlation.json');

      const executions = [
        createEnvironmentExecution(1, 'local', 'passed', 7000),
        createEnvironmentExecution(2, 'local', 'failed', 12000),
        createEnvironmentExecution(3, 'ci', 'passed', 6000),
      ];

      writeJson(historyFile, {
        schemaVersion: '1.0',
        updatedAt: '2026-11-04T13:00:00.000Z',
        ingestedRunIds: executions.map((execution) => execution.runId),
        runs: [],
        executions,
      });

      const result = environmentCorrelationService.analyze(historyFile, outputFile);

      expect(result.report.totalGroups).toBe(1);

      expect(result.report.insufficientHistory).toBe(1);

      const analysis = result.report.analyses[0];

      expect(analysis.local.executions).toBe(2);

      expect(analysis.ci.executions).toBe(1);

      expect(analysis.classification).toBe('INSUFFICIENT_HISTORY');

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
  'CFG-093 | environment correlation | detects local environment sensitivity',
  {
    tag: [testTags.integration, testTags.critical],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const historyFile = path.join(directory, 'execution-history.json');

      const outputFile = path.join(directory, 'environment-correlation.json');

      const executions = [
        createEnvironmentExecution(1, 'local', 'failed', 12000),
        createEnvironmentExecution(2, 'local', 'passed', 7000),
        createEnvironmentExecution(3, 'ci', 'passed', 6000),
        createEnvironmentExecution(4, 'ci', 'passed', 6500),
      ];

      writeJson(historyFile, {
        schemaVersion: '1.0',
        updatedAt: '2026-11-04T13:00:00.000Z',
        ingestedRunIds: executions.map((execution) => execution.runId),
        runs: [],
        executions,
      });

      const result = environmentCorrelationService.analyze(historyFile, outputFile);

      const analysis = result.report.analyses[0];

      expect(analysis.local.executions).toBe(2);

      expect(analysis.ci.executions).toBe(2);

      expect(analysis.local.passRate).toBe(0.5);

      expect(analysis.ci.passRate).toBe(1);

      expect(analysis.passRateDifference).toBe(-0.5);

      expect(analysis.classification).toBe('LOCAL_ENVIRONMENT_SENSITIVE');

      expect(result.report.localEnvironmentSensitive).toBe(1);

      expect(result.report.ciEnvironmentSensitive).toBe(0);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-094 | environment correlation | detects CI environment sensitivity',
  {
    tag: [testTags.integration, testTags.critical],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const historyFile = path.join(directory, 'execution-history.json');

      const outputFile = path.join(directory, 'environment-correlation.json');

      const executions = [
        createEnvironmentExecution(1, 'local', 'passed', 7000),
        createEnvironmentExecution(2, 'local', 'passed', 7500),
        createEnvironmentExecution(3, 'ci', 'passed', 6000),
        createEnvironmentExecution(4, 'ci', 'failed', 14000),
      ];

      writeJson(historyFile, {
        schemaVersion: '1.0',
        updatedAt: '2026-11-04T13:00:00.000Z',
        ingestedRunIds: executions.map((execution) => execution.runId),
        runs: [],
        executions,
      });

      const result = environmentCorrelationService.analyze(historyFile, outputFile);

      const analysis = result.report.analyses[0];

      expect(analysis.local.passRate).toBe(1);

      expect(analysis.ci.passRate).toBe(0.5);

      expect(analysis.passRateDifference).toBe(0.5);

      expect(analysis.classification).toBe('CI_ENVIRONMENT_SENSITIVE');

      expect(result.report.ciEnvironmentSensitive).toBe(1);

      expect(result.report.localEnvironmentSensitive).toBe(0);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);

test(
  'CFG-095 | environment correlation | classifies matching environments as consistent',
  {
    tag: [testTags.integration, testTags.positive],
  },
  async () => {
    const directory = createTempDirectory();

    try {
      const historyFile = path.join(directory, 'execution-history.json');

      const outputFile = path.join(directory, 'environment-correlation.json');

      const executions = [
        createEnvironmentExecution(1, 'local', 'passed', 7000),
        createEnvironmentExecution(2, 'local', 'passed', 7500),
        createEnvironmentExecution(3, 'ci', 'passed', 6000),
        createEnvironmentExecution(4, 'ci', 'passed', 6500),
      ];

      writeJson(historyFile, {
        schemaVersion: '1.0',
        updatedAt: '2026-11-04T13:00:00.000Z',
        ingestedRunIds: executions.map((execution) => execution.runId),
        runs: [],
        executions,
      });

      const result = environmentCorrelationService.analyze(historyFile, outputFile);

      const analysis = result.report.analyses[0];

      expect(analysis.local.passRate).toBe(1);

      expect(analysis.ci.passRate).toBe(1);

      expect(analysis.passRateDifference).toBe(0);

      expect(analysis.classification).toBe('CONSISTENT');

      expect(result.report.consistent).toBe(1);

      expect(result.report.localEnvironmentSensitive).toBe(0);

      expect(result.report.ciEnvironmentSensitive).toBe(0);

      expect(result.report.insufficientHistory).toBe(0);

      expect(fs.existsSync(outputFile)).toBe(true);
    } finally {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  },
);
