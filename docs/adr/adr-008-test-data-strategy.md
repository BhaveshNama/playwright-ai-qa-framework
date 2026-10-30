# ADR-008: Test Data Strategy

## Status

Accepted

## Decision

AgenticQA Nexus separates deterministic business-rule data from dynamically
generated synthetic data.

Faker is used where uniqueness and representative synthetic values are useful,
including names, email addresses, addresses, and free-text values.

Faker is not used for exact boundaries, expected calculations, role codes,
fixed application states, or values that must remain identical between runs.

Test-data factories accept typed overrides so individual scenarios can control
only the values relevant to the behaviour being tested.

Shared imported test-data objects must not be mutated.

Generated values needed to reproduce a failure will later be attached to the
test evidence after sensitive fields are removed.

## Security

Factories generate synthetic data only.

Production, client, or personal user data must not be introduced into test
datasets.

## Consequences

Parallel scenarios can create independent data without relying on shared
mutable objects.

Boundary and negative testing remain repeatable because rule-specific values
stay deterministic.
