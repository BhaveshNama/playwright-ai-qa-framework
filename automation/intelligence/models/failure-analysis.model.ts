export type FailureLayer = 'framework' | 'api' | 'ui' | 'unknown';

export type FailureCategory =
  'assertion' | 'timeout' | 'locator' | 'navigation' | 'network' | 'application' | 'unknown';

export type FailureConfidence = 'high' | 'medium' | 'low';

export interface FailureEvidence {
  testId: string;
  title: string;
  file: string;
  project: string;
  tags: string[];
  durationMs: number;
  retry: number;
  errorMessage?: string;
  errorStack?: string;
  attachments: {
    name: string;
    contentType: string;
    path?: string;
  }[];
}

export interface FailureAnalysis {
  testId: string;
  testTitle: string;
  layer: FailureLayer;
  category: FailureCategory;
  confidence: FailureConfidence;
  summary: string;
  probableCause: string;
  recommendations: string[];
  evidence: string[];
  requiresHumanReview: boolean;
}
