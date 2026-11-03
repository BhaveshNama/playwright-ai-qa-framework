export type FlakyTestClassification =
  'INSUFFICIENT_HISTORY' | 'STABLE' | 'INTERMITTENT' | 'CONSISTENTLY_FAILING';

export type FlakyTestConfidence = 'high' | 'medium' | 'low';

export interface FlakyTestAnalysis {
  testId: string;
  testTitle: string;
  project: string;
  classification: FlakyTestClassification;
  confidence: FlakyTestConfidence;
  totalExecutions: number;
  passedExecutions: number;
  failedExecutions: number;
  failureRate: number;
  averageDurationMs: number;
  recommendation: string;
  requiresHumanReview: boolean;
}

export type CrossBrowserClassification =
  | 'INSUFFICIENT_HISTORY'
  | 'CROSS_BROWSER_STABLE'
  | 'BROWSER_SPECIFIC_INTERMITTENT'
  | 'CROSS_BROWSER_INTERMITTENT'
  | 'BROWSER_SPECIFIC_FAILURE'
  | 'CROSS_BROWSER_FAILURE';

export interface CrossBrowserFlakinessAnalysis {
  testTitle: string;
  classification: CrossBrowserClassification;
  affectedProjects: string[];
  stableProjects: string[];
  confidence: FlakyTestConfidence;
  recommendation: string;
  requiresHumanReview: boolean;
}
