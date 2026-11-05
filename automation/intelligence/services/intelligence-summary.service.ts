import fs from 'node:fs';
import path from 'node:path';

import type { AiInvestigationAnalysis } from '../ai/ai-analysis.model';
import type {
  CrossBrowserFlakinessAnalysis,
  FlakyTestAnalysis,
} from '../models/flaky-test-analysis.model';
import type {
  IntelligenceQualitySignal,
  IntelligenceSummary,
} from '../models/intelligence-summary.model';
import type { QaOrchestrationResult } from '../models/qa-orchestration.model';

interface NexusExecutionReport {
  schemaVersion: string;
  generatedAt: string;
  totalTests: number;
  totals: {
    passed: number;
    failed: number;
    skipped: number;
    timedOut: number;
    interrupted: number;
  };
}

interface FlakinessAnalysisReport {
  schemaVersion: string;
  generatedAt: string;
  sourceHistory: string;
  totalHistoricalExecutions: number;
  eligibleExecutions: number;
  excludedExecutions: number;
  totalGroups: number;
  classifications: Record<string, number>;
  analyses: FlakyTestAnalysis[];
  crossBrowserAnalyses: CrossBrowserFlakinessAnalysis[];
}

interface ReliabilityTrendReport {
  schemaVersion: string;
  generatedAt: string;
  sourceHistory: string;
  recentWindowSize: number;
  totalGroups: number;
  improving: number;
  stable: number;
  degrading: number;
  insufficientHistory: number;
}

interface EnvironmentCorrelationReport {
  schemaVersion: string;
  generatedAt: string;
  sourceHistory: string;
  totalGroups: number;
  consistent: number;
  localEnvironmentSensitive: number;
  ciEnvironmentSensitive: number;
  insufficientHistory: number;
}

interface QaOrchestrationReport {
  schemaVersion: string;
  generatedAt: string;
  sourceFailureAnalysis: string;
  sourceFlakinessAnalysis: string;
  totalDecisions: number;
  decisionTotals: Record<string, number>;
  results: QaOrchestrationResult[];
}

interface AiAnalysisReport {
  schemaVersion: string;
  generatedAt: string;
  sourceOrchestration: string;
  provider: string;
  enabled: boolean;
  totalAnalyses: number;
  analyses: AiInvestigationAnalysis[];
}

export interface IntelligenceSummaryContext {
  runId: string;
  runType: string;
  source: string;
  scope: string;
}

export interface IntelligenceSummaryServiceResult {
  summary: IntelligenceSummary;
  jsonFile: string;
  markdownFile: string;
}

function readJson<T>(file: string, description: string): T {
  if (!fs.existsSync(file)) {
    throw new Error(`${description} not found: ${file}`);
  }

  return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
}

function validateSchema(schemaVersion: string, description: string): void {
  if (schemaVersion !== '1.0') {
    throw new Error(`Unsupported ${description} schema: ${schemaVersion}`);
  }
}

function determineQualitySignal(
  executionReport: NexusExecutionReport,
  flakinessReport: FlakinessAnalysisReport,
  orchestrationReport: QaOrchestrationReport,
): IntelligenceQualitySignal {
  const executionFailed =
    executionReport.totals.failed > 0 ||
    executionReport.totals.timedOut > 0 ||
    executionReport.totals.interrupted > 0;

  const criticalEscalation = orchestrationReport.results.some(
    (result) => result.priority === 'critical',
  );

  if (executionFailed || criticalEscalation) {
    return 'RED';
  }

  const intermittentTests = flakinessReport.classifications['INTERMITTENT'] ?? 0;

  const humanReviewRequired = orchestrationReport.results.some(
    (result) => result.requiresHumanReview,
  );

  if (intermittentTests > 0 || humanReviewRequired) {
    return 'AMBER';
  }

  return 'GREEN';
}

function createMarkdown(summary: IntelligenceSummary): string {
  const lines = [
    '# AgenticQA Intelligence Summary',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Execution',
    '',
    `- Run ID: ${summary.execution.runId}`,
    `- Run type: ${summary.execution.runType}`,
    `- Source: ${summary.execution.source}`,
    `- Scope: ${summary.execution.scope}`,
    `- Total tests: ${summary.execution.totalTests}`,
    `- Passed: ${summary.execution.passed}`,
    `- Failed: ${summary.execution.failed}`,
    `- Skipped: ${summary.execution.skipped}`,
    `- Timed out: ${summary.execution.timedOut}`,
    `- Interrupted: ${summary.execution.interrupted}`,
    '',
    '## Reliability',
    '',
    `- Historical executions: ${summary.reliability.historicalExecutions}`,
    `- Eligible executions: ${summary.reliability.eligibleExecutions}`,
    `- Excluded executions: ${summary.reliability.excludedExecutions}`,
    `- Analyzed groups: ${summary.reliability.analyzedGroups}`,
    `- Cross-browser tests: ${summary.reliability.crossBrowserTests}`,
    `- Intermittent tests: ${summary.reliability.intermittentTests}`,
    `- Consistently failing tests: ${summary.reliability.consistentlyFailingTests}`,
    '',
    '## Reliability Trends',
    '',
    `- Recent window size: ${summary.trends.recentWindowSize}`,
    `- Groups analyzed: ${summary.trends.totalGroups}`,
    `- Improving: ${summary.trends.improving}`,
    `- Stable: ${summary.trends.stable}`,
    `- Degrading: ${summary.trends.degrading}`,
    `- Insufficient history: ${summary.trends.insufficientHistory}`,
    '',
    '## Environment Correlation',
    '',
    `- Groups analyzed: ${summary.environmentCorrelation.totalGroups}`,
    `- Consistent: ${summary.environmentCorrelation.consistent}`,
    `- Local environment sensitive: ${summary.environmentCorrelation.localEnvironmentSensitive}`,
    `- CI environment sensitive: ${summary.environmentCorrelation.ciEnvironmentSensitive}`,
    `- Insufficient history: ${summary.environmentCorrelation.insufficientHistory}`,
    '',
    '## QA Decisions',
    '',
    `- Total decisions: ${summary.decisions.totalDecisions}`,
    `- Human reviews required: ${summary.decisions.humanReviewsRequired}`,
    `- Escalations: ${summary.decisions.escalations}`,
    '',
    '## AI',
    '',
    `- Provider: ${summary.ai.provider}`,
    `- Enabled: ${summary.ai.enabled}`,
    `- Analyses: ${summary.ai.totalAnalyses}`,
    `- Autonomous changes allowed: ${summary.ai.autonomousChangesAllowed}`,
    '',
    '## Overall Quality Signal',
    '',
    `**${summary.qualitySignal}**`,
    '',
  ];

  return lines.join('\n');
}

export class IntelligenceSummaryService {
  generate(
    executionReportFile: string,
    flakinessReportFile: string,
    reliabilityTrendFile: string,
    environmentCorrelationFile: string,
    orchestrationReportFile: string,
    aiReportFile: string,
    jsonFile: string,
    markdownFile: string,
    context: IntelligenceSummaryContext,
  ): IntelligenceSummaryServiceResult {
    const executionReport = readJson<NexusExecutionReport>(
      executionReportFile,
      'Nexus intelligence report',
    );

    const flakinessReport = readJson<FlakinessAnalysisReport>(
      flakinessReportFile,
      'Flakiness analysis report',
    );

    const reliabilityTrendReport = readJson<ReliabilityTrendReport>(
      reliabilityTrendFile,
      'Reliability trend report',
    );

    const environmentCorrelationReport = readJson<EnvironmentCorrelationReport>(
      environmentCorrelationFile,
      'Environment correlation report',
    );

    const orchestrationReport = readJson<QaOrchestrationReport>(
      orchestrationReportFile,
      'QA orchestration report',
    );

    const aiReport = readJson<AiAnalysisReport>(aiReportFile, 'AI analysis report');

    validateSchema(executionReport.schemaVersion, 'Nexus intelligence');

    validateSchema(flakinessReport.schemaVersion, 'flakiness analysis');

    validateSchema(reliabilityTrendReport.schemaVersion, 'reliability trend');

    validateSchema(environmentCorrelationReport.schemaVersion, 'environment correlation');

    validateSchema(orchestrationReport.schemaVersion, 'QA orchestration');

    validateSchema(aiReport.schemaVersion, 'AI analysis');

    const humanReviewsRequired = orchestrationReport.results.filter(
      (result) => result.requiresHumanReview,
    ).length;

    const escalations = orchestrationReport.results.filter(
      (result) => result.priority === 'critical',
    ).length;

    const summary: IntelligenceSummary = {
      schemaVersion: '1.0',

      generatedAt: new Date().toISOString(),

      execution: {
        runId: context.runId,
        runType: context.runType,
        source: context.source,
        scope: context.scope,

        totalTests: executionReport.totalTests,

        passed: executionReport.totals.passed,

        failed: executionReport.totals.failed,

        skipped: executionReport.totals.skipped,

        timedOut: executionReport.totals.timedOut,

        interrupted: executionReport.totals.interrupted,
      },

      reliability: {
        historicalExecutions: flakinessReport.totalHistoricalExecutions,

        eligibleExecutions: flakinessReport.eligibleExecutions,

        excludedExecutions: flakinessReport.excludedExecutions,

        analyzedGroups: flakinessReport.totalGroups,

        crossBrowserTests: flakinessReport.crossBrowserAnalyses.length,

        intermittentTests: flakinessReport.classifications['INTERMITTENT'] ?? 0,

        consistentlyFailingTests: flakinessReport.classifications['CONSISTENTLY_FAILING'] ?? 0,
      },

      trends: {
        recentWindowSize: reliabilityTrendReport.recentWindowSize,

        totalGroups: reliabilityTrendReport.totalGroups,

        improving: reliabilityTrendReport.improving,

        stable: reliabilityTrendReport.stable,

        degrading: reliabilityTrendReport.degrading,

        insufficientHistory: reliabilityTrendReport.insufficientHistory,
      },

      environmentCorrelation: {
        totalGroups: environmentCorrelationReport.totalGroups,

        consistent: environmentCorrelationReport.consistent,

        localEnvironmentSensitive: environmentCorrelationReport.localEnvironmentSensitive,

        ciEnvironmentSensitive: environmentCorrelationReport.ciEnvironmentSensitive,

        insufficientHistory: environmentCorrelationReport.insufficientHistory,
      },

      decisions: {
        totalDecisions: orchestrationReport.totalDecisions,

        humanReviewsRequired,

        escalations,
      },

      ai: {
        provider: aiReport.provider,
        enabled: aiReport.enabled,

        totalAnalyses: aiReport.totalAnalyses,

        autonomousChangesAllowed: false,
      },

      /*
       * Environment correlation remains
       * diagnostic in v1.0 and does not
       * modify the quality signal.
       */
      qualitySignal: determineQualitySignal(executionReport, flakinessReport, orchestrationReport),
    };

    fs.mkdirSync(path.dirname(jsonFile), {
      recursive: true,
    });

    fs.mkdirSync(path.dirname(markdownFile), {
      recursive: true,
    });

    fs.writeFileSync(jsonFile, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

    fs.writeFileSync(markdownFile, createMarkdown(summary), 'utf8');

    return {
      summary,
      jsonFile,
      markdownFile,
    };
  }
}

export const intelligenceSummaryService = new IntelligenceSummaryService();
