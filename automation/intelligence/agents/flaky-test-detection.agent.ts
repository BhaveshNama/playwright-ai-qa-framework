import type { HistoricalTestExecution } from '../models/execution-history.model';
import type {
  CrossBrowserFlakinessAnalysis,
  FlakyTestAnalysis,
  FlakyTestClassification,
  FlakyTestConfidence,
} from '../models/flaky-test-analysis.model';

export class FlakyTestDetectionAgent {
  private readonly minimumExecutions = 3;

  analyze(executions: HistoricalTestExecution[]): FlakyTestAnalysis {
    if (executions.length === 0) {
      throw new Error('At least one historical execution is required.');
    }

    const firstExecution = executions[0];

    const passedExecutions = executions.filter((execution) => execution.status === 'passed').length;

    const failedExecutions = executions.filter(
      (execution) =>
        execution.status === 'failed' ||
        execution.status === 'timedOut' ||
        execution.status === 'interrupted',
    ).length;

    const failureRate = failedExecutions / executions.length;

    const averageDurationMs =
      executions.reduce((total, execution) => total + execution.durationMs, 0) / executions.length;

    const classification = this.classify(executions.length, passedExecutions, failedExecutions);

    return {
      testId: firstExecution.testId,
      testTitle: firstExecution.title,
      project: firstExecution.project,
      classification,
      confidence: this.determineConfidence(classification, executions.length),
      totalExecutions: executions.length,
      passedExecutions,
      failedExecutions,
      failureRate,
      averageDurationMs: Math.round(averageDurationMs),
      recommendation: this.createRecommendation(classification),
      requiresHumanReview:
        classification === 'INTERMITTENT' || classification === 'CONSISTENTLY_FAILING',
    };
  }

  analyzeAcrossProjects(analyses: FlakyTestAnalysis[]): CrossBrowserFlakinessAnalysis {
    if (analyses.length === 0) {
      throw new Error('At least one project analysis is required.');
    }

    const testTitle = analyses[0].testTitle;

    const insufficientProjects = analyses
      .filter((analysis) => analysis.classification === 'INSUFFICIENT_HISTORY')
      .map((analysis) => analysis.project);

    const intermittentProjects = analyses
      .filter((analysis) => analysis.classification === 'INTERMITTENT')
      .map((analysis) => analysis.project);

    const failingProjects = analyses
      .filter((analysis) => analysis.classification === 'CONSISTENTLY_FAILING')
      .map((analysis) => analysis.project);

    const stableProjects = analyses
      .filter((analysis) => analysis.classification === 'STABLE')
      .map((analysis) => analysis.project);

    if (insufficientProjects.length > 0) {
      return {
        testTitle,
        classification: 'INSUFFICIENT_HISTORY',
        affectedProjects: insufficientProjects,
        stableProjects,
        confidence: 'low',
        recommendation:
          'Collect sufficient execution history for every compared project before making a cross-browser classification.',
        requiresHumanReview: false,
      };
    }

    if (intermittentProjects.length > 0 && stableProjects.length > 0) {
      return {
        testTitle,
        classification: 'BROWSER_SPECIFIC_INTERMITTENT',
        affectedProjects: intermittentProjects,
        stableProjects,
        confidence: this.lowestConfidence(analyses),
        recommendation:
          'Investigate browser-specific timing, rendering, event handling, and asynchronous state synchronization before changing retries or global timeouts.',
        requiresHumanReview: true,
      };
    }

    if (intermittentProjects.length === analyses.length) {
      return {
        testTitle,
        classification: 'CROSS_BROWSER_INTERMITTENT',
        affectedProjects: intermittentProjects,
        stableProjects: [],
        confidence: this.lowestConfidence(analyses),
        recommendation:
          'Investigate shared application state, asynchronous behavior, environment load, and test isolation because intermittency occurs across projects.',
        requiresHumanReview: true,
      };
    }

    if (failingProjects.length > 0 && stableProjects.length > 0) {
      return {
        testTitle,
        classification: 'BROWSER_SPECIFIC_FAILURE',
        affectedProjects: failingProjects,
        stableProjects,
        confidence: this.lowestConfidence(analyses),
        recommendation:
          'Investigate deterministic browser-specific application or automation behavior before changing generic test configuration.',
        requiresHumanReview: true,
      };
    }

    if (failingProjects.length === analyses.length) {
      return {
        testTitle,
        classification: 'CROSS_BROWSER_FAILURE',
        affectedProjects: failingProjects,
        stableProjects: [],
        confidence: this.lowestConfidence(analyses),
        recommendation:
          'Treat this as a likely deterministic product or test failure because the scenario consistently fails across projects.',
        requiresHumanReview: true,
      };
    }

    return {
      testTitle,
      classification: 'CROSS_BROWSER_STABLE',
      affectedProjects: [],
      stableProjects,
      confidence: this.lowestConfidence(analyses),
      recommendation: 'No cross-browser instability signal detected.',
      requiresHumanReview: false,
    };
  }

  private classify(
    totalExecutions: number,
    passedExecutions: number,
    failedExecutions: number,
  ): FlakyTestClassification {
    if (totalExecutions < this.minimumExecutions) {
      return 'INSUFFICIENT_HISTORY';
    }

    if (failedExecutions === 0) {
      return 'STABLE';
    }

    if (passedExecutions === 0) {
      return 'CONSISTENTLY_FAILING';
    }

    return 'INTERMITTENT';
  }

  private determineConfidence(
    classification: FlakyTestClassification,
    totalExecutions: number,
  ): FlakyTestConfidence {
    if (classification === 'INSUFFICIENT_HISTORY') {
      return 'low';
    }

    if (totalExecutions >= 10) {
      return 'high';
    }

    if (totalExecutions >= 5) {
      return 'medium';
    }

    return 'low';
  }

  private lowestConfidence(analyses: FlakyTestAnalysis[]): FlakyTestConfidence {
    if (analyses.some((analysis) => analysis.confidence === 'low')) {
      return 'low';
    }

    if (analyses.some((analysis) => analysis.confidence === 'medium')) {
      return 'medium';
    }

    return 'high';
  }

  private createRecommendation(classification: FlakyTestClassification): string {
    switch (classification) {
      case 'STABLE':
        return 'No flakiness signal detected. Continue normal execution monitoring.';

      case 'INTERMITTENT':
        return 'Investigate timing, environment, browser-specific behavior, shared state, and asynchronous application updates before changing retries or timeouts.';

      case 'CONSISTENTLY_FAILING':
        return 'Treat this as a deterministic failure until evidence shows successful executions. Investigate the product or test implementation.';

      case 'INSUFFICIENT_HISTORY':
        return 'Collect at least three executions for this test and project before making a flakiness classification.';
    }
  }
}

export const flakyTestDetectionAgent = new FlakyTestDetectionAgent();
