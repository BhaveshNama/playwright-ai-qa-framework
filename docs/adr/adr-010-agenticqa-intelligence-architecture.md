# ADR-010: AgenticQA Intelligence Architecture

- **Status:** Accepted
- **Date:** 2026-11-04
- **Decision owners:** AgenticQA Nexus maintainers
- **Related components:** Playwright reporter, execution archive, execution history, failure analysis, flakiness analysis, cross-browser correlation, QA orchestration, AI provider abstraction, GitHub Actions CI

## Context

AgenticQA Nexus began as a Playwright and TypeScript automation framework supporting integration, API, and cross-browser UI testing against the NexusShop application.

Traditional test automation frameworks generally end their responsibility after:

```text
Test execution
      ↓
Pass/fail result
      ↓
HTML report
```

This approach provides execution output but does not retain enough structured historical evidence to answer higher-level QA questions such as:

- What type of failure occurred?
- Has the test failed previously?
- Is the result stable, intermittent, or consistently failing?
- Is the behavior specific to Chromium, Firefox, or WebKit?
- Did the observation come from a complete regression, browser-only run, targeted reproduction, framework validation, or API validation?
- Was the execution local or produced by CI?
- Is there enough evidence to make a reliable conclusion?
- Should the issue be investigated as product behavior, automation behavior, or browser-specific behavior?
- What evidence supports the recommendation?
- Should an AI provider be allowed to change tests, retries, or timeouts automatically?

AgenticQA Nexus therefore requires an intelligence architecture that converts Playwright executions into persistent, explainable, and safely governed QA evidence.

The architecture must remain operational without an external AI model, paid subscription, or API credential.

## Decision

AgenticQA Nexus will use a layered, evidence-first intelligence architecture.

```text
Playwright Execution
        ↓
Nexus JSON Reporter
        ↓
Mutable Latest Execution Report
        ↓
Immutable Execution Archive
        ↓
Segmented Execution History
        ↓
Failure Analysis
        ↓
Segmentation-Aware Flakiness Analysis
        ↓
Cross-Browser Correlation
        ↓
Deterministic QA Orchestrator
        ↓
Provider-Neutral AI Layer
        ↓
Human Review
```

The deterministic pipeline is the system of record for QA conclusions.

The AI layer is optional and advisory. It cannot override guardrails or autonomously modify the project.

## Architecture

### 1. Playwright Execution

Playwright executes several kinds of tests:

```text
Framework / Integration
API
Chromium UI
Firefox UI
WebKit UI
Targeted reproductions
```

The current validated baseline is:

| Suite                   | Tests |
| ----------------------- | ----: |
| Framework / Integration |    84 |
| API                     |    38 |
| Full Regression         |   167 |

The full regression combines framework, API, and cross-browser UI execution.

### 2. Nexus JSON Reporter

The custom Nexus JSON reporter transforms Playwright execution results into structured evidence.

The reporter records:

- Test identifier
- Test title
- Title path
- Source file
- Playwright project
- Tags
- Actual status
- Expected status
- Duration
- Retry number
- Worker index
- Error message
- Error stack
- Attachments
- Execution timestamp

The reporter writes the latest execution report to:

```text
artifacts/intelligence/test-results.json
```

The latest report is mutable because every new Playwright execution replaces it.

### 3. Canonical Run Identifier

The reporter-generated `generatedAt` timestamp is the canonical execution identifier.

```text
Reporter generatedAt
        =
Archive runId
        =
ExecutionHistory runId
```

The archive and history services must not independently generate another run identifier.

This prevents one physical execution from receiving inconsistent identities across intelligence layers.

Example:

```text
generatedAt:
2026-11-04T08:09:54.852Z

runId:
2026-11-04T08:09:54.852Z
```

The same ISO timestamp is retained as the logical identifier even when characters are normalized for filesystem compatibility.

### 4. Immutable Execution Archive

The mutable latest report must be archived before history ingestion or failure analysis.

```text
test-results.json
        ↓
Immutable archived copy
        ↓
Execution History
        +
Failure Analysis
```

Archived reports are stored under:

```text
artifacts/intelligence/runs/<safe-run-id>/test-results.json
```

Example:

```text
artifacts/intelligence/runs/
└── 2026-11-04T08-09-54.852Z/
    └── test-results.json
```

The archive service uses an exclusive copy operation.

An existing archived report cannot be silently overwritten.

If the same run is processed again, the archive service reports:

```text
alreadyArchived: true
```

and returns the existing immutable report.

This design prevents valuable failure evidence from being destroyed when a later Playwright execution replaces the mutable `test-results.json`.

### 5. Segmented Execution History

Execution History stores normalized historical observations for each test and project.

Each new run records:

```text
runType
source
scope
```

Supported run types:

```text
framework
api
full-regression
targeted
browser
unknown
```

Supported sources:

```text
local
ci
```

Supported scopes:

```text
framework
api
chromium
firefox
webkit
mixed
unknown
```

Examples:

#### Framework validation

```text
runType: framework
source: local
scope: framework
```

#### API validation

```text
runType: api
source: local
scope: api
```

#### Complete local regression

```text
runType: full-regression
source: local
scope: mixed
```

#### Targeted Firefox reproduction

```text
runType: targeted
source: local
scope: firefox
```

#### GitHub Actions regression

```text
runType: full-regression
source: ci
scope: mixed
```

The run metadata is stored at two levels:

```text
ExecutionHistory.runs[]
HistoricalTestExecution.runType
HistoricalTestExecution.runSource
HistoricalTestExecution.runScope
```

This supports both run-level auditing and execution-level filtering.

### 6. Backward Compatibility

Execution history created before segmentation does not contain the new metadata.

Legacy records remain valid with:

```text
runType: undefined
runSource: undefined
runScope: undefined
```

The system does not retroactively guess the context of older executions.

Legacy browser observations are temporarily eligible for browser-flakiness analysis so historical evidence is not discarded.

Legacy non-browser observations are excluded from browser-flakiness calculations.

A future controlled migration may classify historical evidence only when the original context can be established reliably.

### 7. Idempotent History Ingestion

The Execution History service tracks previously ingested run identifiers.

If the same `runId` is processed again:

```text
addedExecutions: 0
alreadyIngested: true
```

The archive and history layers are independently idempotent:

```text
Execution report already archived
Execution run already ingested
```

Re-running the intelligence pipeline must not duplicate reports or historical observations.

### 8. Failure Analysis

Failure Analysis consumes the immutable archived report, not the mutable latest report.

Current failure categories include:

```text
assertion
locator
navigation
timeout
network
unknown
```

Failure Analysis produces information including:

- Failure layer
- Failure category
- Confidence
- Summary
- Probable cause
- Recommendations
- Supporting evidence
- Human-review requirement

Failure Analysis is advisory.

It does not modify:

- Locators
- Tests
- Application code
- Timeouts
- Retries
- Playwright configuration

### 9. Segmentation-Aware Flakiness Analysis

Flakiness Analysis uses historical evidence, but not every execution is eligible to influence browser reliability.

The eligibility policy is:

| Evidence type                       | Eligible for browser flakiness |
| ----------------------------------- | ------------------------------ |
| Legacy browser execution            | Yes, temporarily               |
| Full regression browser observation | Yes                            |
| Browser-only run                    | Yes                            |
| Targeted browser reproduction       | Yes                            |
| Framework validation                | No                             |
| API validation                      | No                             |
| Unknown segmented execution         | No                             |
| Legacy non-browser execution        | No                             |

Framework and API executions must not contaminate UI browser-flakiness classifications.

The service reports:

```text
totalHistoricalExecutions
eligibleExecutions
excludedExecutions
totalGroups
classifications
```

This makes the filtering decision visible and auditable.

### 10. Historical Evidence Threshold

AgenticQA Nexus does not classify a test as flaky after one failure.

The current minimum threshold is:

```text
3 comparable historical observations
```

Possible classifications include:

```text
INSUFFICIENT_HISTORY
STABLE
INTERMITTENT
CONSISTENTLY_FAILING
```

Confidence increases with available observations:

```text
Fewer than 5 observations → low confidence
5 or more observations    → medium confidence
10 or more observations   → high confidence
```

This reduces false flaky-test conclusions caused by isolated failures.

### 11. Cross-Browser Correlation

Cross-browser analysis compares eligible observations across:

```text
Chromium
Firefox
WebKit
```

The analysis distinguishes patterns such as:

```text
Stable across browsers
Browser-specific intermittency
Insufficient cross-browser evidence
```

A browser-specific conclusion requires evidence from more than one browser project.

This prevents a failure in one project from being interpreted as a general product failure without comparative evidence.

### 12. Deterministic QA Orchestration

The QA Orchestrator combines:

- Current failure classification
- Historical behavior
- Flakiness classification
- Cross-browser correlation
- Confidence
- Available evidence

Possible decisions include:

```text
MONITOR
COLLECT_MORE_EVIDENCE
INVESTIGATE_AUTOMATION
INVESTIGATE_BROWSER_SPECIFIC
INVESTIGATE_PRODUCT
HUMAN_REVIEW
```

The orchestrator also provides:

- Priority
- Confidence
- Summary
- Rationale
- Recommended actions
- Human-review requirement
- Guardrail status

The deterministic orchestrator remains the control boundary even when an AI provider is enabled.

### 13. Provider-Neutral AI Layer

The AI layer uses a provider-neutral interface.

```text
AiProvider
├── DisabledAiProvider
├── OpenAI            future
├── Azure OpenAI      future
└── Anthropic         future
```

The current operating mode is:

```env
AI_PROVIDER=disabled
AI_API_KEY=
```

No paid AI subscription or external model credential is required.

With AI disabled:

- No external request is made
- Deterministic intelligence remains operational
- QA orchestration remains operational
- Existing recommendations are preserved
- Human review remains required

A future provider may generate investigation hypotheses or recommendations, but it cannot override deterministic guardrails.

### 14. Bounded Autonomy

AgenticQA Nexus prevents autonomous modification of consequential engineering settings.

Current guardrails:

```text
Autonomous code modification:     false
Autonomous retry modification:    false
Autonomous timeout modification:  false
Human approval required:          true
```

The system must not automatically:

- Rewrite locators
- Increase timeouts
- Enable retries
- Edit tests
- Edit application code
- Commit changes
- Push changes
- Suppress a failing regression

The permitted workflow is:

```text
Evidence
   ↓
Deterministic analysis
   ↓
Optional AI recommendation
   ↓
Human review
   ↓
Approved engineering action
```

### 15. CI Evidence Preservation

GitHub Actions runs the complete regression and processes intelligence even when the regression exits with a failure.

```text
Quality Gates
      ↓
Full Regression
      ↓
PASS or FAIL
      ↓
Preserve and Analyze Evidence
      ↓
Upload Diagnostic Artifacts
```

CI assigns:

```text
runType: full-regression
source: ci
scope: mixed
```

The intelligence step runs only when the Playwright reporter produced:

```text
artifacts/intelligence/test-results.json
```

This prevents intelligence from running after unrelated failures such as:

- Dependency installation failure
- Browser installation failure
- Quality-gate failure before test execution
- Missing execution report

Artifact upload remains configured with `always()` so available evidence is retained regardless of the final job result.

### 16. CI Failure Semantics

Intelligence processing must not hide a failed regression.

If `npm test` fails:

```text
Regression step → failed
Intelligence    → still executes
Artifacts       → still upload
Overall job     → remains failed
```

The intelligence pipeline exists to preserve and explain failure evidence, not to convert a failing quality gate into a passing result.

### 17. CI Execution Optimization

The complete `npm test` command already includes:

- Framework tests
- API tests
- Cross-browser UI tests

GitHub Actions therefore runs the full regression once instead of separately executing:

```text
npm run test:framework
npm run test:api
npm test
```

This reduces duplicate execution, CI runtime, and accidental overwriting of intermediate reports.

## Alternatives Considered

### Alternative 1: Analyze only the latest Playwright report

Rejected because every new Playwright command overwrites the latest report.

This caused earlier full-regression failure evidence to be lost when a targeted reproduction was executed.

### Alternative 2: Generate a second run identifier in the archive service

Rejected because the report, archive, and history could refer to the same execution using different identifiers.

The reporter's `generatedAt` value is therefore the canonical identifier.

### Alternative 3: Treat every execution as equivalent historical evidence

Rejected because framework, API, full-regression, browser-only, and targeted runs have different purposes.

Mixing them weakens reliability conclusions and may contaminate browser-flakiness analysis.

### Alternative 4: Infer run type from test count

Rejected because counts change as tests are added or removed.

Examples such as 84 framework tests, 38 API tests, or 167 full-regression tests are validated baselines, not stable execution identifiers.

The caller must supply explicit execution context.

### Alternative 5: Enable automatic retries or increase timeouts after a timeout

Rejected because a single timeout does not prove that a test needs a larger timeout or retry policy.

AgenticQA requires comparable historical evidence and human review before consequential configuration changes.

### Alternative 6: Allow AI to rewrite tests automatically

Rejected because model output may be incomplete, incorrect, or unsupported by execution evidence.

AI remains advisory and cannot cross the deterministic orchestration boundary.

### Alternative 7: Require a real AI provider for intelligence processing

Rejected because failure classification, historical analysis, flakiness detection, cross-browser correlation, and orchestration are deterministic capabilities.

The framework must remain useful offline and without paid AI credentials.

## Consequences

### Positive

- Playwright evidence survives later executions.
- Failed regression evidence can be investigated after targeted reproduction.
- Run context is explicit and auditable.
- Local and CI evidence can be distinguished.
- Framework and API runs do not contaminate browser-flakiness calculations.
- History ingestion remains backward compatible.
- Duplicate archive and ingestion operations are prevented.
- QA decisions remain evidence-based and explainable.
- The framework operates without an external AI provider.
- CI preserves failure evidence without hiding regression failures.
- Human approval remains the final control for consequential actions.

### Negative

- Runtime intelligence artifacts consume additional storage.
- Archive retention will eventually require a defined cleanup policy.
- Legacy observations have incomplete metadata.
- Callers must supply correct execution context.
- Historical filtering adds complexity to the intelligence pipeline.
- CI artifacts may grow as execution history and archived reports increase.
- Targeted reproductions from the same environment may be correlated and should not be treated as fully independent evidence.

### Risks

#### Incorrect run context

A caller could label targeted evidence as a full regression.

Mitigation:

- Validate allowed runtime values.
- Provide explicit npm scripts.
- Set CI metadata directly in GitHub Actions.
- Reject unsupported values.

#### Archive growth

Immutable reports may accumulate indefinitely.

Mitigation:

- Keep runtime artifacts outside source control.
- Use GitHub Actions retention settings.
- Add an archive-retention policy in a future milestone.

#### Legacy evidence ambiguity

Older executions do not contain segmentation metadata.

Mitigation:

- Preserve only legacy browser observations temporarily.
- Exclude legacy non-browser evidence from browser-flakiness analysis.
- Avoid retroactive inference without reliable source information.

#### False confidence from repeated targeted runs

Multiple targeted executions from the same environment may be highly correlated.

Mitigation:

- Retain run source and scope.
- Require minimum historical evidence.
- Consider future time-window and environment segmentation.
- Keep human review mandatory.

## Operational Workflow

### Complete local regression

```bash
npm test
npm run intelligence:full
```

Stored context:

```text
full-regression / local / mixed
```

### API execution

```bash
npm run test:api
npm run intelligence:api
```

Stored context:

```text
api / local / api
```

### Framework execution

```bash
npm run test:framework
npm run intelligence:framework
```

Stored context:

```text
framework / local / framework
```

### Targeted Firefox reproduction

```bash
npx playwright test <test-file> --project=firefox --grep "<test-id>"
npm run intelligence:targeted:firefox
```

Stored context:

```text
targeted / local / firefox
```

### GitHub Actions regression

GitHub Actions supplies:

```text
full-regression / ci / mixed
```

and runs intelligence whenever a Playwright execution report exists.

## Validation

The architecture is protected by integration tests including:

```text
CFG-073  New execution ingestion
CFG-074  Duplicate-ingestion prevention
CFG-075  Zero-failure analysis
CFG-076  Failure-analysis generation
CFG-077  Invalid-schema rejection
CFG-078  Deterministic orchestration preservation
CFG-079  Disabled-AI guardrail preservation
CFG-080  Missing-source error handling
CFG-081  Inclusion of targeted browser evidence
CFG-082  Exclusion of framework and API evidence
CFG-083  Immutable report archival using reporter runId
CFG-084  Archived report overwrite prevention
```

The validated project baseline is:

```text
Framework / Integration     84 passed
API                         38 passed
Full Regression            167 passed
Intelligence Pipeline       12 passed
```

GitHub Actions also validates the full workflow and preserves intelligence artifacts.

## Future Work

Planned improvements include:

- Archive-retention policy
- Historical trend reporting
- Reliability scoring
- Environment and branch segmentation
- Commit SHA and pull-request metadata
- CI run identifier metadata
- Consolidated intelligence summary
- Failure-cluster analysis
- Time-window-aware flakiness classification
- Distinction between repeated local reproductions and independent CI evidence
- Additional architecture decision records
- Real AI-provider implementation when legitimate credentials are available
- AI-assisted root-cause recommendations
- Test-generation advisor
- Human-approved self-healing recommendations

## Decision Outcome

AgenticQA Nexus adopts an evidence-first, deterministic, segmented, immutable, and human-governed QA intelligence architecture.

The system does not depend on AI to produce useful intelligence.

AI may extend investigation quality in the future, but deterministic evidence, explicit guardrails, CI quality gates, and human approval remain authoritative.
