import path from 'node:path';

import { getExecutionRunContext } from '../config/execution-context.config';
import { aiAnalysisService } from '../services/ai-analysis.service';
import { executionHistoryService } from '../services/execution-history.service';
import { executionReportArchiveService } from '../services/execution-report-archive.service';
import { failureAnalysisService } from '../services/failure-analysis.service';
import { flakinessAnalysisService } from '../services/flakiness-analysis.service';
import { intelligenceSummaryService } from '../services/intelligence-summary.service';
import { qaOrchestrationService } from '../services/qa-orchestration.service';
import { reliabilityTrendService } from '../services/reliability-trend.service';

const intelligenceDirectory = path.resolve(process.cwd(), 'artifacts', 'intelligence');

const testResultsFile = path.join(intelligenceDirectory, 'test-results.json');

const executionHistoryFile = path.join(intelligenceDirectory, 'execution-history.json');

const reliabilityTrendFile = path.join(intelligenceDirectory, 'reliability-trend.json');

const failureAnalysisFile = path.join(intelligenceDirectory, 'failure-analysis.json');

const flakinessAnalysisFile = path.join(intelligenceDirectory, 'flaky-test-analysis.json');

const orchestrationFile = path.join(intelligenceDirectory, 'qa-orchestration.json');

const aiAnalysisFile = path.join(intelligenceDirectory, 'ai-analysis.json');

const executionArchiveDirectory = path.join(intelligenceDirectory, 'runs');

const intelligenceSummaryJsonFile = path.join(intelligenceDirectory, 'intelligence-summary.json');

const intelligenceSummaryMarkdownFile = path.join(intelligenceDirectory, 'intelligence-summary.md');

async function main(): Promise<void> {
  console.log('Starting AgenticQA intelligence pipeline...');

  const runContext = getExecutionRunContext();

  console.log(
    `Execution context: ${runContext.runType} / ${runContext.source} / ${runContext.scope}`,
  );

  const archiveResult = executionReportArchiveService.archive(
    testResultsFile,
    executionArchiveDirectory,
  );

  if (archiveResult.alreadyArchived) {
    console.log(`Execution report already archived: ${archiveResult.runId}`);
  } else {
    console.log(`Execution report archived: ${archiveResult.runId}`);
  }

  const historyResult = executionHistoryService.update(
    archiveResult.archivedReportFile,
    executionHistoryFile,
    runContext,
  );

  if (historyResult.alreadyIngested) {
    console.log(`Execution run already ingested: ${historyResult.runId}`);
  } else {
    console.log(`Execution history updated with ${historyResult.addedExecutions} execution(s).`);
  }

  console.log(`Execution history contains ${historyResult.totalExecutions} execution(s).`);

  const reliabilityTrendResult = reliabilityTrendService.analyze(
    executionHistoryFile,
    reliabilityTrendFile,
  );

  console.log(
    `Reliability trend analysis completed for ${reliabilityTrendResult.report.totalGroups} test/project group(s).`,
  );

  console.log(
    `Reliability trends: ${reliabilityTrendResult.report.improving} improving, ${reliabilityTrendResult.report.stable} stable, ${reliabilityTrendResult.report.degrading} degrading, ${reliabilityTrendResult.report.insufficientHistory} insufficient history.`,
  );

  const failureResult = failureAnalysisService.analyze(
    archiveResult.archivedReportFile,
    failureAnalysisFile,
  );

  console.log(`Failure analysis completed: ${failureResult.report.totalFailures} failure(s).`);

  const flakinessResult = flakinessAnalysisService.analyze(
    executionHistoryFile,
    flakinessAnalysisFile,
  );

  console.log(
    `Flakiness analysis completed for ${flakinessResult.report.totalGroups} test/project group(s).`,
  );

  console.log(
    `Cross-browser analysis completed for ${flakinessResult.report.crossBrowserAnalyses.length} test(s).`,
  );

  const orchestrationResult = qaOrchestrationService.orchestrate(
    failureAnalysisFile,
    flakinessAnalysisFile,
    orchestrationFile,
  );

  console.log(
    `QA orchestration completed with ${orchestrationResult.report.totalDecisions} decision(s).`,
  );

  const aiResult = await aiAnalysisService.analyze(
    orchestrationFile,
    aiAnalysisFile,
    process.env.AI_PROVIDER,
  );

  console.log(`AI analysis completed with ${aiResult.report.totalAnalyses} analysis result(s).`);

  console.log(
    `AI provider: ${aiResult.report.provider} (${
      aiResult.report.enabled ? 'enabled' : 'disabled'
    })`,
  );

  const summaryResult = intelligenceSummaryService.generate(
    archiveResult.archivedReportFile,
    flakinessAnalysisFile,
    reliabilityTrendFile,
    orchestrationFile,
    aiAnalysisFile,
    intelligenceSummaryJsonFile,
    intelligenceSummaryMarkdownFile,
    {
      runId: archiveResult.runId,
      runType: runContext.runType,
      source: runContext.source,
      scope: runContext.scope,
    },
  );

  console.log(
    `Intelligence summary generated with quality signal: ${summaryResult.summary.qualitySignal}`,
  );

  console.log('AgenticQA intelligence pipeline completed successfully.');
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(`AgenticQA intelligence pipeline failed: ${error.message}`);
  } else {
    console.error('AgenticQA intelligence pipeline failed with an unknown error.');
  }

  process.exitCode = 1;
});
