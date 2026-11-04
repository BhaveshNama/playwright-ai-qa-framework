import fs from 'node:fs';
import path from 'node:path';

import { flakyTestDetectionAgent } from '../agents/flaky-test-detection.agent';
import type { ExecutionHistory, HistoricalTestExecution } from '../models/execution-history.model';
import type {
  CrossBrowserFlakinessAnalysis,
  FlakyTestAnalysis,
} from '../models/flaky-test-analysis.model';

export interface FlakinessAnalysisReport {
  schemaVersion: '1.0';
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

export interface FlakinessAnalysisServiceResult {
  report: FlakinessAnalysisReport;
  outputFile: string;
}

const browserProjects = new Set(['chromium', 'firefox', 'webkit']);

function isEligibleForFlakinessAnalysis(execution: HistoricalTestExecution): boolean {
  /*
   * Legacy execution evidence predates segmentation.
   *
   * Preserve legacy browser observations temporarily so
   * historical browser intelligence is not lost.
   */
  if (execution.runType === undefined && browserProjects.has(execution.project)) {
    return true;
  }

  /*
   * Framework and API validation runs are not browser
   * reliability observations.
   */
  if (execution.runType === 'framework' || execution.runType === 'api') {
    return false;
  }

  /*
   * Explicit browser and targeted executions are valid
   * historical reliability evidence when they correspond
   * to a real browser project.
   */
  if (execution.runType === 'browser' || execution.runType === 'targeted') {
    return browserProjects.has(execution.project);
  }

  /*
   * Full regression runs contain framework, API and browser
   * executions. Only retain the real browser observations.
   */
  if (execution.runType === 'full-regression') {
    return browserProjects.has(execution.project);
  }

  /*
   * Unknown segmented executions should not influence
   * flakiness classification.
   */
  return false;
}

export class FlakinessAnalysisService {
  analyze(historyFile: string, outputFile: string): FlakinessAnalysisServiceResult {
    if (!fs.existsSync(historyFile)) {
      throw new Error(`Execution history not found: ${historyFile}`);
    }

    const history = JSON.parse(fs.readFileSync(historyFile, 'utf8')) as ExecutionHistory;

    if (history.schemaVersion !== '1.0') {
      throw new Error(`Unsupported execution history schema: ${history.schemaVersion}`);
    }

    const eligibleExecutions = history.executions.filter(isEligibleForFlakinessAnalysis);

    const excludedExecutions = history.executions.length - eligibleExecutions.length;

    const groupedExecutions = new Map<string, HistoricalTestExecution[]>();

    for (const execution of eligibleExecutions) {
      const key = `${execution.testId}::${execution.project}`;

      const existing = groupedExecutions.get(key) ?? [];

      existing.push(execution);

      groupedExecutions.set(key, existing);
    }

    const analyses = Array.from(groupedExecutions.values()).map((executions) =>
      flakyTestDetectionAgent.analyze(executions),
    );

    const classifications = analyses.reduce<Record<string, number>>((totals, analysis) => {
      totals[analysis.classification] = (totals[analysis.classification] ?? 0) + 1;

      return totals;
    }, {});

    const browserAnalysesByTitle = new Map<string, FlakyTestAnalysis[]>();

    for (const analysis of analyses) {
      if (!browserProjects.has(analysis.project)) {
        continue;
      }

      const existing = browserAnalysesByTitle.get(analysis.testTitle) ?? [];

      existing.push(analysis);

      browserAnalysesByTitle.set(analysis.testTitle, existing);
    }

    const crossBrowserAnalyses = Array.from(browserAnalysesByTitle.values())
      .filter((projectAnalyses) => projectAnalyses.length > 1)
      .map((projectAnalyses) => flakyTestDetectionAgent.analyzeAcrossProjects(projectAnalyses));

    const report: FlakinessAnalysisReport = {
      schemaVersion: '1.0',
      generatedAt: new Date().toISOString(),

      sourceHistory: path.relative(process.cwd(), historyFile),

      totalHistoricalExecutions: history.executions.length,

      eligibleExecutions: eligibleExecutions.length,

      excludedExecutions,

      totalGroups: analyses.length,
      classifications,
      analyses,
      crossBrowserAnalyses,
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

export const flakinessAnalysisService = new FlakinessAnalysisService();
