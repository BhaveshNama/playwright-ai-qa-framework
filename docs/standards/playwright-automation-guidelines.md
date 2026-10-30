# Playwright Automation Engineering Standards

## Purpose

These standards define the minimum engineering expectations for the
AgenticQA Nexus Playwright automation layer.

The framework is expected to remain:

- Maintainable
- Reliable
- Scalable
- Environment-independent
- Parallel-safe
- Easy for another engineer to understand and execute
- Suitable for local and CI/CD execution

## Core principles

1. Each automated test verifies one clear business behaviour.
2. Tests must be independently executable.
3. Tests must not depend on execution order.
4. Tests must use isolated or safely controlled test data.
5. Tests must use meaningful expected-result assertions.
6. Tests should support parallel execution.
7. Accessible and user-facing locators are preferred.
8. Fixed waits are prohibited.
9. Environment-specific values must remain outside test implementations.
10. Secrets and sensitive authentication state must never be committed.
11. Retries must support diagnosis rather than hide unstable tests.
12. Comments explain engineering intent or reasoning rather than restating code.
13. Playwright native capabilities are preferred over unnecessary wrappers.
14. Failure evidence must be useful and sanitized.

## AI-generated automation

AI-generated test designs, locators, test data, or source-code recommendations
are proposals rather than automatically trusted framework changes.

Before acceptance they must pass the applicable:

- schema validation
- automation policy validation
- security validation
- static analysis
- automated tests
- human review

## Definition of Done

A test is complete only when it:

- has a meaningful test ID and name
- covers a defined requirement or risk
- uses stable locators
- contains meaningful assertions
- uses appropriate test data
- runs independently
- supports parallel execution or documents the limitation
- produces actionable failure evidence
- performs cleanup when required
- contains no secrets
- contains no unjustified fixed waits
- passes TypeScript and lint validation
- uses approved tags
