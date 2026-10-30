# ADR-005: Typed Environment Configuration

## Status

Accepted

## Context

AgenticQA Nexus will execute against multiple services and environments.

Raw environment variables are external string-based input and may be missing,
invalid, or incorrectly configured. Allowing framework modules to read
`process.env` independently would distribute configuration parsing and
validation throughout the repository.

## Decision

Environment configuration is loaded centrally and validated at runtime using
Zod.

Framework modules consume the exported typed configuration instead of reading
environment variables directly.

Local `.env` files are ignored by Git. `.env.example` documents supported
configuration without containing secrets.

The environment can be validated independently through:

`npm run env:check`

## Security

Validation and diagnostic commands must not print:

- Passwords
- Access tokens
- API keys
- Authentication cookies
- Authorization headers
- Sensitive storage-state values

## Current environments

The initially supported execution environments are:

- `local`
- `dev`
- `qa`

Additional environments will be introduced only when an implemented use case
requires them.

## Consequences

Invalid configuration fails before test execution rather than producing a less
clear failure later in the workflow.

The same validated configuration boundary can support UI testing, API clients,
authentication, database connectivity, reporting, CI/CD, and AI providers.
