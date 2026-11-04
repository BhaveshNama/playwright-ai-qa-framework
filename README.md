# AgenticQA Nexus

AgenticQA Nexus is a production-style QA automation and execution-intelligence platform built with Playwright and TypeScript.

It combines UI, API, integration, and cross-browser testing with structured execution evidence, historical analysis, failure classification, flaky-test detection, cross-browser correlation, deterministic QA orchestration, bounded AI integration, and human-review guardrails.

The repository also includes **NexusShop**, a local application used as the system under test, allowing the framework to demonstrate realistic end-to-end QA workflows without depending on an external application.

---

## Overview

Traditional automation frameworks often stop after executing tests and generating reports.

AgenticQA Nexus extends that workflow by transforming test execution data into structured QA intelligence.

```text
Test Execution
      ↓
Structured Evidence
      ↓
Execution History
      ↓
Failure Analysis
      ↓
Flakiness Analysis
      ↓
Cross-Browser Correlation
      ↓
QA Orchestration
      ↓
Optional AI Analysis
      ↓
Human Review
```

The deterministic intelligence pipeline works independently of any external AI model.

---

## Why This Project Exists

Modern QA engineering requires more than executing automated tests.

A mature automation platform should help answer questions such as:

- What failed?
- What type of failure occurred?
- Has this test failed before?
- Is the behavior intermittent?
- Is the issue isolated to one browser?
- Is there enough evidence to make a reliable conclusion?
- Should the issue be investigated as product behavior, automation behavior, or browser-specific behavior?
- What diagnostic evidence supports the decision?
- Should automation be allowed to modify anything automatically?

AgenticQA Nexus explores these questions using structured evidence and deterministic decision rules before introducing optional AI reasoning.

---

## Key Capabilities

- Playwright automation with TypeScript
- UI automation
- REST API testing
- Integration and service-level testing
- Chromium, Firefox, and WebKit execution
- Page Object Model
- Reusable UI components
- Test-data factories
- Positive, negative, smoke, regression, and critical test tagging
- Custom Nexus JSON reporter
- Structured execution evidence
- Persistent execution history
- Idempotent execution-history ingestion
- Failure Analysis Agent
- Flaky Test Detection Agent
- Cross-browser correlation
- Confidence classification
- Deterministic QA Orchestrator
- Investigation priority classification
- Bounded-autonomy guardrails
- Provider-neutral AI interface
- Offline AI-disabled operating mode
- ESLint quality gates
- Prettier formatting
- TypeScript strict validation
- Environment validation
- GitHub Actions CI
- Playwright screenshots, videos, HTML reports, and diagnostic artifacts

---

## Architecture

```text
                     ┌──────────────────┐
                     │    NexusShop     │
                     │ System Under Test│
                     └────────┬─────────┘
                              ↓
                     ┌──────────────────┐
                     │ Playwright Tests │
                     │ UI / API / CFG   │
                     └────────┬─────────┘
                              ↓
                     ┌──────────────────┐
                     │ Nexus JSON       │
                     │ Reporter         │
                     └────────┬─────────┘
                              ↓
                     Structured Evidence
                              ↓
                ┌─────────────┴─────────────┐
                ↓                           ↓
        Execution History             Failure Analysis
                ↓                           ↓
        Flakiness Analysis             Failure Signals
                ↓                           │
     Cross-Browser Correlation               │
                └─────────────┬──────────────┘
                              ↓
                     ┌──────────────────┐
                     │ QA Orchestrator  │
                     └────────┬─────────┘
                              ↓
                    Deterministic Decision
                              ↓
                     Bounded Guardrails
                              ↓
                     AI Provider Layer
                              ↓
                       Human Review
```

The deterministic QA Orchestrator remains the control boundary even when a real AI provider is introduced in the future.

---

## Technology Stack

| Area             | Technology                              |
| ---------------- | --------------------------------------- |
| Automation       | Playwright                              |
| Language         | TypeScript                              |
| Runtime          | Node.js                                 |
| Validation       | Zod                                     |
| Linting          | ESLint                                  |
| Formatting       | Prettier                                |
| CI/CD            | GitHub Actions                          |
| Test Application | NexusShop                               |
| Browsers         | Chromium, Firefox, WebKit               |
| AI Architecture  | Provider-neutral `AiProvider` interface |

---

## Current Test Baseline

Validated locally:

| Suite                   | Tests |
| ----------------------- | ----: |
| Framework / Integration |    84 |
| API                     |    38 |
| Full Regression         |   167 |

The full regression combines framework, API, and cross-browser UI execution.

Run the complete regression with:

```bash
npm test
```

---

## NexusShop Test Application

NexusShop is the local system under test included in this repository.

It provides realistic workflows for:

- Authentication
- Product catalogue
- Shopping cart
- Checkout
- Order creation
- Order retrieval
- Order lifecycle transitions
- Order cancellation
- Session isolation
- Positive and negative API scenarios

This keeps the project self-contained and allows UI, API, service, and intelligence capabilities to be demonstrated together.

---

## Test Architecture

AgenticQA Nexus separates tests by responsibility.

```text
automation/tests/
├── integration/
├── api/
└── ui/
    ├── authentication/
    ├── cart/
    ├── catalogue/
    └── checkout/
```

### Framework / Integration

Validates application services, configuration, test-data factories, intelligence components, AI provider behavior, and QA orchestration.

### API

Validates NexusShop REST behavior independently of the browser UI.

### UI

Validates user journeys across Chromium, Firefox, and WebKit.

---

## Execution Intelligence

AgenticQA Nexus uses a custom Playwright reporter to convert test executions into structured evidence.

The intelligence pipeline maintains information including:

- Test identity
- Test title
- Project or browser
- Status
- Duration
- Retry information
- Error message
- Error stack
- Screenshots
- Videos
- Error context
- Execution timestamp

The primary reporter output is:

```text
artifacts/intelligence/test-results.json
```

Execution history is idempotent. The same execution run cannot be ingested repeatedly into historical intelligence.

---

## Failure Analysis

The Failure Analysis Agent examines failed execution evidence and classifies failures.

Current categories include:

```text
assertion
locator
navigation
timeout
network
unknown
```

The analysis can produce:

- Failure layer
- Failure category
- Confidence
- Summary
- Probable cause
- Investigation recommendations
- Supporting evidence
- Human-review requirement

The agent is advisory and does not automatically modify tests or application code.

---

## Flaky Test Detection

The Flaky Test Detection Agent uses historical execution evidence rather than labeling a test flaky after a single failure.

Possible classifications include:

```text
INSUFFICIENT_HISTORY
STABLE
INTERMITTENT
CONSISTENTLY_FAILING
```

The current minimum classification threshold is:

```text
3 executions
```

Confidence increases as additional evidence becomes available:

```text
Less than 5 executions → low confidence
5+ executions          → medium confidence
10+ executions         → high confidence
```

This prevents a single failure from automatically being treated as flaky behavior.

---

## Cross-Browser Intelligence

AgenticQA Nexus correlates historical results across:

- Chromium
- Firefox
- WebKit

During development, a real intermittent scenario was observed for `CART-003`.

```text
CART-003 | cart | removes a product from the cart

Chromium → STABLE
Firefox  → INTERMITTENT
WebKit   → STABLE

Cross-browser result:
BROWSER_SPECIFIC_INTERMITTENT
```

The evidence consisted of:

```text
Chromium: 3 passed / 0 failed
Firefox:  2 passed / 1 failed
WebKit:   3 passed / 0 failed
```

This allowed the framework to distinguish browser-specific intermittency from a general application or test failure.

---

## QA Orchestration

The deterministic QA Orchestrator combines signals from:

- Failure Analysis
- Historical execution behavior
- Flaky Test Detection
- Cross-browser correlation
- Confidence information

Possible decisions include:

```text
MONITOR
COLLECT_MORE_EVIDENCE
INVESTIGATE_AUTOMATION
INVESTIGATE_BROWSER_SPECIFIC
INVESTIGATE_PRODUCT
HUMAN_REVIEW
```

The orchestrator also determines:

- Priority
- Overall confidence
- Rationale
- Recommended investigation actions
- Human-review requirement

---

## Example Intelligence Decision

The development-time Firefox `CART-003` scenario produced evidence equivalent to:

```text
Failure layer:
ui

Failure category:
assertion

Historical classification:
INTERMITTENT

Historical executions:
3

Historical failure rate:
33%

Cross-browser classification:
BROWSER_SPECIFIC_INTERMITTENT

Affected browser:
firefox

Stable browsers:
chromium
webkit
```

The QA Orchestrator produced:

```text
Decision:
INVESTIGATE_BROWSER_SPECIFIC

Priority:
high

Confidence:
low

Human review:
required
```

The low confidence is intentional because only three observations per browser were available.

---

## Bounded Autonomy and Guardrails

AgenticQA Nexus intentionally prevents autonomous modification of the codebase.

Current guardrails:

```text
Autonomous code modification:     false
Autonomous retry modification:    false
Autonomous timeout modification:  false
Human approval required:          true
```

The system does not automatically:

- Rewrite locators
- Increase Playwright timeouts
- Enable retries
- Edit test code
- Edit application code
- Commit changes
- Push changes

AI output is advisory only.

This provides a bounded workflow:

```text
Evidence
   ↓
Analysis
   ↓
Recommendation
   ↓
Human Review
   ↓
Approved Action
```

---

## AI Provider Architecture

The AI layer is designed around a vendor-neutral provider interface.

```text
AiProvider
├── DisabledAiProvider      implemented
├── OpenAI                  future
├── Azure OpenAI            future
└── Anthropic               future
```

A provider receives deterministic orchestration evidence and can return:

- Investigation summary
- Root-cause hypotheses
- Investigation recommendations
- Confidence

The AI layer cannot override deterministic guardrails.

---

## Running Without an AI Subscription

AgenticQA Nexus does **not** require a paid AI subscription or external AI credential.

Current local and CI mode:

```env
AI_PROVIDER=disabled
AI_API_KEY=
```

With this configuration:

- No external AI request is made
- No API credential is required
- Failure Analysis remains operational
- Execution History remains operational
- Flakiness Analysis remains operational
- Cross-browser correlation remains operational
- QA Orchestration remains operational
- Deterministic recommendations remain available
- Human review remains required

A real provider can later implement the existing `AiProvider` interface without redesigning the core intelligence architecture.

---

## Installation

Clone the repository:

```bash
git clone https://github.com/BhaveshNama/playwright-ai-qa-framework.git
cd playwright-ai-qa-framework
```

Install dependencies:

```bash
npm ci
```

Install Playwright browsers:

```bash
npx playwright install
```

Create the local environment configuration using `.env.example` as the template.

Never commit real passwords, tokens, or API keys.

---

## Environment Configuration

Example local configuration:

```env
TEST_ENV=local
LOG_LEVEL=info

BASE_URL=http://127.0.0.1:3000
API_BASE_URL=http://127.0.0.1:3000

AI_PROVIDER=disabled
AI_API_KEY=

NEXUS_SHOP_HOST=127.0.0.1
NEXUS_SHOP_PORT=3000
```

---

## Running the Application

Start NexusShop:

```bash
npm run app:start
```

Check application health:

```bash
npm run app:health
```

---

## Running Tests

### Framework / Integration

```bash
npm run test:framework
```

### API

```bash
npm run test:api
```

### Chromium

```bash
npm run test:chromium
```

### Headed Chromium

```bash
npm run test:headed
```

### Playwright UI Mode

```bash
npm run test:ui-mode
```

### Complete Regression

```bash
npm test
```

---

## Quality Gates

Run:

```bash
npm run quality
```

The quality pipeline performs:

```text
Prettier formatting check
        ↓
ESLint
        ↓
TypeScript type checking
        ↓
Environment validation
```

Individual commands are also available:

```bash
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run env:check
```

---

## Running Intelligence Analysis

After Playwright generates execution evidence, run:

```bash
npm run intelligence
```

The unified intelligence pipeline performs:

```text
Execution Results
       ↓
Execution History
       ↓
Failure Analysis
       ↓
Flakiness Analysis
       ↓
Cross-Browser Analysis
       ↓
QA Orchestration
       ↓
AI Provider Analysis
```

When AI is disabled, the final stage runs locally without any external model call.

---

## Reports and Artifacts

Runtime intelligence files are generated under:

```text
artifacts/intelligence/
```

The intelligence pipeline can generate:

```text
test-results.json
execution-history.json
failure-analysis.json
flaky-test-analysis.json
qa-orchestration.json
ai-analysis.json
```

Playwright also provides diagnostic artifacts including:

- HTML reports
- Screenshots
- Videos
- Error context
- Stack traces

Open the Playwright HTML report with:

```bash
npm run report
```

---

## GitHub Actions CI

AgenticQA Nexus includes a GitHub Actions CI workflow for pushes and pull requests targeting `main`.

The CI pipeline validates:

```text
Repository Checkout
       ↓
Node.js Setup
       ↓
npm ci
       ↓
Playwright Browser Installation
       ↓
Quality Gates
       ↓
Framework Tests
       ↓
API Tests
       ↓
Full Regression
       ↓
Intelligence Pipeline
       ↓
Artifact Upload
```

CI runs with:

```env
AI_PROVIDER=disabled
AI_API_KEY=
```

No AI credential is required.

Diagnostic artifacts are uploaded even when test execution fails, helping preserve evidence for investigation.

---

## Repository Structure

```text
.github/
└── workflows/
    └── ci.yml

apps/
└── nexus-shop/
    └── src/

automation/
├── components/
├── config/
├── fixtures/
├── intelligence/
│   ├── agents/
│   ├── ai/
│   │   └── providers/
│   ├── models/
│   ├── orchestrators/
│   ├── runners/
│   └── services/
├── pages/
├── reporters/
├── test-data/
└── tests/
    ├── api/
    ├── integration/
    └── ui/

docs/
├── adr/
├── requirements/
└── standards/

scripts/
```

---

## Design Principles

AgenticQA Nexus follows these principles:

1. **Evidence before inference**
2. **Deterministic reasoning before AI reasoning**
3. **Historical evidence before declaring flakiness**
4. **Cross-browser comparison before browser-specific conclusions**
5. **Typed contracts between intelligence layers**
6. **Provider-neutral AI integration**
7. **AI remains advisory**
8. **Human approval controls consequential changes**
9. **Generated runtime artifacts remain separate from source code**
10. **Quality gates protect every engineering milestone**
11. **The framework remains useful without an AI provider**
12. **Intelligence should explain its decision using evidence**

---

## Engineering Milestones

The project has progressed through several distinct engineering milestones:

```text
NexusShop application
        ↓
Playwright test architecture
        ↓
API and service coverage
        ↓
Cross-browser UI coverage
        ↓
Custom execution reporter
        ↓
Failure Analysis Agent
        ↓
Persistent execution history
        ↓
Flaky Test Detection Agent
        ↓
Cross-browser correlation
        ↓
QA Orchestrator
        ↓
Bounded AI provider architecture
        ↓
Unified intelligence pipeline
        ↓
GitHub Actions CI
```

Each major capability is tracked through focused Git commits and regression tests.

---

## Roadmap

Planned extensions include:

- Pipeline-level regression tests
- Enhanced execution-history segmentation
- Coverage intelligence
- Consolidated intelligence reporting
- CI execution optimization
- Additional architecture decision records
- Historical trend reporting
- Test reliability scoring
- Real LLM provider integration when credentials become available
- AI-assisted root-cause investigation
- Test-generation advisor
- Self-healing recommendation engine with human approval
- Intelligence dashboard
- Release-quality gates based on deterministic evidence

A real LLM provider is deliberately **not a dependency** for the current framework.

---

## Status

AgenticQA Nexus currently supports:

- Production-style Playwright automation architecture
- UI, API, and integration testing
- Cross-browser execution
- Structured execution evidence
- Historical intelligence
- Failure classification
- Flaky-test detection
- Cross-browser correlation
- Deterministic QA orchestration
- Bounded-autonomy guardrails
- Optional AI-provider architecture
- Offline operation without AI credentials
- Unified intelligence processing
- Automated GitHub Actions validation

The framework is designed so deterministic QA intelligence remains useful independently, while future AI capabilities can be added as an advisory layer without weakening existing safety boundaries.
