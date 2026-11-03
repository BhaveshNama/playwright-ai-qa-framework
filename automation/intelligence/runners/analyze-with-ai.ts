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

interface AiAnalysisReport {
  schemaVersion: '1.0';
  generatedAt: string;
  sourceOrchestration: string;
  provider: string;
  enabled: boolean;
  totalAnalyses: number;
  analyses: AiInvestigationAnalysis[];
}

const intelligenceDirectory = path.resolve(process.cwd(), 'artifacts', 'intelligence');

const orchestrationFile = path.join(intelligenceDirectory, 'qa-orchestration.json');

const outputFile = path.join(intelligenceDirectory, 'ai-analysis.json');

async function main(): Promise<void> {
  if (!fs.existsSync(orchestrationFile)) {
    throw new Error(`QA orchestration report not found: ${orchestrationFile}`);
  }

  const orchestrationReport = JSON.parse(
    fs.readFileSync(orchestrationFile, 'utf8'),
  ) as QaOrchestrationReport;

  if (orchestrationReport.schemaVersion !== '1.0') {
    throw new Error(`Unsupported QA orchestration schema: ${orchestrationReport.schemaVersion}`);
  }

  const provider = createAiProvider(process.env.AI_PROVIDER);

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

  fs.mkdirSync(intelligenceDirectory, {
    recursive: true,
  });

  fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`AgenticQA AI analysis completed with ${analyses.length} analysis result(s).`);

  console.log(`AI provider: ${provider.name} (${provider.enabled ? 'enabled' : 'disabled'})`);

  console.log(`AI analysis written to ${outputFile}`);
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(`AgenticQA AI analysis failed: ${error.message}`);
  } else {
    console.error('AgenticQA AI analysis failed with an unknown error.');
  }

  process.exitCode = 1;
});
