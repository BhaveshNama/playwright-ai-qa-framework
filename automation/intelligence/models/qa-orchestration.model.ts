import type { FailureAnalysis } from './failure-analysis.model';
import type {
  CrossBrowserFlakinessAnalysis,
  FlakyTestAnalysis,
  FlakyTestConfidence,
} from './flaky-test-analysis.model';

export type QaOrchestrationDecision =
  | 'MONITOR'
  | 'COLLECT_MORE_EVIDENCE'
  | 'INVESTIGATE_AUTOMATION'
  | 'INVESTIGATE_BROWSER_SPECIFIC'
  | 'INVESTIGATE_PRODUCT'
  | 'HUMAN_REVIEW';

export type QaOrchestrationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface QaOrchestrationInput {
  failureAnalysis: FailureAnalysis;
  historicalAnalysis?: FlakyTestAnalysis;
  crossBrowserAnalysis?: CrossBrowserFlakinessAnalysis;
}

export interface QaOrchestrationGuardrails {
  autonomousCodeModificationAllowed: false;
  autonomousRetryConfigurationAllowed: false;
  autonomousTimeoutModificationAllowed: false;
  humanApprovalRequired: boolean;
}

export interface QaOrchestrationResult {
  testId: string;
  testTitle: string;
  project: string;

  decision: QaOrchestrationDecision;
  priority: QaOrchestrationPriority;
  confidence: FlakyTestConfidence;

  summary: string;
  rationale: string[];

  recommendedActions: string[];

  signals: {
    failureCategory: FailureAnalysis['category'];
    failureLayer: FailureAnalysis['layer'];
    historicalClassification?: FlakyTestAnalysis['classification'];
    crossBrowserClassification?: CrossBrowserFlakinessAnalysis['classification'];
  };

  guardrails: QaOrchestrationGuardrails;
  requiresHumanReview: boolean;
}
