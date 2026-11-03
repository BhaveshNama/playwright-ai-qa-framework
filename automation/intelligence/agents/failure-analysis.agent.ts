import type {
  FailureAnalysis,
  FailureCategory,
  FailureEvidence,
  FailureLayer,
} from '../models/failure-analysis.model';

export class FailureAnalysisAgent {
  analyze(failure: FailureEvidence): FailureAnalysis {
    const message = this.normalizeText(failure.errorMessage ?? '');

    const layer = this.determineLayer(failure);
    const category = this.determineCategory(message);

    return {
      testId: failure.testId,
      testTitle: failure.title,
      layer,
      category,
      confidence: category === 'unknown' ? 'low' : 'high',
      summary: this.createSummary(failure, category),
      probableCause: this.determineProbableCause(message, category),
      recommendations: this.createRecommendations(category),
      evidence: this.createEvidence(failure, message),
      requiresHumanReview: true,
    };
  }

  private determineLayer(failure: FailureEvidence): FailureLayer {
    if (failure.tags.includes('@ui')) {
      return 'ui';
    }

    if (failure.tags.includes('@api')) {
      return 'api';
    }

    if (failure.tags.includes('@integration')) {
      return 'framework';
    }

    return 'unknown';
  }

  private determineCategory(message: string): FailureCategory {
    const normalized = message.toLowerCase();

    if (normalized.includes('tohaveurl') || normalized.includes('navigation')) {
      return 'navigation';
    }

    if (
      normalized.includes('expect(') ||
      normalized.includes('expected:') ||
      normalized.includes('received:')
    ) {
      return 'assertion';
    }

    if (normalized.includes('locator') && normalized.includes('timeout')) {
      return 'locator';
    }

    if (normalized.includes('test timeout') || normalized.includes('timeouterror')) {
      return 'timeout';
    }

    if (
      normalized.includes('network') ||
      normalized.includes('econnrefused') ||
      normalized.includes('fetch failed')
    ) {
      return 'network';
    }

    return 'unknown';
  }

  private createSummary(failure: FailureEvidence, category: FailureCategory): string {
    return `${failure.title} failed in ${failure.project} with a ${category} failure.`;
  }

  private determineProbableCause(message: string, category: FailureCategory): string {
    if (category === 'assertion' && message.includes('toHaveCount')) {
      return 'The observed UI state did not reach the expected element count before the assertion timeout.';
    }

    if (category === 'locator') {
      return 'The expected UI element was not actionable within the configured timeout.';
    }

    if (category === 'navigation') {
      return 'The browser did not reach the expected application URL within the configured timeout.';
    }

    if (category === 'timeout') {
      return 'The test exceeded its configured execution timeout before completing.';
    }

    if (category === 'network') {
      return 'A network or service communication failure prevented the scenario from completing.';
    }

    return 'The available execution evidence is insufficient to determine a specific probable cause.';
  }

  private createRecommendations(category: FailureCategory): string[] {
    switch (category) {
      case 'assertion':
        return [
          'Inspect the application state immediately before the failing assertion.',
          'Check whether the preceding action completed successfully before changing assertion timeouts.',
          'Compare the same scenario across browser projects.',
        ];

      case 'locator':
        return [
          'Inspect the captured page state and locator target.',
          'Confirm the element is visible, enabled, and stable.',
          'Prefer resilient role or label based locators over timing workarounds.',
        ];

      case 'navigation':
        return [
          'Inspect the action responsible for navigation.',
          'Verify the expected destination and server response.',
          'Check whether navigation is delayed only under parallel execution.',
        ];

      case 'timeout':
        return [
          'Identify the last successfully completed test action.',
          'Inspect browser and server evidence before increasing the timeout.',
          'Compare isolated and parallel execution behavior.',
        ];

      case 'network':
        return [
          'Verify application and API availability.',
          'Inspect the failing request and response.',
          'Check whether the failure is environment-specific.',
        ];

      default:
        return [
          'Review the captured stack trace and diagnostic attachments.',
          'Reproduce the scenario in isolation before modifying the test.',
        ];
    }
  }

  private createEvidence(failure: FailureEvidence, message: string): string[] {
    const evidence = [
      `Project: ${failure.project}`,
      `Duration: ${failure.durationMs}ms`,
      `Retry: ${failure.retry}`,
    ];

    if (message) {
      evidence.push(`Error: ${message}`);
    }

    for (const attachment of failure.attachments) {
      if (attachment.path) {
        evidence.push(`${attachment.name}: ${attachment.path}`);
      }
    }

    return evidence;
  }

  private normalizeText(value: string): string {
    const escapeCharacter = String.fromCharCode(27);

    return value.replace(new RegExp(`${escapeCharacter}\\[[0-9;]*m`, 'g'), '');
  }
}

export const failureAnalysisAgent = new FailureAnalysisAgent();
