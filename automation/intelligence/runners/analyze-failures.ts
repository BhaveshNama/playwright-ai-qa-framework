import fs from 'node:fs';
import path from 'node:path';

import { failureAnalysisAgent } from '../agents/failure-analysis.agent';
import type { FailureEvidence } from '../models/failure-analysis.model';

interface NexusExecutionResult extends FailureEvidence {
  status: string;
}

interface NexusExecutionReport {
  schemaVersion: string;
  generatedAt: string;
  totalTests: number;
  results: NexusExecutionResult[];
}

interface FailureAnalysisReport {
  schemaVersion: '1.0';
  generatedAt: string;
  sourceReport: string;
  totalFailures: number;
  analyses: ReturnType<typeof failureAnalysisAgent.analyze>[];
}

const sourceFile = path.resolve(process.cwd(), 'artifacts', 'intelligence', 'test-results.json');

const outputFile = path.resolve(
  process.cwd(),
  'artifacts',
  'intelligence',
  'failure-analysis.json',
);

if (!fs.existsSync(sourceFile)) {
  throw new Error(`Nexus intelligence report not found: ${sourceFile}`);
}

const sourceReport = JSON.parse(fs.readFileSync(sourceFile, 'utf8')) as NexusExecutionReport;

if (sourceReport.schemaVersion !== '1.0') {
  throw new Error(`Unsupported Nexus intelligence schema: ${sourceReport.schemaVersion}`);
}

const failures = sourceReport.results.filter((result) => result.status !== 'passed');

const analyses = failures.map((failure) => failureAnalysisAgent.analyze(failure));

const report: FailureAnalysisReport = {
  schemaVersion: '1.0',
  generatedAt: new Date().toISOString(),
  sourceReport: path.relative(process.cwd(), sourceFile),
  totalFailures: analyses.length,
  analyses,
};

fs.mkdirSync(path.dirname(outputFile), {
  recursive: true,
});

fs.writeFileSync(outputFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(`AgenticQA failure analysis completed: ${analyses.length} failure(s) analyzed.`);

console.log(`Failure analysis written to ${outputFile}`);
