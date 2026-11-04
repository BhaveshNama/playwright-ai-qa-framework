export type IntelligenceQualitySignal = 'GREEN' | 'AMBER' | 'RED';

export interface IntelligenceExecutionSummary {
  runId: string;
  runType: string;
  source: string;
  scope: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  timedOut: number;
  interrupted: number;
}

export interface IntelligenceReliabilitySummary {
  historicalExecutions: number;
  eligibleExecutions: number;
  excludedExecutions: number;
  analyzedGroups: number;
  crossBrowserTests: number;
  intermittentTests: number;
  consistentlyFailingTests: number;
}

export interface IntelligenceDecisionSummary {
  totalDecisions: number;
  humanReviewsRequired: number;
  escalations: number;
}

export interface IntelligenceAiSummary {
  provider: string;
  enabled: boolean;
  totalAnalyses: number;
  autonomousChangesAllowed: boolean;
}

export interface IntelligenceSummary {
  schemaVersion: '1.0';
  generatedAt: string;

  execution: IntelligenceExecutionSummary;
  reliability: IntelligenceReliabilitySummary;
  trends: IntelligenceTrendSummary;
  decisions: IntelligenceDecisionSummary;
  ai: IntelligenceAiSummary;

  qualitySignal: IntelligenceQualitySignal;
}

export interface IntelligenceTrendSummary {
  recentWindowSize: number;
  totalGroups: number;
  improving: number;
  stable: number;
  degrading: number;
  insufficientHistory: number;
}
