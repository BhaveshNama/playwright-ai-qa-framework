# NexusShop Functional Requirements

## Purpose

NexusShop is the synthetic commerce domain used to exercise the AgenticQA Nexus
automation and AI-assisted quality-engineering capabilities.

The domain is intentionally designed to provide realistic UI, API, integration,
test-data, accessibility, visual, and failure-analysis scenarios without using
client or production data.

---

# Authentication

## AUTH-REQ-001: Valid authentication

A registered active customer can sign in using valid credentials.

Expected result:

- Authentication succeeds.
- The customer enters the authenticated application area.
- The authenticated navigation state is displayed.

## AUTH-REQ-002: Invalid authentication

Authentication must be rejected when supplied credentials are invalid.

Expected result:

- Authentication does not succeed.
- A user-readable validation message is displayed.
- The application does not expose authenticated functionality.

## AUTH-REQ-003: Required credentials

Username/email and password are mandatory authentication fields.

Expected result:

- Submission is rejected when mandatory information is missing.
- Validation feedback identifies the required field.

## AUTH-REQ-004: Logout

An authenticated customer can sign out.

Expected result:

- The authenticated session ends.
- Protected application functionality is no longer available through the
  signed-out session.

---

# Registration

## REG-REQ-001: Valid registration

A new customer can create an account using valid required information.

## REG-REQ-002: Unique email

An email address already associated with an account cannot create another
account where account uniqueness is defined by email.

## REG-REQ-003: Email validation

Registration rejects an invalid email format.

## REG-REQ-004: Mandatory fields

Registration cannot complete when required information is missing.

---

# Product Catalogue

## CAT-REQ-001: Product display

Available products are displayed to the customer.

A product can expose information such as:

- name
- description
- price
- availability
- image

The test implementation must only assert fields actually defined by the
implemented application contract.

## CAT-REQ-002: Product search

A customer can search the catalogue using supported product information.

## CAT-REQ-003: Product filtering

A customer can filter the catalogue using implemented filter criteria.

## CAT-REQ-004: Product sorting

A customer can sort products using implemented sort options.

---

# Shopping Cart

## CART-REQ-001: Add product

A customer can add an available product to the shopping cart.

## CART-REQ-002: Remove product

A customer can remove an existing cart item.

## CART-REQ-003: Update quantity

A customer can update product quantity within supported limits.

## CART-REQ-004: Cart total

The cart displays a calculated total based on its applicable items and
implemented pricing rules.

Tests must not invent discounts, taxes, shipping charges, or other calculations
until those rules are explicitly implemented.

---

# Checkout

## CHK-REQ-001: Valid checkout

A customer with a valid cart can complete the implemented checkout workflow
when all mandatory information is valid.

## CHK-REQ-002: Mandatory information

Checkout is rejected if implemented mandatory customer or delivery information
is absent.

## CHK-REQ-003: Empty cart

Checkout cannot complete without products where the implemented application
requires cart content.

## CHK-REQ-004: Order confirmation

Successful checkout produces an observable order confirmation.

---

# Orders

## ORD-REQ-001: Order creation

Successful checkout creates an order.

## ORD-REQ-002: Order history

An authenticated customer can access implemented historical order information.

## ORD-REQ-003: Order details

A customer can access details for an order they are permitted to view.

---

# Quality Requirements

## NFR-001: Test independence

Automated scenarios must run independently.

## NFR-002: Parallel safety

Automated scenarios should support parallel execution and use isolated data.

## NFR-003: Failure evidence

Failed UI tests should retain applicable diagnostic evidence configured by the
Playwright framework.

## NFR-004: Secret protection

Automation source code, logs, reports, and stored fixtures must not expose
credentials, tokens, cookies, or other secrets.

## NFR-005: Environment independence

Environment-specific URLs and credentials must not be embedded directly in
test implementations.

---

# Assumptions

This document describes the target synthetic domain.

Requirements that depend on application functionality not yet implemented must
not be represented as completed automation coverage.

Implementation details and additional business rules will be added only when
the corresponding NexusShop capability exists.
