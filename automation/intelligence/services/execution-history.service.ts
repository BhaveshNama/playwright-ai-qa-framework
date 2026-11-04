import fs from 'node:fs';
import path from 'node:path';

import type {
  ExecutionHistory,
  ExecutionRunScope,
  ExecutionRunSource,
  ExecutionRunType,
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

export interface ExecutionRunContext {
  runType: ExecutionRunType;
  source: ExecutionRunSource;
  scope: ExecutionRunScope;
}

export interface ExecutionHistoryUpdateResult {
  runId: string;
  addedExecutions: number;
  totalExecutions: number;
  alreadyIngested: boolean;
  runContext: ExecutionRunContext;
}

export class ExecutionHistoryService {
  update(
    sourceFile: string,
    historyFile: string,
    runContext: ExecutionRunContext,
  ): ExecutionHistoryUpdateResult {
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
      runs: [],
    };

    if (fs.existsSync(historyFile)) {
      const existingHistory = JSON.parse(fs.readFileSync(historyFile, 'utf8')) as ExecutionHistory;

      if (existingHistory.schemaVersion !== '1.0') {
        throw new Error(`Unsupported execution history schema: ${existingHistory.schemaVersion}`);
      }

      history = existingHistory;

      // Backward compatibility for history created
      // before run segmentation was introduced.
      history.runs ??= [];
    }

    if (history.ingestedRunIds.includes(runId)) {
      return {
        runId,
        addedExecutions: 0,
        totalExecutions: history.executions.length,
        alreadyIngested: true,
        runContext,
      };
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

      runType: runContext.runType,
      runSource: runContext.source,
      runScope: runContext.scope,
    }));

    history.executions.push(...executions);

    history.runs ??= [];

    history.runs.push({
      runId,
      runType: runContext.runType,
      source: runContext.source,
      scope: runContext.scope,
      generatedAt: sourceReport.generatedAt,
      executionCount: executions.length,
    });

    history.ingestedRunIds.push(runId);
    history.updatedAt = new Date().toISOString();

    fs.mkdirSync(path.dirname(historyFile), {
      recursive: true,
    });

    fs.writeFileSync(historyFile, `${JSON.stringify(history, null, 2)}\n`, 'utf8');

    return {
      runId,
      addedExecutions: executions.length,
      totalExecutions: history.executions.length,
      alreadyIngested: false,
      runContext,
    };
  }
}

export const executionHistoryService = new ExecutionHistoryService();
