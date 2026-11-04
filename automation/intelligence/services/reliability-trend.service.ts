import fs from 'node:fs';
import path from 'node:path';

import type { ExecutionHistory, HistoricalTestExecution } from '../models/execution-history.model';

import type {
  ReliabilityTrendAnalysis,
  ReliabilityTrendDirection,
  ReliabilityTrendReport,
  ReliabilityWindowMetrics,
} from '../models/reliability-trend.model';

const DEFAULT_RECENT_WINDOW_SIZE = 5;

const FAILURE_RATE_CHANGE_THRESHOLD = 0.2;
const DURATION_CHANGE_THRESHOLD_PERCENT = 25;

export interface ReliabilityTrendServiceResult {
  report: ReliabilityTrendReport;
  outputFile: string;
}

function calculateMetrics(executions: HistoricalTestExecution[]): ReliabilityWindowMetrics {
  const total = executions.length;

  if (total === 0) {
    return {
      executions: 0,
      passed: 0,
      failed: 0,
      timedOut: 0,
      passRate: 0,
      failureRate: 0,
      timeoutRate: 0,
      averageDurationMs: 0,
    };
  }

  const passed = executions.filter((execution) => execution.status === 'passed').length;

  const failed = executions.filter((execution) => execution.status === 'failed').length;

  const timedOut = executions.filter((execution) => execution.status === 'timedOut').length;

  const nonPassing = total - passed;

  const totalDuration = executions.reduce((sum, execution) => sum + execution.durationMs, 0);

  return {
    executions: total,
    passed,
    failed,
    timedOut,

    passRate: passed / total,

    /*
     * failureRate represents all non-passing
     * outcomes, including timeouts, skipped,
     * and interrupted executions.
     */
    failureRate: nonPassing / total,

    timeoutRate: timedOut / total,

    averageDurationMs: totalDuration / total,
  };
}

function calculateDurationChangePercent(
  historicalDuration: number,
  recentDuration: number,
): number {
  if (historicalDuration === 0) {
    return 0;
  }

  return ((recentDuration - historicalDuration) / historicalDuration) * 100;
}

function determineDirection(
  historical: ReliabilityWindowMetrics,
  recent: ReliabilityWindowMetrics,
): ReliabilityTrendDirection {
  if (historical.executions === 0 || recent.executions === 0) {
    return 'INSUFFICIENT_HISTORY';
  }

  const failureRateChange = recent.failureRate - historical.failureRate;

  const durationChangePercent = calculateDurationChangePercent(
    historical.averageDurationMs,
    recent.averageDurationMs,
  );

  if (
    failureRateChange >= FAILURE_RATE_CHANGE_THRESHOLD ||
    durationChangePercent >= DURATION_CHANGE_THRESHOLD_PERCENT
  ) {
    return 'DEGRADING';
  }

  if (
    failureRateChange <= -FAILURE_RATE_CHANGE_THRESHOLD ||
    durationChangePercent <= -DURATION_CHANGE_THRESHOLD_PERCENT
  ) {
    return 'IMPROVING';
  }

  return 'STABLE';
}

function groupExecutions(
  executions: HistoricalTestExecution[],
): Map<string, HistoricalTestExecution[]> {
  const groups = new Map<string, HistoricalTestExecution[]>();

  for (const execution of executions) {
    const key = `${execution.testId}::${execution.project}`;

    const group = groups.get(key) ?? [];

    group.push(execution);

    groups.set(key, group);
  }

  return groups;
}

export class ReliabilityTrendService {
  analyze(
    historyFile: string,
    outputFile: string,
    recentWindowSize = DEFAULT_RECENT_WINDOW_SIZE,
  ): ReliabilityTrendServiceResult {
    if (!fs.existsSync(historyFile)) {
      throw new Error(`Execution history not found: ${historyFile}`);
    }

    if (!Number.isInteger(recentWindowSize) || recentWindowSize <= 0) {
      throw new Error('Recent reliability window size must be a positive integer.');
    }

    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8')) as ExecutionHistory;

    if (history.schemaVersion !== '1.0') {
      throw new Error(`Unsupported execution history schema: ${history.schemaVersion}`);
    }

    const groups = groupExecutions(history.executions);

    const analyses: ReliabilityTrendAnalysis[] = [];

    for (const executions of groups.values()) {
      const ordered = [...executions].sort(
        (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
      );

      const recentStart = Math.max(ordered.length - recentWindowSize, 0);

      const historicalExecutions = ordered.slice(0, recentStart);

      const recentExecutions = ordered.slice(recentStart);

      const historical = calculateMetrics(historicalExecutions);

      const recent = calculateMetrics(recentExecutions);

      const direction = determineDirection(historical, recent);

      const failureRateChange = recent.failureRate - historical.failureRate;

      const passRateChange = recent.passRate - historical.passRate;

      const durationChangePercent = calculateDurationChangePercent(
        historical.averageDurationMs,
        recent.averageDurationMs,
      );

      const latest = ordered[ordered.length - 1];

      analyses.push({
        testId: latest.testId,
        testTitle: latest.title,
        project: latest.project,

        historical,
        recent,

        passRateChange,
        failureRateChange,
        durationChangePercent,

        direction,
      });
    }

    analyses.sort((left, right) => {
      const titleComparison = left.testTitle.localeCompare(right.testTitle);

      if (titleComparison !== 0) {
        return titleComparison;
      }

      return left.project.localeCompare(right.project);
    });

    const report: ReliabilityTrendReport = {
      schemaVersion: '1.0',

      generatedAt: new Date().toISOString(),

      sourceHistory: path.relative(process.cwd(), historyFile),

      recentWindowSize,

      totalGroups: analyses.length,

      improving: analyses.filter((analysis) => analysis.direction === 'IMPROVING').length,

      stable: analyses.filter((analysis) => analysis.direction === 'STABLE').length,

      degrading: analyses.filter((analysis) => analysis.direction === 'DEGRADING').length,

      insufficientHistory: analyses.filter(
        (analysis) => analysis.direction === 'INSUFFICIENT_HISTORY',
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

export const reliabilityTrendService = new ReliabilityTrendService();
