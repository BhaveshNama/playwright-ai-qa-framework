export type EnvironmentCorrelationClassification =
  | 'CONSISTENT'
  | 'LOCAL_ENVIRONMENT_SENSITIVE'
  | 'CI_ENVIRONMENT_SENSITIVE'
  | 'INSUFFICIENT_HISTORY';

export interface EnvironmentReliabilityMetrics {
  executions: number;
  passed: number;
  nonPassing: number;
  passRate: number;
  failureRate: number;
  averageDurationMs: number;
}

export interface EnvironmentCorrelationAnalysis {
  testId: string;
  testTitle: string;
  project: string;

  local: EnvironmentReliabilityMetrics;
  ci: EnvironmentReliabilityMetrics;

  passRateDifference: number;
  durationDifferencePercent: number;

  classification: EnvironmentCorrelationClassification;
}

export interface EnvironmentCorrelationReport {
  schemaVersion: '1.0';
  generatedAt: string;

  sourceHistory: string;

  totalGroups: number;

  consistent: number;
  localEnvironmentSensitive: number;
  ciEnvironmentSensitive: number;
  insufficientHistory: number;

  analyses: EnvironmentCorrelationAnalysis[];
}
