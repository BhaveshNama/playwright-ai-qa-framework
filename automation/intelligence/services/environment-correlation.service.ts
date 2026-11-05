import fs from 'node:fs';
import path from 'node:path';

import type { ExecutionHistory, HistoricalTestExecution } from '../models/execution-history.model';

import type {
  EnvironmentCorrelationAnalysis,
  EnvironmentCorrelationClassification,
  EnvironmentCorrelationReport,
  EnvironmentReliabilityMetrics,
} from '../models/environment-correlation.model';

const MINIMUM_ENVIRONMENT_EXECUTIONS = 2;
const PASS_RATE_DIFFERENCE_THRESHOLD = 0.25;

export interface EnvironmentCorrelationServiceResult {
  report: EnvironmentCorrelationReport;
  outputFile: string;
}

function calculateMetrics(executions: HistoricalTestExecution[]): EnvironmentReliabilityMetrics {
  if (executions.length === 0) {
    return {
      executions: 0,
      passed: 0,
      nonPassing: 0,
      passRate: 0,
      failureRate: 0,
      averageDurationMs: 0,
    };
  }

  const passed = executions.filter((execution) => execution.status === 'passed').length;

  const nonPassing = executions.length - passed;

  const totalDuration = executions.reduce((sum, execution) => sum + execution.durationMs, 0);

  return {
    executions: executions.length,
    passed,
    nonPassing,
    passRate: passed / executions.length,
    failureRate: nonPassing / executions.length,
    averageDurationMs: totalDuration / executions.length,
  };
}

function calculateDurationDifferencePercent(localDuration: number, ciDuration: number): number {
  if (ciDuration === 0) {
    return 0;
  }

  return ((localDuration - ciDuration) / ciDuration) * 100;
}

function determineClassification(
  local: EnvironmentReliabilityMetrics,
  ci: EnvironmentReliabilityMetrics,
): EnvironmentCorrelationClassification {
  if (
    local.executions < MINIMUM_ENVIRONMENT_EXECUTIONS ||
    ci.executions < MINIMUM_ENVIRONMENT_EXECUTIONS
  ) {
    return 'INSUFFICIENT_HISTORY';
  }

  const passRateDifference = local.passRate - ci.passRate;

  if (passRateDifference <= -PASS_RATE_DIFFERENCE_THRESHOLD) {
    return 'LOCAL_ENVIRONMENT_SENSITIVE';
  }

  if (passRateDifference >= PASS_RATE_DIFFERENCE_THRESHOLD) {
    return 'CI_ENVIRONMENT_SENSITIVE';
  }

  return 'CONSISTENT';
}

function groupExecutions(
  executions: HistoricalTestExecution[],
): Map<string, HistoricalTestExecution[]> {
  const groups = new Map<string, HistoricalTestExecution[]>();

  for (const execution of executions) {
    const key = `${execution.testId}::${execution.project}`;

    const existing = groups.get(key) ?? [];

    existing.push(execution);
    groups.set(key, existing);
  }

  return groups;
}

export class EnvironmentCorrelationService {
  analyze(historyFile: string, outputFile: string): EnvironmentCorrelationServiceResult {
    if (!fs.existsSync(historyFile)) {
      throw new Error(`Execution history not found: ${historyFile}`);
    }

    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8')) as ExecutionHistory;

    if (history.schemaVersion !== '1.0') {
      throw new Error(`Unsupported execution history schema: ${history.schemaVersion}`);
    }

    const groups = groupExecutions(history.executions);

    const analyses: EnvironmentCorrelationAnalysis[] = [];

    for (const executions of groups.values()) {
      const localExecutions = executions.filter((execution) => execution.runSource === 'local');

      const ciExecutions = executions.filter((execution) => execution.runSource === 'ci');

      const local = calculateMetrics(localExecutions);

      const ci = calculateMetrics(ciExecutions);

      const classification = determineClassification(local, ci);

      const latest = executions[executions.length - 1];

      analyses.push({
        testId: latest.testId,
        testTitle: latest.title,
        project: latest.project,

        local,
        ci,

        passRateDifference: local.passRate - ci.passRate,

        durationDifferencePercent: calculateDurationDifferencePercent(
          local.averageDurationMs,
          ci.averageDurationMs,
        ),

        classification,
      });
    }

    analyses.sort((left, right) => {
      const titleComparison = left.testTitle.localeCompare(right.testTitle);

      if (titleComparison !== 0) {
        return titleComparison;
      }

      return left.project.localeCompare(right.project);
    });

    const report: EnvironmentCorrelationReport = {
      schemaVersion: '1.0',

      generatedAt: new Date().toISOString(),

      sourceHistory: path.relative(process.cwd(), historyFile),

      totalGroups: analyses.length,

      consistent: analyses.filter((analysis) => analysis.classification === 'CONSISTENT').length,

      localEnvironmentSensitive: analyses.filter(
        (analysis) => analysis.classification === 'LOCAL_ENVIRONMENT_SENSITIVE',
      ).length,

      ciEnvironmentSensitive: analyses.filter(
        (analysis) => analysis.classification === 'CI_ENVIRONMENT_SENSITIVE',
      ).length,

      insufficientHistory: analyses.filter(
        (analysis) => analysis.classification === 'INSUFFICIENT_HISTORY',
      ).length,

      analyses,
    };

    fs.mkdirSync(path.dirname(outputFile), {
      recursive: true,
    });

    fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    return {
      report,
      outputFile,
    };
  }
}

export const environmentCorrelationService = new EnvironmentCorrelationService();
