import fs from 'node:fs';
import path from 'node:path';

import type { AiInvestigationAnalysis } from '../ai/ai-analysis.model';
import { createAiProvider } from '../ai/ai-provider.factory';
import type { QaOrchestrationResult } from '../models/qa-orchestration.model';

interface QaOrchestrationReport {
  schemaVersion: string;
  generatedAt: string;
  sourceFailureAnalysis: string;
  sourceFlakinessAnalysis: string;
  totalDecisions: number;
  decisionTotals: Record<string, number>;
  results: QaOrchestrationResult[];
}

export interface AiAnalysisReport {
  schemaVersion: '1.0';
  generatedAt: string;
  sourceOrchestration: string;
  provider: string;
  enabled: boolean;
  totalAnalyses: number;
  analyses: AiInvestigationAnalysis[];
}

export interface AiAnalysisServiceResult {
  report: AiAnalysisReport;
  outputFile: string;
}

export class AiAnalysisService {
  async analyze(
    orchestrationFile: string,
    outputFile: string,
    providerName?: string,
  ): Promise<AiAnalysisServiceResult> {
    if (!fs.existsSync(orchestrationFile)) {
      throw new Error(`QA orchestration report not found: ${orchestrationFile}`);
    }

    const orchestrationReport = JSON.parse(
      fs.readFileSync(orchestrationFile, 'utf8'),
    ) as QaOrchestrationReport;

    if (orchestrationReport.schemaVersion !== '1.0') {
      throw new Error(`Unsupported QA orchestration schema: ${orchestrationReport.schemaVersion}`);
    }

    const provider = createAiProvider(providerName ?? process.env.AI_PROVIDER);

    const analyses: AiInvestigationAnalysis[] = [];

    for (const orchestration of orchestrationReport.results) {
      const evidence = [...orchestration.rationale, ...orchestration.recommendedActions];

      const response = await provider.analyze({
        orchestration,
        evidence,
      });

      analyses.push({
        schemaVersion: '1.0',
        generatedAt: new Date().toISOString(),

        provider: response.provider,
        status: response.enabled ? 'COMPLETED' : 'DISABLED',

        testId: orchestration.testId,
        testTitle: orchestration.testTitle,
        project: orchestration.project,

        deterministicDecision: orchestration.decision,

        deterministicConfidence: orchestration.confidence,

        aiSummary: response.summary,
        hypotheses: response.hypotheses,

        recommendedInvestigations: response.recommendedInvestigations,

        aiConfidence: response.confidence,

        guardrails: {
          advisoryOnly: true,
          autonomousCodeModificationAllowed: false,
          autonomousRetryModificationAllowed: false,
          autonomousTimeoutModificationAllowed: false,
          humanApprovalRequired: true,
        },

        requiresHumanReview: true,
      });
    }

    const report: AiAnalysisReport = {
      schemaVersion: '1.0',
      generatedAt: new Date().toISOString(),

      sourceOrchestration: path.relative(process.cwd(), orchestrationFile),

      provider: provider.name,
      enabled: provider.enabled,
      totalAnalyses: analyses.length,
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

export const aiAnalysisService = new AiAnalysisService();
