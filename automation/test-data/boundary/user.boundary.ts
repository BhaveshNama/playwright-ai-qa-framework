/*
 * Boundary datasets must remain deterministic.
 *
 * Faker should not generate values representing exact business-rule
 * boundaries because those values need to be identical between executions.
 */
export const userBoundaryData = {
  emptyValue: '',
  singleCharacter: 'A',
  whitespaceOnly: '   ',
} as const;
