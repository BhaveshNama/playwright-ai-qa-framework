# ADR-007: Test Identification and Tags

## Status

Accepted

## Context

AgenticQA Nexus will eventually correlate requirements, test designs, test
executions, failures, evidence, AI analysis, and historical results.

Uncontrolled test names and tags would make long-term correlation and selective
execution less reliable.

## Decision

Automated scenarios use stable functional test identifiers.

Current functional prefixes include:

- `AUTH` - authentication
- `REG` - registration
- `CAT` - catalogue
- `CART` - shopping cart
- `CHK` - checkout
- `ORD` - orders
- `API` - API-focused scenarios
- `CFG` - framework/configuration validation

Test titles follow the convention:

`<CASE-ID> | <feature> | <expected behaviour>`

The approved initial tag vocabulary is defined centrally in
`automation/config/test-tags.ts`.

## Tag Categories

Execution scope:

- `@smoke`
- `@regression`

Testing layer:

- `@ui`
- `@api`
- `@integration`

Risk:

- `@critical`

Scenario intent:

- `@positive`
- `@negative`

Specialized testing:

- `@accessibility`
- `@visual`

## Consequences

Test identifiers remain stable even when implementation files are reorganized.

The controlled tag vocabulary supports future CI suite selection and reporting
without relying on inconsistent free-form tags.
