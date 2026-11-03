import fs from 'node:fs';
import path from 'node:path';

import { flakyTestDetectionAgent } from '../agents/flaky-test-detection.agent';
import type { ExecutionHistory } from '../models/execution-history.model';
import type {
  CrossBrowserFlakinessAnalysis,
  FlakyTestAnalysis,
} from '../models/flaky-test-analysis.model';

export interface FlakinessAnalysisReport {
  schemaVersion: '1.0';
  generatedAt: string;
  sourceHistory: string;
  totalGroups: number;
  classifications: Record<string, number>;
  analyses: FlakyTestAnalysis[];
  crossBrowserAnalyses: CrossBrowserFlakinessAnalysis[];
}

export interface FlakinessAnalysisServiceResult {
  report: FlakinessAnalysisReport;
  outputFile: string;
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

    const groupedExecutions = new Map<string, ExecutionHistory['executions']>();

    for (const execution of history.executions) {
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

    const browserProjects = new Set(['chromium', 'firefox', 'webkit']);

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
