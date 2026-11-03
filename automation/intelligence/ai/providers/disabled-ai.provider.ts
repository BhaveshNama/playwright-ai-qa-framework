import type { AiAnalysisRequest, AiAnalysisResponse, AiProvider } from '../ai-provider.interface';

export class DisabledAiProvider implements AiProvider {
  readonly name = 'disabled' as const;
  readonly enabled = false;

  async analyze(request: AiAnalysisRequest): Promise<AiAnalysisResponse> {
    return Promise.resolve({
      provider: this.name,
      enabled: this.enabled,
      summary: 'AI analysis is disabled. Deterministic AgenticQA intelligence remains available.',
      hypotheses: [],
      recommendedInvestigations: request.orchestration.recommendedActions,
      confidence: request.orchestration.confidence,
      requiresHumanReview: true,
    });
  }
}

export const disabledAiProvider = new DisabledAiProvider();
