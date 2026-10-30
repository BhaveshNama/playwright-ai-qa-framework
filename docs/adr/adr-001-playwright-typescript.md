# ADR-001: Playwright with TypeScript

## Status

Accepted

## Context

AgenticQA Nexus requires a primary automation technology for browser UI,
API, integration, accessibility, and diagnostic workflows.

## Decision

Playwright Test with TypeScript is the primary automation stack.

TypeScript strict validation will be introduced as a separate quality gate
because framework execution and static type validation solve different
problems.

## Engineering principles

- Tests must remain independently executable.
- Tests must be designed for parallel execution.
- Page and component objects contain reusable application behaviour.
- Playwright native capabilities are preferred over unnecessary wrappers.
- UI setup should be replaced by API setup when the UI interaction itself
  is not under test and API setup is suitable.
- Test configuration and business test data remain separate.
- Generated authentication state must not be committed.
- Failure evidence must support diagnosis without exposing secrets.

## Consequences

The repository will prioritize Playwright and TypeScript rather than trying
to support multiple UI automation technologies.

AI capabilities will extend the automation platform rather than replace the
deterministic Playwright execution layer.
