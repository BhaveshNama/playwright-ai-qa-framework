export type ReliabilityTrendDirection =
  'IMPROVING' | 'STABLE' | 'DEGRADING' | 'INSUFFICIENT_HISTORY';

export interface ReliabilityWindowMetrics {
  executions: number;
  passed: number;
  failed: number;
  timedOut: number;

  passRate: number;
  failureRate: number;
  timeoutRate: number;

  averageDurationMs: number;
}

export interface ReliabilityTrendAnalysis {
  testId: string;
  testTitle: string;
  project: string;

  historical: ReliabilityWindowMetrics;
  recent: ReliabilityWindowMetrics;

  passRateChange: number;
  failureRateChange: number;
  durationChangePercent: number;

  direction: ReliabilityTrendDirection;
}

export interface ReliabilityTrendReport {
  schemaVersion: '1.0';
  generatedAt: string;

  sourceHistory: string;

  recentWindowSize: number;
  totalGroups: number;

  improving: number;
  stable: number;
  degrading: number;
  insufficientHistory: number;

  analyses: ReliabilityTrendAnalysis[];
}
