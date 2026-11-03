import fs from 'node:fs';
import path from 'node:path';

import type {
  ExecutionHistory,
  HistoricalExecutionStatus,
  HistoricalTestExecution,
} from '../models/execution-history.model';

interface NexusExecutionResult {
  testId: string;
  title: string;
  project: string;
  status: HistoricalExecutionStatus;
  durationMs: number;
  retry: number;
  timestamp: string;
}

interface NexusExecutionReport {
  schemaVersion: string;
  generatedAt: string;
  totalTests: number;
  results: NexusExecutionResult[];
}

const sourceFile = path.resolve(process.cwd(), 'artifacts', 'intelligence', 'test-results.json');

const historyFile = path.resolve(
  process.cwd(),
  'artifacts',
  'intelligence',
  'execution-history.json',
);

if (!fs.existsSync(sourceFile)) {
  throw new Error(`Nexus intelligence report not found: ${sourceFile}`);
}

const sourceReport = JSON.parse(fs.readFileSync(sourceFile, 'utf8')) as NexusExecutionReport;

if (sourceReport.schemaVersion !== '1.0') {
  throw new Error(`Unsupported Nexus intelligence schema: ${sourceReport.schemaVersion}`);
}

const runId = sourceReport.generatedAt;

let history: ExecutionHistory = {
  schemaVersion: '1.0',
  updatedAt: new Date().toISOString(),
  ingestedRunIds: [],
  executions: [],
};

if (fs.existsSync(historyFile)) {
  const existingHistory = JSON.parse(
    fs.readFileSync(historyFile, 'utf8'),
  ) as Partial<ExecutionHistory>;

  if (existingHistory.schemaVersion !== '1.0') {
    throw new Error(`Unsupported execution history schema: ${existingHistory.schemaVersion}`);
  }

  history = {
    schemaVersion: '1.0',
    updatedAt: existingHistory.updatedAt ?? new Date().toISOString(),
    ingestedRunIds: existingHistory.ingestedRunIds ?? [],
    executions: existingHistory.executions ?? [],
  };
}

if (history.ingestedRunIds.includes(runId)) {
  console.log(`AgenticQA execution run already ingested: ${runId}`);

  console.log(`Execution history remains at ${history.executions.length} execution(s).`);

  process.exit(0);
}

const executions: HistoricalTestExecution[] = sourceReport.results.map((result) => ({
  runId,
  testId: result.testId,
  title: result.title,
  project: result.project,
  status: result.status,
  durationMs: result.durationMs,
  retry: result.retry,
  timestamp: result.timestamp,
}));

history.executions.push(...executions);
history.ingestedRunIds.push(runId);
history.updatedAt = new Date().toISOString();

fs.writeFileSync(historyFile, `${JSON.stringify(history, null, 2)}\n`, 'utf8');

console.log(`AgenticQA execution history updated with ${executions.length} execution(s).`);

console.log(`Execution history now contains ${history.executions.length} execution(s).`);

console.log(`Execution history written to ${historyFile}`);
