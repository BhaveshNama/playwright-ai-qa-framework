/*
 * Keep the approved tag vocabulary centralized so the repository does not
 * accumulate different names for the same execution category.
 */
export const testTags = {
  smoke: '@smoke',
  regression: '@regression',

  ui: '@ui',
  api: '@api',
  integration: '@integration',

  critical: '@critical',

  positive: '@positive',
  negative: '@negative',

  accessibility: '@accessibility',
  visual: '@visual',
} as const;

export type TestTag = (typeof testTags)[keyof typeof testTags];
