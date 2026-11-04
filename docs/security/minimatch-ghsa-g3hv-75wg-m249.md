# Security Review: GHSA-g3hv-75wg-m249

## Status

Temporarily accepted and monitored.

## Advisory

- Package: minimatch
- Installed version: 10.2.6
- Patched version: 11.0.1
- Severity: Moderate
- Impact: Potential denial of service through glob-pattern amplification

## Dependency Paths

The vulnerable package is introduced transitively through:

- eslint
- @eslint/config-array
- typescript-eslint
- @typescript-eslint/typescript-estree

## Exposure Assessment

The affected dependency is used by development and CI linting tooling.

NexusShop does not expose an application endpoint that accepts arbitrary glob
patterns and passes them to minimatch.

Repository configuration and CI inputs are controlled.

## Decision

Do not run `npm audit fix --force`.

The proposed forced resolution downgrades ESLint to version 4 and would introduce
a breaking and incompatible toolchain change.

Do not force minimatch 11 through package overrides until upstream packages
declare compatible dependency ranges.

## Mitigations

- Keep repository and CI configuration trusted.
- Do not process untrusted glob expressions.
- Continue running npm audit.
- Monitor ESLint and typescript-eslint releases.
- Apply a compatible patched dependency when available.
- Keep quality gates and regression tests mandatory after dependency changes.

## Review Trigger

Review this acceptance when any of the following occurs:

- ESLint releases a compatible dependency update.
- typescript-eslint releases a compatible dependency update.
- minimatch 11 becomes supported by the current toolchain.
- The project begins accepting user-controlled glob patterns.
- The advisory severity or exploitability changes.
