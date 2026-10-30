# ADR-004: Prettier Formatting

## Status

Accepted

## Context

AgenticQA Nexus requires consistent source formatting across local development,
code review, and CI environments.

Formatting concerns should remain separate from TypeScript type validation
and ESLint source-quality rules.

## Decision

Prettier is the repository formatter.

Formatting is validated through:

npm run format:check

Local formatting can be applied through:

npm run format

Prettier controls formatting only. ESLint remains responsible for source-quality
and Playwright-specific engineering rules.

## Repository conventions

- Use semicolons.
- Use single quotes where supported.
- Use two-space indentation.
- Use trailing commas where supported.
- Keep line width at 100 characters.
- Normalize source files to LF line endings.
- Exclude generated dependencies, reports, artifacts, authentication state,
  and npm lockfile formatting.

## Consequences

Formatting differences become deterministic and should not consume code-review
attention.

Generated files remain controlled by their generating tools rather than being
reformatted manually.
