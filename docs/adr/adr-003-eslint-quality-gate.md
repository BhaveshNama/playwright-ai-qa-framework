# ADR-003: ESLint Quality Gate

## Status

Accepted

## Context

TypeScript validates type safety but does not enforce every source-code or
Playwright-specific engineering rule required by AgenticQA Nexus.

The project requires deterministic detection of maintainability and
reliability problems before changes reach CI.

## Decision

ESLint is used as a separate static-analysis quality gate.

The project uses:

- ESLint flat configuration
- TypeScript ESLint
- eslint-plugin-playwright
- project-specific TypeScript rules
- project-specific Playwright rules

Static analysis is executed through:

npm run lint

## Playwright-specific policies

The current lint configuration prevents:

- committed focused tests using test.only()
- fixed waits using waitForTimeout()
- tests without observable expectations where applicable

Additional project policies will be introduced through the AgenticQA
governance layer when those capabilities are implemented.

## Consequences

Lint failures are treated as engineering failures.

Rules should address an identified engineering risk. The project avoids
adding abstractions or rules solely to make the framework appear complex.
