export type HistoricalExecutionStatus =
  'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';

export interface HistoricalTestExecution {
  runId: string;
  testId: string;
  title: string;
  project: string;
  status: HistoricalExecutionStatus;
  durationMs: number;
  retry: number;
  timestamp: string;
}

export interface ExecutionHistory {
  schemaVersion: '1.0';
  updatedAt: string;
  ingestedRunIds: string[];
  executions: HistoricalTestExecution[];
}
