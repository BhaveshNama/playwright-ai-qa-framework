import type { QaOrchestrationResult } from '../models/qa-orchestration.model';

export type AiProviderName = 'disabled' | 'azure-openai' | 'openai' | 'anthropic';

export interface AiAnalysisRequest {
  orchestration: QaOrchestrationResult;
  evidence: string[];
}

export interface AiAnalysisResponse {
  provider: AiProviderName;
  enabled: boolean;
  summary: string;
  hypotheses: string[];
  recommendedInvestigations: string[];
  confidence: 'high' | 'medium' | 'low';
  requiresHumanReview: true;
}

export interface AiProvider {
  readonly name: AiProviderName;
  readonly enabled: boolean;

  analyze(request: AiAnalysisRequest): Promise<AiAnalysisResponse>;
}
