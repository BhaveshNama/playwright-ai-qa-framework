import type { AiProviderName } from './ai-provider.interface';

export type AiAnalysisStatus = 'DISABLED' | 'COMPLETED' | 'FAILED';

export interface AiInvestigationAnalysis {
  schemaVersion: '1.0';
  generatedAt: string;

  provider: AiProviderName;
  status: AiAnalysisStatus;

  testId: string;
  testTitle: string;
  project: string;

  deterministicDecision: string;
  deterministicConfidence: 'high' | 'medium' | 'low';

  aiSummary: string;
  hypotheses: string[];
  recommendedInvestigations: string[];

  aiConfidence: 'high' | 'medium' | 'low';

  guardrails: {
    advisoryOnly: true;
    autonomousCodeModificationAllowed: false;
    autonomousRetryModificationAllowed: false;
    autonomousTimeoutModificationAllowed: false;
    humanApprovalRequired: true;
  };

  requiresHumanReview: true;
}
