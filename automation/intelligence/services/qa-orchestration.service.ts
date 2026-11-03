import fs from 'node:fs';
import path from 'node:path';

import type { FailureAnalysis } from '../models/failure-analysis.model';
import type {
  CrossBrowserFlakinessAnalysis,
  FlakyTestAnalysis,
} from '../models/flaky-test-analysis.model';
import type { QaOrchestrationResult } from '../models/qa-orchestration.model';
import { qaOrchestrator } from '../orchestrators/qa.orchestrator';

interface FailureAnalysisReport {
  schemaVersion: string;
  generatedAt: string;
  sourceReport: string;
  totalFailures: number;
  analyses: FailureAnalysis[];
}

interface FlakinessAnalysisReport {
  schemaVersion: string;
  generatedAt: string;
  sourceHistory: string;
  totalGroups: number;
  classifications: Record<string, number>;
  analyses: FlakyTestAnalysis[];
  crossBrowserAnalyses: CrossBrowserFlakinessAnalysis[];
}

export interface QaOrchestrationReport {
  schemaVersion: '1.0';
  generatedAt: string;
  sourceFailureAnalysis: string;
  sourceFlakinessAnalysis: string;
  totalDecisions: number;
  decisionTotals: Record<string, number>;
  results: QaOrchestrationResult[];
}

export interface QaOrchestrationServiceResult {
  report: QaOrchestrationReport;
  outputFile: string;
}

export class QaOrchestrationService {
  orchestrate(
    failureAnalysisFile: string,
    flakinessAnalysisFile: string,
    outputFile: string,
  ): QaOrchestrationServiceResult {
    if (!fs.existsSync(failureAnalysisFile)) {
      throw new Error(`Failure analysis report not found: ${failureAnalysisFile}`);
    }

    if (!fs.existsSync(flakinessAnalysisFile)) {
      throw new Error(`Flakiness analysis report not found: ${flakinessAnalysisFile}`);
    }

    const failureReport = JSON.parse(
      fs.readFileSync(failureAnalysisFile, 'utf8'),
    ) as FailureAnalysisReport;

    const flakinessReport = JSON.parse(
      fs.readFileSync(flakinessAnalysisFile, 'utf8'),
    ) as FlakinessAnalysisReport;

    if (failureReport.schemaVersion !== '1.0') {
      throw new Error(`Unsupported failure analysis schema: ${failureReport.schemaVersion}`);
    }

    if (flakinessReport.schemaVersion !== '1.0') {
      throw new Error(`Unsupported flakiness analysis schema: ${flakinessReport.schemaVersion}`);
    }

    const historicalAnalysisByTestAndProject = new Map<string, FlakyTestAnalysis>();

    for (const analysis of flakinessReport.analyses) {
      const key = `${analysis.testTitle}::${analysis.project}`;

      historicalAnalysisByTestAndProject.set(key, analysis);
    }

    const crossBrowserAnalysisByTest = new Map<string, CrossBrowserFlakinessAnalysis>();

    for (const analysis of flakinessReport.crossBrowserAnalyses) {
      crossBrowserAnalysisByTest.set(analysis.testTitle, analysis);
    }

    const results = failureReport.analyses.map((failureAnalysis) => {
      const projectEvidence = failureAnalysis.evidence.find((item) => item.startsWith('Project: '));

      const project = projectEvidence ? projectEvidence.replace('Project: ', '') : 'unknown';

      const historicalKey = `${failureAnalysis.testTitle}::${project}`;

      const historicalAnalysis = historicalAnalysisByTestAndProject.get(historicalKey);

      const crossBrowserAnalysis = crossBrowserAnalysisByTest.get(failureAnalysis.testTitle);

      return qaOrchestrator.orchestrate({
        failureAnalysis,
        historicalAnalysis,
        crossBrowserAnalysis,
      });
    });

    const decisionTotals = results.reduce<Record<string, number>>((totals, result) => {
      totals[result.decision] = (totals[result.decision] ?? 0) + 1;

      return totals;
    }, {});

    const report: QaOrchestrationReport = {
      schemaVersion: '1.0',
      generatedAt: new Date().toISOString(),

      sourceFailureAnalysis: path.relative(process.cwd(), failureAnalysisFile),

      sourceFlakinessAnalysis: path.relative(process.cwd(), flakinessAnalysisFile),

      totalDecisions: results.length,
      decisionTotals,
      results,
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

export const qaOrchestrationService = new QaOrchestrationService();
