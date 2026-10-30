# ADR-002: Strict TypeScript Validation

## Status

Accepted

## Context

AgenticQA Nexus will contain UI automation, API clients, typed test data,
configuration, evidence models, policy validators, and AI agent contracts.

Runtime Playwright execution alone does not provide the static validation
required for these framework boundaries.

## Decision

The project uses TypeScript strict mode and executes static validation through:

npm run typecheck

The typecheck command uses:

tsc --noEmit

so validation does not generate compiled JavaScript artifacts.

## Key rules

- Avoid implicit `any`.
- Treat null and undefined values explicitly.
- Remove unused local variables and parameters.
- Functions should return consistently across execution paths.
- Structured framework data should use explicit TypeScript types or interfaces.
- Type errors must be resolved before changes are considered ready for CI.

## Consequences

Framework code may require more explicit types than a minimal Playwright project.

The added type safety is intentional because later layers will exchange
structured data between automation, reporting, policy validation, and
AI-assisted workflows.
