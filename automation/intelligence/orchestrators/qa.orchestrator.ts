import type {
  QaOrchestrationDecision,
  QaOrchestrationInput,
  QaOrchestrationPriority,
  QaOrchestrationResult,
} from '../models/qa-orchestration.model';
import type { FlakyTestConfidence } from '../models/flaky-test-analysis.model';

export class QaOrchestrator {
  orchestrate(input: QaOrchestrationInput): QaOrchestrationResult {
    const { failureAnalysis, historicalAnalysis, crossBrowserAnalysis } = input;

    const decision = this.determineDecision(input);

    const confidence = this.determineConfidence(input);

    const priority = this.determinePriority(decision, failureAnalysis.category);

    return {
      testId: failureAnalysis.testId,
      testTitle: failureAnalysis.testTitle,
      project: historicalAnalysis?.project ?? 'unknown',

      decision,
      priority,
      confidence,

      summary: this.createSummary(input, decision),

      rationale: this.createRationale(input),

      recommendedActions: this.createRecommendedActions(decision, failureAnalysis.category),

      signals: {
        failureCategory: failureAnalysis.category,
        failureLayer: failureAnalysis.layer,
        historicalClassification: historicalAnalysis?.classification,
        crossBrowserClassification: crossBrowserAnalysis?.classification,
      },

      guardrails: {
        autonomousCodeModificationAllowed: false,
        autonomousRetryConfigurationAllowed: false,
        autonomousTimeoutModificationAllowed: false,
        humanApprovalRequired: decision !== 'MONITOR',
      },

      requiresHumanReview: decision !== 'MONITOR',
    };
  }

  private determineDecision(input: QaOrchestrationInput): QaOrchestrationDecision {
    const { failureAnalysis, historicalAnalysis, crossBrowserAnalysis } = input;

    if (crossBrowserAnalysis?.classification === 'BROWSER_SPECIFIC_INTERMITTENT') {
      return 'INVESTIGATE_BROWSER_SPECIFIC';
    }

    if (crossBrowserAnalysis?.classification === 'BROWSER_SPECIFIC_FAILURE') {
      return 'INVESTIGATE_BROWSER_SPECIFIC';
    }

    if (historicalAnalysis?.classification === 'INSUFFICIENT_HISTORY') {
      return 'COLLECT_MORE_EVIDENCE';
    }

    if (historicalAnalysis?.classification === 'INTERMITTENT') {
      return 'INVESTIGATE_AUTOMATION';
    }

    if (
      historicalAnalysis?.classification === 'CONSISTENTLY_FAILING' &&
      failureAnalysis.layer === 'api'
    ) {
      return 'INVESTIGATE_PRODUCT';
    }

    if (
      historicalAnalysis?.classification === 'CONSISTENTLY_FAILING' &&
      failureAnalysis.layer === 'ui'
    ) {
      return 'HUMAN_REVIEW';
    }

    if (failureAnalysis.category === 'unknown') {
      return 'HUMAN_REVIEW';
    }

    return 'MONITOR';
  }

  private determineConfidence(input: QaOrchestrationInput): FlakyTestConfidence {
    if (input.crossBrowserAnalysis) {
      return input.crossBrowserAnalysis.confidence;
    }

    if (input.historicalAnalysis) {
      return input.historicalAnalysis.confidence;
    }

    return input.failureAnalysis.confidence;
  }

  private determinePriority(
    decision: QaOrchestrationDecision,
    failureCategory: QaOrchestrationInput['failureAnalysis']['category'],
  ): QaOrchestrationPriority {
    if (decision === 'INVESTIGATE_PRODUCT') {
      return 'critical';
    }

    if (decision === 'INVESTIGATE_BROWSER_SPECIFIC' || decision === 'HUMAN_REVIEW') {
      return 'high';
    }

    if (decision === 'INVESTIGATE_AUTOMATION' || failureCategory === 'timeout') {
      return 'medium';
    }

    return 'low';
  }

  private createSummary(input: QaOrchestrationInput, decision: QaOrchestrationDecision): string {
    return `${input.failureAnalysis.testTitle} resulted in ${decision}.`;
  }

  private createRationale(input: QaOrchestrationInput): string[] {
    const rationale = [
      `Failure layer: ${input.failureAnalysis.layer}`,
      `Failure category: ${input.failureAnalysis.category}`,
    ];

    if (input.historicalAnalysis) {
      rationale.push(`Historical classification: ${input.historicalAnalysis.classification}`);

      rationale.push(`Historical executions: ${input.historicalAnalysis.totalExecutions}`);

      rationale.push(
        `Historical failure rate: ${Math.round(input.historicalAnalysis.failureRate * 100)}%`,
      );
    }

    if (input.crossBrowserAnalysis) {
      rationale.push(`Cross-browser classification: ${input.crossBrowserAnalysis.classification}`);

      if (input.crossBrowserAnalysis.affectedProjects.length > 0) {
        rationale.push(
          `Affected projects: ${input.crossBrowserAnalysis.affectedProjects.join(', ')}`,
        );
      }

      if (input.crossBrowserAnalysis.stableProjects.length > 0) {
        rationale.push(`Stable projects: ${input.crossBrowserAnalysis.stableProjects.join(', ')}`);
      }
    }

    return rationale;
  }

  private createRecommendedActions(
    decision: QaOrchestrationDecision,
    failureCategory: QaOrchestrationInput['failureAnalysis']['category'],
  ): string[] {
    switch (decision) {
      case 'INVESTIGATE_BROWSER_SPECIFIC':
        return [
          'Inspect browser-specific timing, rendering, and event handling.',
          'Compare the failure against stable browser executions.',
          'Review screenshots, video, and error-context evidence.',
          'Reproduce under equivalent browser and parallel-load conditions.',
          'Do not increase global retries or timeouts without additional evidence.',
        ];

      case 'INVESTIGATE_AUTOMATION':
        return [
          'Inspect synchronization and asynchronous state transitions.',
          'Check test isolation and shared state.',
          'Compare isolated and parallel executions.',
          'Review locator behavior before changing timeout configuration.',
        ];

      case 'INVESTIGATE_PRODUCT':
        return [
          'Reproduce the failure independently of the automation layer.',
          'Inspect API or application behavior associated with the failure.',
          'Compare expected business behavior with the implementation.',
          'Escalate with execution evidence if the product behavior is confirmed.',
        ];

      case 'COLLECT_MORE_EVIDENCE':
        return [
          'Collect additional executions for the same test and project.',
          'Preserve each execution in AgenticQA history.',
          'Avoid classifying the test as flaky until the minimum evidence threshold is reached.',
        ];

      case 'HUMAN_REVIEW':
        return [
          'Review the captured failure evidence.',
          'Validate whether the issue belongs to the application, automation, or environment.',
          'Approve any code or configuration change before implementation.',
        ];

      case 'MONITOR':
        return failureCategory === 'unknown'
          ? ['Continue monitoring until more diagnostic evidence is available.']
          : ['Continue normal execution monitoring.'];
    }
  }
}

export const qaOrchestrator = new QaOrchestrator();
