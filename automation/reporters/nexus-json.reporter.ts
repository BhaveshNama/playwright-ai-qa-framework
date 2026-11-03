import fs from 'node:fs';
import path from 'node:path';

import type { FullConfig, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

interface NexusAttachment {
  name: string;
  contentType: string;
  path?: string;
}

interface NexusTestResult {
  testId: string;
  title: string;
  titlePath: string[];
  file: string;
  project: string;
  tags: string[];
  status: TestResult['status'];
  expectedStatus: TestCase['expectedStatus'];
  durationMs: number;
  retry: number;
  workerIndex: number;
  errorMessage?: string;
  errorStack?: string;
  attachments: NexusAttachment[];
  timestamp: string;
}

interface NexusExecutionReport {
  schemaVersion: '1.0';
  generatedAt: string;
  totalTests: number;
  totals: {
    passed: number;
    failed: number;
    skipped: number;
    timedOut: number;
    interrupted: number;
  };
  results: NexusTestResult[];
}

export default class NexusJsonReporter implements Reporter {
  private readonly results: NexusTestResult[] = [];

  private outputFile = path.resolve(
    process.cwd(),
    'artifacts',
    'intelligence',
    'test-results.json',
  );

  onBegin(config: FullConfig, _suite: Suite): void {
    const configuredOutput = process.env.NEXUS_INTELLIGENCE_REPORT;

    if (configuredOutput) {
      this.outputFile = path.resolve(process.cwd(), configuredOutput);
    }

    fs.mkdirSync(path.dirname(this.outputFile), {
      recursive: true,
    });

    this.results.length = 0;

    console.log(
      `Nexus intelligence reporter initialized for ${config.projects.length} project(s).`,
    );
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const project = test.parent.project()?.name ?? 'unknown';

    this.results.push({
      testId: test.id,
      title: test.title,
      titlePath: test.titlePath(),
      file: path.relative(process.cwd(), test.location.file),
      project,
      tags: test.tags,
      status: result.status,
      expectedStatus: test.expectedStatus,
      durationMs: result.duration,
      retry: result.retry,
      workerIndex: result.workerIndex,
      errorMessage: result.error?.message,
      errorStack: result.error?.stack,
      attachments: result.attachments.map((attachment) => ({
        name: attachment.name,
        contentType: attachment.contentType,
        path: attachment.path ? path.relative(process.cwd(), attachment.path) : undefined,
      })),
      timestamp: new Date().toISOString(),
    });
  }

  onEnd(): void {
    const report: NexusExecutionReport = {
      schemaVersion: '1.0',
      generatedAt: new Date().toISOString(),
      totalTests: this.results.length,
      totals: {
        passed: this.countByStatus('passed'),
        failed: this.countByStatus('failed'),
        skipped: this.countByStatus('skipped'),
        timedOut: this.countByStatus('timedOut'),
        interrupted: this.countByStatus('interrupted'),
      },
      results: this.results,
    };

    fs.writeFileSync(this.outputFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

    console.log(`Nexus intelligence report written to ${this.outputFile}`);
  }

  private countByStatus(status: TestResult['status']): number {
    return this.results.filter((result) => result.status === status).length;
  }
}
