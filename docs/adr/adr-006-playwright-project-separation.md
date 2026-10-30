# ADR-006: Playwright Project Separation

## Status

Accepted

## Context

AgenticQA Nexus will contain browser UI tests, API tests, framework integration
tests, and later accessibility, visual, policy, and agent evaluations.

Executing every test category against Chromium, Firefox, and WebKit would
duplicate non-browser checks without providing additional browser coverage
value.

## Decision

Playwright projects are separated by test responsibility.

- `framework` executes configuration and framework integration checks once.
- `api` executes API scenarios once using the configured API base URL.
- `chromium`, `firefox`, and `webkit` execute browser UI scenarios.
- Accessibility and visual projects will be introduced when those capabilities
  are implemented.

## Reporting

The framework produces:

- HTML reports for test investigation.
- JUnit XML for CI-compatible machine-readable results.
- Playwright runtime artifacts under `test-results`.

## Diagnostic Policy

- Local retries remain disabled.
- CI retries are limited to two attempts.
- A retried pass must not automatically be treated as a healthy test.
- Trace collection occurs on the first retry.
- Screenshots are captured on failure.
- Videos are retained on failure.
- Runtime reports and artifacts are not committed.

## Parallel Execution

Tests are expected to remain independent and parallel-safe.

CI worker count is initially limited while the isolated application and
test-data architecture are introduced.

## Consequences

Test categories execute only where their runtime context provides useful
coverage.

Browser compatibility remains an explicit UI concern rather than
automatically multiplying API, framework, policy, or agent tests.
