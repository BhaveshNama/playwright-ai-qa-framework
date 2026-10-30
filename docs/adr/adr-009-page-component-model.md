# ADR-009: Page and Component Model

## Status

Accepted

## Context

NexusShop UI automation requires maintainable ownership of page-specific and
reusable UI behavior.

A single large page object or generic interaction wrapper would create
unnecessary coupling and hide Playwright's native capabilities.

## Decision

AgenticQA Nexus separates:

- Pages for page-specific behavior.
- Components for reusable widgets.
- Tests for scenario intent and business assertions.
- Utilities for small stateless technical operations.

The framework does not introduce generic wrappers around Playwright methods such
as click(), fill(), or locator waiting.

Accessible and user-facing locator strategies are preferred.

The default locator preference is:

1. Role and accessible name.
2. Label.
3. Placeholder.
4. Stable visible text.
5. Alt text.
6. Title.
7. Test ID.
8. Stable CSS fallback.
9. XPath only when a maintainable alternative is unavailable.

Application routes remain relative and are centralized separately from page
behavior.

## Consequences

Page objects remain focused on application behavior rather than low-level
browser mechanics.

Reusable widgets can evolve independently from pages where their behavior is
genuinely shared.
