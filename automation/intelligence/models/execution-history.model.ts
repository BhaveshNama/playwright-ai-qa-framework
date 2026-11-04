export type HistoricalExecutionStatus =
  'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';

export type ExecutionRunType =
  'framework' | 'api' | 'full-regression' | 'targeted' | 'browser' | 'unknown';

export type ExecutionRunSource = 'local' | 'ci';

export type ExecutionRunScope =
  'framework' | 'api' | 'chromium' | 'firefox' | 'webkit' | 'mixed' | 'unknown';

export interface ExecutionRunMetadata {
  runId: string;
  runType: ExecutionRunType;
  source: ExecutionRunSource;
  scope: ExecutionRunScope;
  generatedAt: string;
  executionCount: number;
}

export interface HistoricalTestExecution {
  runId: string;
  testId: string;
  title: string;
  project: string;
  status: HistoricalExecutionStatus;
  durationMs: number;
  retry: number;
  timestamp: string;

  runType?: ExecutionRunType;
  runSource?: ExecutionRunSource;
  runScope?: ExecutionRunScope;
}

export interface ExecutionHistory {
  schemaVersion: '1.0';
  updatedAt: string;
  ingestedRunIds: string[];
  executions: HistoricalTestExecution[];

  runs?: ExecutionRunMetadata[];
}
