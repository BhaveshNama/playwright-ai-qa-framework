import { defineConfig, devices } from '@playwright/test';

import { environment } from './automation/config/environment.config';

const isCi = Boolean(process.env.CI);

export default defineConfig({
  /*
   * Playwright discovers all executable automation scenarios below this
   * directory. Individual projects decide which test category they execute.
   */
  testDir: './automation/tests',

  /*
   * Test files can run concurrently because framework scenarios must remain
   * independent and use isolated test data.
   */
  fullyParallel: true,

  /*
   * A committed test.only() must fail CI rather than silently reducing test
   * coverage.
   */
  forbidOnly: isCi,

  /*
   * Local retries remain disabled so failures are visible immediately.
   * CI retries provide diagnostic evidence but do not classify a retried pass
   * as a healthy test.
   */
  retries: isCi ? 2 : 0,

  /*
   * Limit CI parallelism initially while the test application and isolated
   * test-data strategy are being introduced.
   */

  /*
   * Bound local and CI concurrency to avoid browser-process contention.
   *
   * UI tests remain parallel, while Firefox and WebKit receive enough local
   * resources to complete navigation and interaction reliably.
   */
  workers: isCi ? 2 : 4,

  timeout: 30_000,

  expect: {
    timeout: 10_000,
  },

  /*
   * HTML supports local investigation. JUnit provides a machine-readable
   * result for CI integrations. Nexus JSON provides structured execution
   * evidence for AgenticQA intelligence and agent workflows.
   */
  reporter: [
    ['list'],
    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: 'never',
      },
    ],
    [
      'junit',
      {
        outputFile: 'test-results/junit.xml',
      },
    ],
    ['./automation/reporters/nexus-json.reporter.ts'],
  ],

  use: {
    /*
     * Tests navigate with relative paths instead of hard-coded environment
     * URLs.
     */
    baseURL: environment.web.baseUrl,

    /*
     * Retain diagnostic evidence only where it provides investigation value.
     */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  /*
   * Framework and service-level tests execute once. UI tests execute against
   * each supported browser.
   */
  projects: [
    {
      name: 'framework',
      testMatch: /integration\/.*\.spec\.ts/,
    },
    {
      name: 'api',
      testMatch: /api\/.*\.spec\.ts/,
      use: {
        baseURL: environment.api.baseUrl,
      },
    },
    {
      name: 'chromium',
      testMatch: /ui\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      testMatch: /ui\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit',
      testMatch: /ui\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Safari'],
      },
    },
  ],

  outputDir: 'test-results/artifacts',

  /*
   * Playwright owns the NexusShop lifecycle during test execution.
   *
   * The health endpoint is used as the readiness check so tests do not begin
   * until the application is actually accepting requests.
   */
  webServer: {
    command: 'npm run app:start',
    url: 'http://127.0.0.1:3000/health',
    reuseExistingServer: !isCi,
    timeout: 30_000,
  },
});
