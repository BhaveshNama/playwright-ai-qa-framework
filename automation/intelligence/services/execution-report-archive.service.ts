import fs from 'node:fs';
import path from 'node:path';

interface NexusExecutionReport {
  schemaVersion: string;
  generatedAt: string;
  totalTests: number;
}

export interface ExecutionReportArchiveResult {
  runId: string;
  archiveDirectory: string;
  archivedReportFile: string;
  alreadyArchived: boolean;
}

function toSafeDirectoryName(runId: string): string {
  return runId.replace(/[:]/g, '-');
}

export class ExecutionReportArchiveService {
  archive(sourceFile: string, archiveRoot: string): ExecutionReportArchiveResult {
    if (!fs.existsSync(sourceFile)) {
      throw new Error(`Nexus intelligence report not found: ${sourceFile}`);
    }

    const report = JSON.parse(fs.readFileSync(sourceFile, 'utf8')) as NexusExecutionReport;

    if (report.schemaVersion !== '1.0') {
      throw new Error(`Unsupported Nexus intelligence schema: ${report.schemaVersion}`);
    }

    if (typeof report.generatedAt !== 'string' || report.generatedAt.length === 0) {
      throw new Error('Nexus intelligence report is missing generatedAt.');
    }

    const runId = report.generatedAt;

    const archiveDirectory = path.join(archiveRoot, toSafeDirectoryName(runId));

    const archivedReportFile = path.join(archiveDirectory, 'test-results.json');

    if (fs.existsSync(archivedReportFile)) {
      return {
        runId,
        archiveDirectory,
        archivedReportFile,
        alreadyArchived: true,
      };
    }

    fs.mkdirSync(archiveDirectory, {
      recursive: true,
    });

    /*
     * Use COPYFILE_EXCL so an existing archived report
     * can never be silently overwritten.
     */
    fs.copyFileSync(sourceFile, archivedReportFile, fs.constants.COPYFILE_EXCL);

    return {
      runId,
      archiveDirectory,
      archivedReportFile,
      alreadyArchived: false,
    };
  }
}

export const executionReportArchiveService = new ExecutionReportArchiveService();
