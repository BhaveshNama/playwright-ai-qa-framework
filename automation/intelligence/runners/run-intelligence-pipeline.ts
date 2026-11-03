import path from 'node:path';

import { aiAnalysisService } from '../services/ai-analysis.service';
import { executionHistoryService } from '../services/execution-history.service';
import { failureAnalysisService } from '../services/failure-analysis.service';
import { flakinessAnalysisService } from '../services/flakiness-analysis.service';
import { qaOrchestrationService } from '../services/qa-orchestration.service';

const intelligenceDirectory = path.resolve(process.cwd(), 'artifacts', 'intelligence');

const testResultsFile = path.join(intelligenceDirectory, 'test-results.json');

const executionHistoryFile = path.join(intelligenceDirectory, 'execution-history.json');

const failureAnalysisFile = path.join(intelligenceDirectory, 'failure-analysis.json');

const flakinessAnalysisFile = path.join(intelligenceDirectory, 'flaky-test-analysis.json');

const orchestrationFile = path.join(intelligenceDirectory, 'qa-orchestration.json');

const aiAnalysisFile = path.join(intelligenceDirectory, 'ai-analysis.json');

async function main(): Promise<void> {
  console.log('Starting AgenticQA intelligence pipeline...');

  const historyResult = executionHistoryService.update(testResultsFile, executionHistoryFile);

  if (historyResult.alreadyIngested) {
    console.log(`Execution run already ingested: ${historyResult.runId}`);
  } else {
    console.log(`Execution history updated with ${historyResult.addedExecutions} execution(s).`);
  }

  console.log(`Execution history contains ${historyResult.totalExecutions} execution(s).`);

  const failureResult = failureAnalysisService.analyze(testResultsFile, failureAnalysisFile);

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
