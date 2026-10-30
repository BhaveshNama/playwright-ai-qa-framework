/*
 * Test identifiers encode the functional area and scenario intent.
 *
 * IDs should remain stable even when implementation files or test titles
 * change, allowing future reporting and AI analysis to correlate executions.
 */
export const testAreas = {
  authentication: 'AUTH',
  registration: 'REG',
  catalogue: 'CAT',
  cart: 'CART',
  checkout: 'CHK',
  orders: 'ORD',
  api: 'API',
  configuration: 'CFG',
} as const;

export type TestArea = (typeof testAreas)[keyof typeof testAreas];

/*
 * Generates a normalized test identifier without adding business meaning that
 * was not supplied by the caller.
 */
export function createTestCaseId(area: TestArea, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence <= 0) {
    throw new Error(`Test-case sequence must be a positive integer. Received: ${sequence}`);
  }

  return `${area}-${String(sequence).padStart(3, '0')}`;
}
